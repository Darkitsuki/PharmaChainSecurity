using PharmaSecure.Domain.Enums;

namespace PharmaSecure.Application.Interfaces;

/// <summary>
/// Authoritative server-side abstraction for the authenticated user and branch scope.
/// Client-supplied branch or user identities MUST NEVER override this context.
/// </summary>
public interface ICurrentUserContext
{
    Guid? UserId { get; }
    string? Username { get; }
    UserRole? Role { get; }
    int? BranchId { get; }
    bool IsAuthenticated { get; }
}
