using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Infrastructure.Persistence;

namespace PharmaSecure.Infrastructure.Security;

public sealed class SessionCredentialValidator
{
    private readonly IOracleConnectionFactory factory;
    private readonly IOptions<JwtOptions> options;
    private readonly IActiveSessionTracker? sessionTracker;

    public SessionCredentialValidator(
        IOracleConnectionFactory factory,
        IOptions<JwtOptions> options,
        IActiveSessionTracker sessionTracker)
    {
        this.factory = factory;
        this.options = options;
        this.sessionTracker = sessionTracker;
    }

    public SessionCredentialValidator(
        IOracleConnectionFactory factory,
        IOptions<JwtOptions> options)
        : this(factory, options, null!)
    {
    }

    public static string Stamp(string passwordHash, string configuredKey)
    {
        var key = configuredKey == "${JWT_SECRET}" ? Environment.GetEnvironmentVariable("JWT_SECRET") : configuredKey;
        if (string.IsNullOrWhiteSpace(key)) throw new InvalidOperationException("JWT signing key unavailable.");
        return Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(key), Encoding.UTF8.GetBytes("account-password-v1:" + passwordHash)));
    }

    public async Task<bool> ValidateAsync(ClaimsPrincipal user, CancellationToken ct)
    {
        var stamp = user.FindFirst("pwdv")?.Value;
        var jti = user.FindFirst(JwtRegisteredClaimNames.Jti)?.Value ?? user.FindFirst("jti")?.Value;
        if (string.IsNullOrEmpty(stamp) || string.IsNullOrEmpty(jti)) return false;

        var userId = user.FindFirst("UserId")?.Value ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return false;

        if (sessionTracker != null && !sessionTracker.IsActiveSession(userId, jti))
            return false;

        await using var connection = await factory.CreateAuthConnectionAsync(ct);
        using var command = connection.CreateCommand();
        command.BindByName = true;
        command.CommandText = """
            SELECT u.PasswordHash, u.RoleId, r.RoleName, u.BranchId
            FROM USERS u
            JOIN ROLES r ON r.id = u.RoleId
            JOIN BRANCHES activeBranch ON activeBranch.id = :activeBranch
            WHERE u.id = :actor AND u.IsActive = 1
            """;
        command.Parameters.Add("actor", OracleDbType.Varchar2).Value = userId;
        var activeBranchId = user.FindFirst("BranchId")?.Value;
        var claimedHomeBranchId = user.FindFirst("HomeBranchId")?.Value;
        if (string.IsNullOrWhiteSpace(activeBranchId) || string.IsNullOrWhiteSpace(claimedHomeBranchId)) return false;
        command.Parameters.Add("activeBranch", OracleDbType.Varchar2).Value = activeBranchId;
        await using var reader = await command.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) return false;
        var expected = Stamp(reader.GetString(0), options.Value.SecretKey);
        var role = AuthService.MapToUserRole(reader.GetString(2), reader.GetString(1)).ToString();
        var homeBranchId = reader.GetString(3);
        var validBranchScope = string.Equals(homeBranchId, claimedHomeBranchId, StringComparison.Ordinal)
            && (role == "OWNER" || string.Equals(homeBranchId, activeBranchId, StringComparison.Ordinal));
        return validBranchScope
            && role == user.FindFirst(ClaimTypes.Role)?.Value
            && CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(expected), Encoding.ASCII.GetBytes(stamp));
    }
}
