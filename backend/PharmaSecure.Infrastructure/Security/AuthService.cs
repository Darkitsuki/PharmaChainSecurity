using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Common;
using PharmaSecure.Application.Features.Auth;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Enums;
using PharmaSecure.Infrastructure.Persistence;

namespace PharmaSecure.Infrastructure.Security;

public sealed class AuthService : IAuthService
{
    private readonly IOracleConnectionFactory connectionFactory;
    private readonly IJwtTokenService jwtTokenService;
    private readonly IPasswordHasher passwordHasher;
    private readonly JwtOptions jwtOptions;
    private readonly ILogger<AuthService> logger;

    public AuthService(
        IOracleConnectionFactory connectionFactory,
        IJwtTokenService jwtTokenService,
        IPasswordHasher passwordHasher,
        IOptions<JwtOptions> jwtOptions,
        ILogger<AuthService> logger)
    {
        this.connectionFactory = connectionFactory;
        this.jwtTokenService = jwtTokenService;
        this.passwordHasher = passwordHasher;
        this.jwtOptions = jwtOptions.Value;
        this.logger = logger;
    }

    public async Task<Result<LoginResponse>> LoginAsync(
        LoginRequest request,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return Result<LoginResponse>.Failure("Username and password are required.");

        var trimmedUsername = request.Username.Trim();

        await using var connection = await connectionFactory.CreateAuthConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.BindByName = true;
        command.CommandText = """
            SELECT u.id, u.Username, u.PasswordHash, u.FullName, u.BranchId, b.BranchName, u.IsActive, r.RoleName
            FROM USERS u
            INNER JOIN ROLES r ON u.RoleId = r.id
            INNER JOIN BRANCHES b ON u.BranchId = b.id
            WHERE u.Username = :username
            """;
        command.Parameters.Add("username", OracleDbType.Varchar2, 100).Value = trimmedUsername;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            logger.LogWarning("Failed login attempt: User '{Username}' not found. IP: {IpAddress}.", trimmedUsername, ipAddress ?? "Unknown");
            await RecordAuditLogAsync(null, trimmedUsername, null, "LOGIN_FAILED", ipAddress, userAgent, "User not found", cancellationToken);
            return Result<LoginResponse>.Failure("Invalid username or password.");
        }

        var userId = reader.GetString(0);
        var username = reader.GetString(1);
        var passwordHash = reader.GetString(2);
        var fullName = reader.IsDBNull(3) ? username : reader.GetString(3);
        var branchId = reader.GetString(4);
        var branchName = reader.IsDBNull(5) ? branchId : reader.GetString(5);
        var isActive = reader.GetInt32(6);
        var roleName = reader.GetString(7);

        if (isActive == 0)
        {
            logger.LogWarning("Failed login attempt: User '{Username}' (ID: {UserId}) is deactivated. IP: {IpAddress}.", username, userId, ipAddress ?? "Unknown");
            await RecordAuditLogAsync(userId, username, branchId, "LOGIN_FAILED", ipAddress, userAgent, "User account is deactivated", cancellationToken);
            return Result<LoginResponse>.Failure("User account is deactivated.");
        }

        if (!passwordHasher.VerifyPassword(request.Password, passwordHash))
        {
            logger.LogWarning("Failed login attempt: Invalid password for user '{Username}'. IP: {IpAddress}.", username, ipAddress ?? "Unknown");
            await RecordAuditLogAsync(userId, username, branchId, "LOGIN_FAILED", ipAddress, userAgent, "Invalid credentials", cancellationToken);
            return Result<LoginResponse>.Failure("Invalid username or password.");
        }

        var role = MapToUserRole(roleName);
        var token = jwtTokenService.GenerateToken(userId, username, role, branchId);
        var profile = new UserProfileResponse(userId, username, fullName, role.ToString(), branchId, branchName);

        logger.LogInformation("User '{Username}' (Role: {Role}, Branch: {BranchName}) logged in successfully. IP: {IpAddress}.", username, role, branchName, ipAddress ?? "Unknown");
        await RecordAuditLogAsync(userId, username, branchId, "LOGIN_SUCCESS", ipAddress, userAgent, null, cancellationToken);

        return Result<LoginResponse>.Success(new LoginResponse(
            token,
            "Bearer",
            jwtOptions.ExpiryMinutes * 60,
            profile));
    }

    public async Task<Result<UserProfileResponse>> GetCurrentUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return Result<UserProfileResponse>.Failure("User ID is required.");

        await using var connection = await connectionFactory.CreateAuthConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.BindByName = true;
        command.CommandText = """
            SELECT u.id, u.Username, u.FullName, u.BranchId, b.BranchName, r.RoleName
            FROM USERS u
            INNER JOIN ROLES r ON u.RoleId = r.id
            INNER JOIN BRANCHES b ON u.BranchId = b.id
            WHERE u.id = :userId
            """;
        command.Parameters.Add("userId", OracleDbType.Varchar2, 50).Value = userId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
            return Result<UserProfileResponse>.Failure("User not found.");

        var id = reader.GetString(0);
        var username = reader.GetString(1);
        var fullName = reader.IsDBNull(2) ? username : reader.GetString(2);
        var branchId = reader.GetString(3);
        var branchName = reader.IsDBNull(4) ? branchId : reader.GetString(4);
        var roleName = reader.GetString(5);
        var role = MapToUserRole(roleName);

        return Result<UserProfileResponse>.Success(new UserProfileResponse(id, username, fullName, role.ToString(), branchId, branchName));
    }

    public async Task<Result> LogoutAsync(string userId, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return Result.Failure("User ID is required.");

        string username = "Unknown";
        string? branchId = null;

        try
        {
            await using var connection = await connectionFactory.CreateAuthConnectionAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.BindByName = true;
            command.CommandText = "SELECT Username, BranchId FROM USERS WHERE id = :userId";
            command.Parameters.Add("userId", OracleDbType.Varchar2, 50).Value = userId;

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                username = reader.GetString(0);
                branchId = reader.IsDBNull(1) ? null : reader.GetString(1);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to retrieve user info for logout audit. UserId: {UserId}", userId);
        }

        await RecordAuditLogAsync(userId, username, branchId, "LOGOUT", ipAddress, userAgent, null, cancellationToken);
        logger.LogInformation("User '{Username}' (ID: {UserId}) logged out from IP: {IpAddress}.", username, userId, ipAddress ?? "Unknown");

        return Result.Success();
    }

    private async Task RecordAuditLogAsync(
        string? userId,
        string username,
        string? branchId,
        string eventType,
        string? ipAddress,
        string? userAgent,
        string? failureReason,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var connection = await connectionFactory.CreateAuthConnectionAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.BindByName = true;
            command.CommandText = """
                INSERT INTO AUDIT_LOGS (id, UserId, Username, BranchId, EventType, IpAddress, UserAgent, FailureReason, CreatedDate)
                VALUES (:id, :userId, :username, :branchId, :eventType, :ipAddress, :userAgent, :failureReason, CURRENT_TIMESTAMP)
                """;
            command.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = Guid.NewGuid().ToString("N");
            command.Parameters.Add("userId", OracleDbType.Varchar2, 50).Value = (object?)userId ?? DBNull.Value;
            command.Parameters.Add("username", OracleDbType.Varchar2, 100).Value = username;
            command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = (object?)branchId ?? DBNull.Value;
            command.Parameters.Add("eventType", OracleDbType.Varchar2, 50).Value = eventType;
            command.Parameters.Add("ipAddress", OracleDbType.Varchar2, 50).Value = (object?)ipAddress ?? DBNull.Value;
            command.Parameters.Add("userAgent", OracleDbType.Varchar2, 500).Value = (object?)(userAgent?.Length > 500 ? userAgent[..500] : userAgent) ?? DBNull.Value;
            command.Parameters.Add("failureReason", OracleDbType.Varchar2, 255).Value = (object?)failureReason ?? DBNull.Value;

            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to write audit log for user '{Username}' event '{EventType}'.", username, eventType);
        }
    }

    private static UserRole MapToUserRole(string roleName)
    {
        return roleName.Trim().ToUpperInvariant() switch
        {
            "CHỦ NHÀ THUỐC" or "CHU NHA THUOC" or "OWNER" => UserRole.OWNER,
            "NHÂN VIÊN KHO" or "NHAN VIEN KHO" or "WAREHOUSE" => UserRole.WAREHOUSE,
            "NHÂN VIÊN BÁN HÀNG" or "NHAN VIEN BAN HANG" or "SALES" => UserRole.SALES,
            _ => Enum.TryParse<UserRole>(roleName, true, out var role) ? role : UserRole.SALES
        };
    }
}
