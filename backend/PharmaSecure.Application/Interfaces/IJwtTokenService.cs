using PharmaSecure.Domain.Enums;

namespace PharmaSecure.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(string userId, string username, UserRole role, string activeBranchId, string? passwordHash = null, string? homeBranchId = null);
    (string Token, string Jti) GenerateTokenWithJti(string userId, string username, UserRole role, string activeBranchId, string? passwordHash = null, string? homeBranchId = null);
}
