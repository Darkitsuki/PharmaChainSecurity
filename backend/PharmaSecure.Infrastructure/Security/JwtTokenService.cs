using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Enums;

namespace PharmaSecure.Infrastructure.Security;

public sealed class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions options;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        this.options = options.Value;
    }

    public string GenerateToken(string userId, string username, UserRole role, string branchId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("User ID is required.", nameof(userId));
        if (string.IsNullOrWhiteSpace(username))
            throw new ArgumentException("Username is required.", nameof(username));
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));

        var secretKey = ExpandEnvironmentPlaceholder(options.SecretKey, "JWT_SECRET");
        if (Encoding.UTF8.GetByteCount(secretKey) < 32)
            throw new InvalidOperationException("JWT secret key must contain at least 256 bits.");
        if (string.IsNullOrWhiteSpace(options.Issuer) || string.IsNullOrWhiteSpace(options.Audience))
            throw new InvalidOperationException("JWT issuer and audience must be configured.");

        var roleCode = role.ToString();
        var claims = new[]
        {
            new Claim("UserId", userId),
            new Claim("RoleCode", roleCode),
            new Claim("BranchId", branchId),
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, roleCode)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: options.Issuer,
            audience: options.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(options.ExpiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string ExpandEnvironmentPlaceholder(string value, string variableName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException($"JWT secret key must be configured through '{variableName}'.");

        if (!value.Equals($"${{{variableName}}}", StringComparison.Ordinal))
            return value;

        var environmentValue = Environment.GetEnvironmentVariable(variableName);
        if (string.IsNullOrWhiteSpace(environmentValue))
            throw new InvalidOperationException($"Environment variable '{variableName}' is required.");

        return environmentValue;
    }
}