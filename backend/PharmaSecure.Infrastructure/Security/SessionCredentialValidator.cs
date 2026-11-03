using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Infrastructure.Persistence;

namespace PharmaSecure.Infrastructure.Security;

public sealed class SessionCredentialValidator(IOracleConnectionFactory factory, IOptions<JwtOptions> options)
{
    public static string Stamp(string passwordHash, string configuredKey)
    {
        var key = configuredKey == "${JWT_SECRET}" ? Environment.GetEnvironmentVariable("JWT_SECRET") : configuredKey;
        if (string.IsNullOrWhiteSpace(key)) throw new InvalidOperationException("JWT signing key unavailable.");
        return Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(key), Encoding.UTF8.GetBytes("account-password-v1:" + passwordHash)));
    }
    public async Task<bool> ValidateAsync(ClaimsPrincipal user, CancellationToken ct)
    {
        var stamp = user.FindFirst("pwdv")?.Value;
        if (string.IsNullOrEmpty(stamp) || string.IsNullOrEmpty(user.FindFirst("jti")?.Value)) return false;
        await using var connection = await factory.CreateAuthConnectionAsync(ct);
        using var command = connection.CreateCommand(); command.BindByName = true;
        command.CommandText = "SELECT u.PasswordHash,u.RoleId,r.RoleName FROM USERS u JOIN ROLES r ON r.id=u.RoleId WHERE u.id=:actor AND u.BranchId=:branch AND u.IsActive=1";
        command.Parameters.Add("actor", OracleDbType.Varchar2).Value = user.FindFirst("UserId")?.Value;
        command.Parameters.Add("branch", OracleDbType.Varchar2).Value = user.FindFirst("BranchId")?.Value;
        await using var reader = await command.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) return false;
        var expected = Stamp(reader.GetString(0), options.Value.SecretKey);
        var role = AuthService.MapToUserRole(reader.GetString(2), reader.GetString(1)).ToString();
        return role == user.FindFirst(ClaimTypes.Role)?.Value && CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(expected), Encoding.ASCII.GetBytes(stamp));
    }
}
