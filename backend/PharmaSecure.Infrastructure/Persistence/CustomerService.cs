using System.Data;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Customers;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class CustomerService : ICustomerService
{
    private readonly IUnitOfWork unitOfWork;
    private readonly IBranchContextAccessor branchContextAccessor;

    public CustomerService(IUnitOfWork unitOfWork, IBranchContextAccessor branchContextAccessor)
    {
        this.unitOfWork = unitOfWork;
        this.branchContextAccessor = branchContextAccessor;
    }

    private string GetActiveBranchId() =>
        branchContextAccessor.BranchId ?? "br-00000000-0000-0000-0000-000000000001";

    public async Task<IReadOnlyList<CustomerResponse>> GetCustomersAsync(
        string? search = null,
        string? phone = null,
        CancellationToken cancellationToken = default)
    {
        var branchId = GetActiveBranchId();
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var list = new List<CustomerResponse>();
            await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
            command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            command.BindByName = true;

            var sql = """
                SELECT id, CustomerCode, FullName, PhoneNumber, Email, Address, BranchId, TotalSpent, Points, IsActive, CreatedDate
                FROM CUSTOMERS
                WHERE 1=1
                """;

            if (!string.IsNullOrWhiteSpace(phone))
            {
                sql += " AND (PhoneNumber = :phone OR PhoneNumber LIKE :phonePrefix)";
                command.Parameters.Add("phone", OracleDbType.Varchar2, 20).Value = phone.Trim();
                command.Parameters.Add("phonePrefix", OracleDbType.Varchar2, 30).Value = phone.Trim() + "%";
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                sql += " AND (LOWER(FullName) LIKE :searchTerm OR LOWER(CustomerCode) LIKE :searchTerm OR PhoneNumber LIKE :searchRaw)";
                command.Parameters.Add("searchTerm", OracleDbType.Varchar2, 300).Value = "%" + search.Trim().ToLowerInvariant() + "%";
                command.Parameters.Add("searchRaw", OracleDbType.Varchar2, 300).Value = "%" + search.Trim() + "%";
            }

            sql += " ORDER BY FullName ASC";
            command.CommandText = sql;

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(MapCustomer(reader));
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

    public async Task<CustomerResponse?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var branchId = GetActiveBranchId();
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
            command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            command.BindByName = true;
            command.CommandText = """
                SELECT id, CustomerCode, FullName, PhoneNumber, Email, Address, BranchId, TotalSpent, Points, IsActive, CreatedDate
                FROM CUSTOMERS
                WHERE id = :id
                """;
            command.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            CustomerResponse? result = null;
            if (await reader.ReadAsync(cancellationToken))
            {
                result = MapCustomer(reader);
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

    public async Task<CustomerResponse?> GetByPhoneAsync(string phone, CancellationToken cancellationToken = default)
    {
        var branchId = GetActiveBranchId();
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
            command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            command.BindByName = true;
            command.CommandText = """
                SELECT id, CustomerCode, FullName, PhoneNumber, Email, Address, BranchId, TotalSpent, Points, IsActive, CreatedDate
                FROM CUSTOMERS
                WHERE PhoneNumber = :phone
                """;
            command.Parameters.Add("phone", OracleDbType.Varchar2, 20).Value = phone.Trim();

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            CustomerResponse? result = null;
            if (await reader.ReadAsync(cancellationToken))
            {
                result = MapCustomer(reader);
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

    public async Task<CustomerResponse> CreateAsync(
        CreateCustomerRequest request,
        string branchId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new ArgumentException("Customer full name is required.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            throw new ArgumentException("Customer phone number is required.", nameof(request));

        var cleanPhone = request.PhoneNumber.Trim();
        var code = string.IsNullOrWhiteSpace(request.CustomerCode)
            ? $"KH{DateTime.UtcNow:yyMMddHHmmss}"
            : request.CustomerCode.Trim().ToUpperInvariant();

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            // Kiểm tra trùng SĐT
            await using (var checkPhoneCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                checkPhoneCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                checkPhoneCmd.BindByName = true;
                checkPhoneCmd.CommandText = "SELECT COUNT(*) FROM CUSTOMERS WHERE PhoneNumber = :phone";
                checkPhoneCmd.Parameters.Add("phone", OracleDbType.Varchar2, 20).Value = cleanPhone;

                var count = Convert.ToInt32(await checkPhoneCmd.ExecuteScalarAsync(cancellationToken));
                if (count > 0)
                    throw new InvalidOperationException($"A customer with phone number '{cleanPhone}' already exists.");
            }

            // Kiểm tra trùng mã
            await using (var checkCodeCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                checkCodeCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                checkCodeCmd.BindByName = true;
                checkCodeCmd.CommandText = "SELECT COUNT(*) FROM CUSTOMERS WHERE CustomerCode = :code";
                checkCodeCmd.Parameters.Add("code", OracleDbType.Varchar2, 50).Value = code;

                var count = Convert.ToInt32(await checkCodeCmd.ExecuteScalarAsync(cancellationToken));
                if (count > 0)
                    throw new InvalidOperationException($"Customer code '{code}' already exists.");
            }

            var id = Guid.NewGuid().ToString("D");
            var createdDate = DateTime.UtcNow;

            await using (var insertCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                insertCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                insertCmd.BindByName = true;
                insertCmd.CommandText = """
                    INSERT INTO CUSTOMERS (id, CustomerCode, FullName, PhoneNumber, Email, Address, BranchId, TotalSpent, Points, IsActive, CreatedDate)
                    VALUES (:id, :code, :name, :phone, :email, :address, :branchId, 0, 0, 1, :createdDate)
                    """;
                insertCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;
                insertCmd.Parameters.Add("code", OracleDbType.Varchar2, 50).Value = code;
                insertCmd.Parameters.Add("name", OracleDbType.Varchar2, 255).Value = request.FullName.Trim();
                insertCmd.Parameters.Add("phone", OracleDbType.Varchar2, 20).Value = cleanPhone;
                insertCmd.Parameters.Add("email", OracleDbType.Varchar2, 100).Value = (object?)request.Email?.Trim() ?? DBNull.Value;
                insertCmd.Parameters.Add("address", OracleDbType.Varchar2, 500).Value = (object?)request.Address?.Trim() ?? DBNull.Value;
                insertCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                insertCmd.Parameters.Add("createdDate", OracleDbType.TimeStamp).Value = createdDate;

                await insertCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            await unitOfWork.CommitAsync(cancellationToken);

            return new CustomerResponse(
                id,
                code,
                request.FullName.Trim(),
                cleanPhone,
                request.Email?.Trim(),
                request.Address?.Trim(),
                branchId,
                0m,
                0,
                true,
                createdDate);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<CustomerResponse?> UpdateAsync(
        string id,
        UpdateCustomerRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new ArgumentException("Customer full name is required.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            throw new ArgumentException("Customer phone number is required.", nameof(request));

        var cleanPhone = request.PhoneNumber.Trim();
        var branchId = GetActiveBranchId();

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            // Kiểm tra tồn tại
            CustomerResponse? existing = null;
            await using (var getCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                getCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                getCmd.BindByName = true;
                getCmd.CommandText = """
                    SELECT id, CustomerCode, FullName, PhoneNumber, Email, Address, BranchId, TotalSpent, Points, IsActive, CreatedDate
                    FROM CUSTOMERS WHERE id = :id
                    """;
                getCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;

                await using var reader = await getCmd.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    existing = MapCustomer(reader);
                }
            }

            if (existing is null)
            {
                await unitOfWork.RollbackAsync(cancellationToken);
                return null;
            }

            // Kiểm tra trùng SĐT với người khác
            if (!string.Equals(existing.PhoneNumber, cleanPhone, StringComparison.OrdinalIgnoreCase))
            {
                await using var checkCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
                checkCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                checkCmd.BindByName = true;
                checkCmd.CommandText = "SELECT COUNT(*) FROM CUSTOMERS WHERE PhoneNumber = :phone AND id != :id";
                checkCmd.Parameters.Add("phone", OracleDbType.Varchar2, 20).Value = cleanPhone;
                checkCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;

                var count = Convert.ToInt32(await checkCmd.ExecuteScalarAsync(cancellationToken));
                if (count > 0)
                    throw new InvalidOperationException($"Phone number '{cleanPhone}' is already used by another customer.");
            }

            var isActive = request.IsActive ?? existing.IsActive;

            await using (var updateCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                updateCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                updateCmd.BindByName = true;
                updateCmd.CommandText = """
                    UPDATE CUSTOMERS
                    SET FullName = :name,
                        PhoneNumber = :phone,
                        Email = :email,
                        Address = :address,
                        IsActive = :isActive
                    WHERE id = :id
                    """;
                updateCmd.Parameters.Add("name", OracleDbType.Varchar2, 255).Value = request.FullName.Trim();
                updateCmd.Parameters.Add("phone", OracleDbType.Varchar2, 20).Value = cleanPhone;
                updateCmd.Parameters.Add("email", OracleDbType.Varchar2, 100).Value = (object?)request.Email?.Trim() ?? DBNull.Value;
                updateCmd.Parameters.Add("address", OracleDbType.Varchar2, 500).Value = (object?)request.Address?.Trim() ?? DBNull.Value;
                updateCmd.Parameters.Add("isActive", OracleDbType.Int32).Value = isActive ? 1 : 0;
                updateCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;

                await updateCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            await unitOfWork.CommitAsync(cancellationToken);

            return existing with
            {
                FullName = request.FullName.Trim(),
                PhoneNumber = cleanPhone,
                Email = request.Email?.Trim(),
                Address = request.Address?.Trim(),
                IsActive = isActive
            };
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static CustomerResponse MapCustomer(OracleDataReader reader)
    {
        return new CustomerResponse(
            reader.GetString(0),
            reader.GetString(1),
            reader.GetString(2),
            reader.GetString(3),
            reader.IsDBNull(4) ? null : reader.GetString(4),
            reader.IsDBNull(5) ? null : reader.GetString(5),
            reader.IsDBNull(6) ? null : reader.GetString(6),
            reader.GetDecimal(7),
            reader.GetInt32(8),
            reader.GetInt32(9) == 1,
            reader.GetDateTime(10));
    }
}
