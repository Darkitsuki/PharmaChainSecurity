using System.Data;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Users;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class UserService : IUserService
{
    private readonly IUnitOfWork unitOfWork;
    private readonly IPasswordHasher passwordHasher;

    public UserService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        this.unitOfWork = unitOfWork;
        this.passwordHasher = passwordHasher;
    }

    public async Task<IReadOnlyList<UserSummaryResponse>> GetBranchUsersAsync(
        string branchId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var list = new List<UserSummaryResponse>();
            await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
            command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            command.BindByName = true;
            command.CommandText = """
                SELECT u.id, u.Username, u.FullName, u.PhoneNumber, r.RoleName, u.RoleId, u.BranchId, u.IsActive, u.CreatedDate
                FROM USERS u
                JOIN ROLES r ON u.RoleId = r.id
                WHERE u.BranchId = :branchId
                ORDER BY u.CreatedDate DESC
                """;
            command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(MapUser(reader));
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

    public async Task<UserSummaryResponse?> GetByIdAsync(
        string id,
        string branchId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("User ID is required.", nameof(id));
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
            command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            command.BindByName = true;
            command.CommandText = """
                SELECT u.id, u.Username, u.FullName, u.PhoneNumber, r.RoleName, u.RoleId, u.BranchId, u.IsActive, u.CreatedDate
                FROM USERS u
                JOIN ROLES r ON u.RoleId = r.id
                WHERE u.id = :id AND u.BranchId = :branchId
                """;
            command.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;
            command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            UserSummaryResponse? user = null;
            if (await reader.ReadAsync(cancellationToken))
            {
                user = MapUser(reader);
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return user;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<UserSummaryResponse> CreateUserAsync(
        CreateUserRequest request,
        string branchId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.Username))
            throw new ArgumentException("Username is required.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Password is required.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new ArgumentException("Full name is required.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.Role))
            throw new ArgumentException("Role is required.", nameof(request));

        var cleanUsername = request.Username.Trim().ToLowerInvariant();

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            // Kiểm tra trùng username
            await using (var checkCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                checkCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                checkCmd.BindByName = true;
                checkCmd.CommandText = "SELECT COUNT(*) FROM USERS WHERE LOWER(Username) = :username";
                checkCmd.Parameters.Add("username", OracleDbType.Varchar2, 100).Value = cleanUsername;

                var count = Convert.ToInt32(await checkCmd.ExecuteScalarAsync(cancellationToken));
                if (count > 0)
                    throw new InvalidOperationException($"Username '{cleanUsername}' already exists.");
            }

            // Ánh xạ Role
            var (roleId, roleName) = ResolveRole(request.Role);

            var id = Guid.NewGuid().ToString("D");
            var passwordHash = passwordHasher.HashPassword(request.Password);
            var createdDate = DateTime.UtcNow;

            await using (var insertCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                insertCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                insertCmd.BindByName = true;
                insertCmd.CommandText = """
                    INSERT INTO USERS (id, Username, PasswordHash, FullName, PhoneNumber, RoleId, BranchId, IsActive, CreatedDate)
                    VALUES (:id, :username, :passwordHash, :fullName, :phoneNumber, :roleId, :branchId, 1, :createdDate)
                    """;
                insertCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;
                insertCmd.Parameters.Add("username", OracleDbType.Varchar2, 100).Value = cleanUsername;
                insertCmd.Parameters.Add("passwordHash", OracleDbType.Varchar2, 255).Value = passwordHash;
                insertCmd.Parameters.Add("fullName", OracleDbType.Varchar2, 255).Value = request.FullName.Trim();
                insertCmd.Parameters.Add("phoneNumber", OracleDbType.Varchar2, 20).Value = (object?)request.PhoneNumber?.Trim() ?? DBNull.Value;
                insertCmd.Parameters.Add("roleId", OracleDbType.Varchar2, 50).Value = roleId;
                insertCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                insertCmd.Parameters.Add("createdDate", OracleDbType.TimeStamp).Value = createdDate;

                await insertCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            await unitOfWork.CommitAsync(cancellationToken);

            return new UserSummaryResponse(
                id,
                cleanUsername,
                request.FullName.Trim(),
                request.PhoneNumber?.Trim(),
                roleName,
                roleId,
                branchId,
                true,
                createdDate);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<UserSummaryResponse?> UpdateStatusAsync(
        string id,
        string branchId,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("User ID is required.", nameof(id));

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var existing = await GetByIdInternalAsync(id, branchId, cancellationToken);
            if (existing is null)
            {
                await unitOfWork.RollbackAsync(cancellationToken);
                return null;
            }

            await using (var updateCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                updateCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                updateCmd.BindByName = true;
                updateCmd.CommandText = """
                    UPDATE USERS
                    SET IsActive = :isActive
                    WHERE id = :id AND BranchId = :branchId
                    """;
                updateCmd.Parameters.Add("isActive", OracleDbType.Int32).Value = isActive ? 1 : 0;
                updateCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;
                updateCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

                await updateCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            await unitOfWork.CommitAsync(cancellationToken);

            return existing with { IsActive = isActive };
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<UserSummaryResponse?> GetByIdInternalAsync(string id, string branchId, CancellationToken cancellationToken)
    {
        await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
        command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
        command.BindByName = true;
        command.CommandText = """
            SELECT u.id, u.Username, u.FullName, u.PhoneNumber, r.RoleName, u.RoleId, u.BranchId, u.IsActive, u.CreatedDate
            FROM USERS u
            JOIN ROLES r ON u.RoleId = r.id
            WHERE u.id = :id AND u.BranchId = :branchId
            """;
        command.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;
        command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
            return MapUser(reader);
        return null;
    }

    private static (string RoleId, string RoleName) ResolveRole(string role)
    {
        return role.ToUpperInvariant() switch
        {
            "WAREHOUSE" or "THUKHO" or "NHAN VIEN KHO" =>
                ("rl-00000000-0000-0000-0000-000000000002", "Nhân viên kho"),
            "SALES" or "BANHANG" or "NHAN VIEN BAN HANG" =>
                ("rl-00000000-0000-0000-0000-000000000003", "Nhân viên bán hàng"),
            "OWNER" or "CHUTIEM" or "CHU NHA THUOC" =>
                ("rl-00000000-0000-0000-0000-000000000001", "Chủ nhà thuốc"),
            _ => throw new ArgumentException($"Invalid role '{role}'. Allowed roles are SALES or WAREHOUSE.")
        };
    }

    private static UserSummaryResponse MapUser(OracleDataReader reader)
    {
        return new UserSummaryResponse(
            reader.GetString(0),
            reader.GetString(1),
            reader.GetString(2),
            reader.IsDBNull(3) ? null : reader.GetString(3),
            reader.GetString(4),
            reader.GetString(5),
            reader.GetString(6),
            reader.GetInt32(7) == 1,
            reader.GetDateTime(8));
    }
}
