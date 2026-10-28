using System.Data;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Branches;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class BranchService : IBranchService
{
    private readonly IUnitOfWork unitOfWork;
    private readonly IBranchContextAccessor branchContextAccessor;

    public BranchService(IUnitOfWork unitOfWork, IBranchContextAccessor branchContextAccessor)
    {
        this.unitOfWork = unitOfWork;
        this.branchContextAccessor = branchContextAccessor;
    }

    private string GetActiveBranchId() =>
        branchContextAccessor.BranchId
        ?? throw new InvalidOperationException("An authenticated branch context is required.");

    public async Task<IReadOnlyList<BranchResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var branchId = GetActiveBranchId();
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var list = new List<BranchResponse>();
            await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
            command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            command.BindByName = true;
            command.CommandText = """
                SELECT b.id, b.BranchName, b.Address,
                       NVL((SELECT COUNT(*) FROM USERS u WHERE u.BranchId = b.id AND u.IsActive = 1), 0) AS ActiveUsersCount,
                       NVL((SELECT COUNT(*) FROM INVOICES i WHERE i.BranchId = b.id), 0) AS TotalInvoicesCount
                FROM BRANCHES b
                ORDER BY b.BranchName
                """;

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(new BranchResponse(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.IsDBNull(2) ? null : reader.GetString(2),
                    Convert.ToInt32(reader.GetValue(3)),
                    Convert.ToInt32(reader.GetValue(4))));
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return list;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<BranchResponse?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return null;

        var branchId = GetActiveBranchId();
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
            command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            command.BindByName = true;
            command.CommandText = """
                SELECT b.id, b.BranchName, b.Address,
                       NVL((SELECT COUNT(*) FROM USERS u WHERE u.BranchId = b.id AND u.IsActive = 1), 0) AS ActiveUsersCount,
                       NVL((SELECT COUNT(*) FROM INVOICES i WHERE i.BranchId = b.id), 0) AS TotalInvoicesCount
                FROM BRANCHES b
                WHERE b.id = :id
                """;
            command.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, id.Trim(), ParameterDirection.Input));

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return null;
            }

            var response = new BranchResponse(
                reader.GetString(0),
                reader.GetString(1),
                reader.IsDBNull(2) ? null : reader.GetString(2),
                Convert.ToInt32(reader.GetValue(3)),
                Convert.ToInt32(reader.GetValue(4)));

            await unitOfWork.CommitAsync(cancellationToken);
            return response;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<BranchResponse> CreateAsync(CreateBranchRequest request, CancellationToken cancellationToken = default)
    {
        if (request is null)
            throw new ArgumentNullException(nameof(request));

        if (string.IsNullOrWhiteSpace(request.Id))
            throw new ArgumentException("Mã chi nhánh không được để trống.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.BranchName))
            throw new ArgumentException("Tên chi nhánh không được để trống.", nameof(request));

        var branchId = GetActiveBranchId();
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            // Kiểm tra trùng mã
            await using (var checkCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                checkCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                checkCmd.BindByName = true;
                checkCmd.CommandText = "SELECT COUNT(*) FROM BRANCHES WHERE id = :id";
                checkCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, request.Id.Trim(), ParameterDirection.Input));
                var existing = Convert.ToInt32(await checkCmd.ExecuteScalarAsync(cancellationToken));
                if (existing > 0)
                {
                    throw new InvalidOperationException($"Chi nhánh có mã '{request.Id}' đã tồn tại.");
                }
            }

            await using (var insertCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                insertCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                insertCmd.BindByName = true;
                insertCmd.CommandText = """
                    INSERT INTO BRANCHES (id, BranchName, Address)
                    VALUES (:id, :BranchName, :Address)
                    """;
                insertCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, request.Id.Trim(), ParameterDirection.Input));
                insertCmd.Parameters.Add(new OracleParameter("BranchName", OracleDbType.Varchar2, request.BranchName.Trim(), ParameterDirection.Input));
                insertCmd.Parameters.Add(new OracleParameter("Address", OracleDbType.Varchar2, (object?)request.Address?.Trim() ?? DBNull.Value, ParameterDirection.Input));

                await insertCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            await unitOfWork.CommitAsync(cancellationToken);

            return new BranchResponse(
                request.Id.Trim(),
                request.BranchName.Trim(),
                request.Address?.Trim(),
                0,
                0);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<BranchResponse> UpdateAsync(string id, UpdateBranchRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("Mã chi nhánh không hợp lệ.", nameof(id));

        if (request is null)
            throw new ArgumentNullException(nameof(request));

        if (string.IsNullOrWhiteSpace(request.BranchName))
            throw new ArgumentException("Tên chi nhánh không được để trống.", nameof(request));

        var branchId = GetActiveBranchId();
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            await using (var updateCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                updateCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                updateCmd.BindByName = true;
                updateCmd.CommandText = """
                    UPDATE BRANCHES
                    SET BranchName = :BranchName,
                        Address = :Address
                    WHERE id = :id
                    """;
                updateCmd.Parameters.Add(new OracleParameter("BranchName", OracleDbType.Varchar2, request.BranchName.Trim(), ParameterDirection.Input));
                updateCmd.Parameters.Add(new OracleParameter("Address", OracleDbType.Varchar2, (object?)request.Address?.Trim() ?? DBNull.Value, ParameterDirection.Input));
                updateCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, id.Trim(), ParameterDirection.Input));

                var rows = await updateCmd.ExecuteNonQueryAsync(cancellationToken);
                if (rows == 0)
                {
                    throw new InvalidOperationException($"Không tìm thấy chi nhánh '{id}'.");
                }
            }

            // Lấy lại thông tin sau cập nhật
            BranchResponse result;
            await using (var selectCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                selectCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                selectCmd.BindByName = true;
                selectCmd.CommandText = """
                    SELECT b.id, b.BranchName, b.Address,
                           NVL((SELECT COUNT(*) FROM USERS u WHERE u.BranchId = b.id AND u.IsActive = 1), 0) AS ActiveUsersCount,
                           NVL((SELECT COUNT(*) FROM INVOICES i WHERE i.BranchId = b.id), 0) AS TotalInvoicesCount
                    FROM BRANCHES b
                    WHERE b.id = :id
                    """;
                selectCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, id.Trim(), ParameterDirection.Input));

                await using var reader = await selectCmd.ExecuteReaderAsync(cancellationToken);
                await reader.ReadAsync(cancellationToken);
                result = new BranchResponse(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.IsDBNull(2) ? null : reader.GetString(2),
                    Convert.ToInt32(reader.GetValue(3)),
                    Convert.ToInt32(reader.GetValue(4)));
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return result;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
