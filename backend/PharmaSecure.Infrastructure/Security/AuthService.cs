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

    public AuthService(
        IOracleConnectionFactory connectionFactory,
        IJwtTokenService jwtTokenService,
        IPasswordHasher passwordHasher,
        IOptions<JwtOptions> jwtOptions)
    {
        this.connectionFactory = connectionFactory;
        this.jwtTokenService = jwtTokenService;
        this.passwordHasher = passwordHasher;
        this.jwtOptions = jwtOptions.Value;
    }

    public async Task<Result<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return Result<LoginResponse>.Failure("Username and password are required.");

        await using var connection = await connectionFactory.CreateAuthConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.BindByName = true;
        command.CommandText = """
            SELECT u.id, u.Username, u.PasswordHash, u.BranchId, u.IsActive, r.RoleName
            FROM USERS u
            INNER JOIN ROLES r ON u.RoleId = r.id
            WHERE u.Username = :username
            """;
        command.Parameters.Add("username", OracleDbType.Varchar2, 100).Value = request.Username.Trim();

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
            return Result<LoginResponse>.Failure("Invalid username or password.");

        var userId = reader.GetString(0);
        var username = reader.GetString(1);
        var passwordHash = reader.GetString(2);
        var branchId = reader.GetString(3);
        var isActive = reader.GetInt32(4);
        var roleName = reader.GetString(5);

        if (isActive == 0)
            return Result<LoginResponse>.Failure("User account is deactivated.");

        if (!passwordHasher.VerifyPassword(request.Password, passwordHash))
            return Result<LoginResponse>.Failure("Invalid username or password.");

        var role = MapToUserRole(roleName);
        var token = jwtTokenService.GenerateToken(userId, username, role, branchId);
        var profile = new UserProfileResponse(userId, username, role.ToString(), branchId);

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
            SELECT u.id, u.Username, u.BranchId, r.RoleName
            FROM USERS u
            INNER JOIN ROLES r ON u.RoleId = r.id
            WHERE u.id = :userId
            """;
        command.Parameters.Add("userId", OracleDbType.Varchar2, 50).Value = userId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
            return Result<UserProfileResponse>.Failure("User not found.");

        var id = reader.GetString(0);
        var username = reader.GetString(1);
        var branchId = reader.GetString(2);
        var roleName = reader.GetString(3);
        var role = MapToUserRole(roleName);

        return Result<UserProfileResponse>.Success(new UserProfileResponse(id, username, role.ToString(), branchId));
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
