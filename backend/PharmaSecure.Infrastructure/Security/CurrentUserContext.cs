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

    public Guid? UserId
    {
        get
        {
            var idClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(idClaim, out var guid) ? guid : null;
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

    public int? BranchId
    {
        get
        {
            var branchClaim = User?.FindFirst("branch_id")?.Value;
            return int.TryParse(branchClaim, out var branchId) ? branchId : null;
        }
    }
}
