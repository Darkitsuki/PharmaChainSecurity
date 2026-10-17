namespace PharmaSecure.Application.Features.Branches;

public interface IBranchService
{
    Task<IReadOnlyList<BranchResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<BranchResponse?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<BranchResponse> CreateAsync(CreateBranchRequest request, CancellationToken cancellationToken = default);
    Task<BranchResponse> UpdateAsync(string id, UpdateBranchRequest request, CancellationToken cancellationToken = default);
}
