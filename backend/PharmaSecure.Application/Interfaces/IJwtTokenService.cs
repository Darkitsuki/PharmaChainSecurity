using PharmaSecure.Domain.Enums;

namespace PharmaSecure.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(string userId, string username, UserRole role, string branchId);
}