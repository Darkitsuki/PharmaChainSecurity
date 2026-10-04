namespace PharmaSecure.Application.Features.Users;

public sealed record UserSummaryResponse(
    string Id,
    string Username,
    string FullName,
    string? PhoneNumber,
    string Role,
    string RoleId,
    string BranchId,
    bool IsActive,
    DateTime CreatedDate);

public sealed record CreateUserRequest(
    string Username,
    string Password,
    string FullName,
    string? PhoneNumber,
    string Role);

public sealed record UpdateUserStatusRequest(
    bool IsActive);
