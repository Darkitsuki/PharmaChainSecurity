namespace PharmaSecure.Application.Features.Users;

public interface IUserService
{
    Task<IReadOnlyList<UserSummaryResponse>> GetBranchUsersAsync(string branchId, CancellationToken cancellationToken = default);
    Task<UserSummaryResponse?> GetByIdAsync(string id, string branchId, CancellationToken cancellationToken = default);
    Task<UserSummaryResponse> CreateUserAsync(CreateUserRequest request, string branchId, CancellationToken cancellationToken = default);
    Task<UserSummaryResponse?> UpdateStatusAsync(string id, string branchId, bool isActive, CancellationToken cancellationToken = default);
}
