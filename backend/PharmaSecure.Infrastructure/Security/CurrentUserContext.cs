using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Enums;

namespace PharmaSecure.Infrastructure.Security;

/// <summary>
/// Extracts authenticated user context and branch scope from trusted HttpContext Claims.
/// Strictly adheres to Rule 03 (Security), Rule 04 (RBAC), and Rule 06 (Branch Isolation).
/// </summary>
public class CurrentUserContext : ICurrentUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public string? UserId
    {
        get
        {
            return User?.FindFirst("UserId")?.Value
                ?? User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }

    public string? Username => User?.FindFirst(ClaimTypes.Name)?.Value;

    public UserRole? Role
    {
        get
        {
            var roleClaim = User?.FindFirst(ClaimTypes.Role)?.Value;
            return Enum.TryParse<UserRole>(roleClaim, true, out var role) ? role : null;
        }
    }

    public string? BranchId
    {
        get
        {
            return User?.FindFirst("BranchId")?.Value
                ?? User?.FindFirst("branch_id")?.Value;
        }
    }
}
