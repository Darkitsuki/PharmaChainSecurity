using System.Data;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Procurement;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class SupplierService : ISupplierService
{
    private readonly IUnitOfWork unitOfWork;
    private readonly IBranchContextAccessor branchContextAccessor;

    public SupplierService(IUnitOfWork unitOfWork, IBranchContextAccessor branchContextAccessor)
    {
        this.unitOfWork = unitOfWork;
        this.branchContextAccessor = branchContextAccessor;
    }

    private string GetActiveBranchId() =>
        branchContextAccessor.BranchId ?? "br-00000000-0000-0000-0000-000000000001";

    public async Task<IReadOnlyList<SupplierResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var branchId = GetActiveBranchId();
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var list = new List<SupplierResponse>();
            await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
            command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            command.BindByName = true;
            command.CommandText = """
                SELECT id, SupplierCode, SupplierName, ContactPerson, PhoneNumber, Email, Address, TaxCode, IsActive, CreatedDate
                FROM SUPPLIERS
                WHERE IsActive = 1
                ORDER BY SupplierName
                """;

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(new SupplierResponse(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.IsDBNull(3) ? null : reader.GetString(3),
                    reader.IsDBNull(4) ? null : reader.GetString(4),
                    reader.IsDBNull(5) ? null : reader.GetString(5),
                    reader.IsDBNull(6) ? null : reader.GetString(6),
                    reader.IsDBNull(7) ? null : reader.GetString(7),
                    reader.GetInt32(8) == 1,
                    reader.GetDateTime(9)));
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

    public async Task<SupplierResponse?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
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
                SELECT id, SupplierCode, SupplierName, ContactPerson, PhoneNumber, Email, Address, TaxCode, IsActive, CreatedDate
                FROM SUPPLIERS
                WHERE id = :id
                """;
            command.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;

            await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return null;
            }

            var supplier = new SupplierResponse(
                reader.GetString(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.IsDBNull(3) ? null : reader.GetString(3),
                reader.IsDBNull(4) ? null : reader.GetString(4),
                reader.IsDBNull(5) ? null : reader.GetString(5),
                reader.IsDBNull(6) ? null : reader.GetString(6),
                reader.IsDBNull(7) ? null : reader.GetString(7),
                reader.GetInt32(8) == 1,
                reader.GetDateTime(9));

            await unitOfWork.CommitAsync(cancellationToken);
            return supplier;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<SupplierResponse> CreateAsync(CreateSupplierRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.SupplierCode))
            throw new ArgumentException("Supplier code is required.");
        if (string.IsNullOrWhiteSpace(request.SupplierName))
            throw new ArgumentException("Supplier name is required.");

        var branchId = GetActiveBranchId();
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            // Check duplicate code
            await using var checkCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
            checkCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            checkCmd.BindByName = true;
            checkCmd.CommandText = "SELECT COUNT(1) FROM SUPPLIERS WHERE UPPER(SupplierCode) = UPPER(:code)";
            checkCmd.Parameters.Add("code", OracleDbType.Varchar2, 50).Value = request.SupplierCode.Trim();
            var count = Convert.ToInt32(await checkCmd.ExecuteScalarAsync(cancellationToken));
            if (count > 0)
                throw new InvalidOperationException($"Nhà cung cấp có mã '{request.SupplierCode}' đã tồn tại.");

            var newId = $"sup-{Guid.NewGuid():N}"[..36];
            var now = DateTime.UtcNow;

            await using var insertCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
            insertCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            insertCmd.BindByName = true;
            insertCmd.CommandText = """
                INSERT INTO SUPPLIERS (id, SupplierCode, SupplierName, ContactPerson, PhoneNumber, Email, Address, TaxCode, IsActive, CreatedDate)
                VALUES (:id, :code, :name, :contact, :phone, :email, :address, :tax, 1, :createdDate)
                """;
            insertCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = newId;
            insertCmd.Parameters.Add("code", OracleDbType.Varchar2, 50).Value = request.SupplierCode.Trim();
            insertCmd.Parameters.Add("name", OracleDbType.Varchar2, 255).Value = request.SupplierName.Trim();
            insertCmd.Parameters.Add("contact", OracleDbType.Varchar2, 100).Value = (object?)request.ContactPerson?.Trim() ?? DBNull.Value;
            insertCmd.Parameters.Add("phone", OracleDbType.Varchar2, 20).Value = (object?)request.PhoneNumber?.Trim() ?? DBNull.Value;
            insertCmd.Parameters.Add("email", OracleDbType.Varchar2, 100).Value = (object?)request.Email?.Trim() ?? DBNull.Value;
            insertCmd.Parameters.Add("address", OracleDbType.Varchar2, 500).Value = (object?)request.Address?.Trim() ?? DBNull.Value;
            insertCmd.Parameters.Add("tax", OracleDbType.Varchar2, 50).Value = (object?)request.TaxCode?.Trim() ?? DBNull.Value;
            insertCmd.Parameters.Add("createdDate", OracleDbType.TimeStamp).Value = now;

            await insertCmd.ExecuteNonQueryAsync(cancellationToken);
            await unitOfWork.CommitAsync(cancellationToken);

            return new SupplierResponse(
                newId,
                request.SupplierCode.Trim(),
                request.SupplierName.Trim(),
                request.ContactPerson?.Trim(),
                request.PhoneNumber?.Trim(),
                request.Email?.Trim(),
                request.Address?.Trim(),
                request.TaxCode?.Trim(),
                true,
                now);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
