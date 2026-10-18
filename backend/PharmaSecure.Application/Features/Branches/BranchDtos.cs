namespace PharmaSecure.Application.Features.Branches;

public sealed record BranchResponse(
    string Id,
    string BranchName,
    string? Address,
    int ActiveUsersCount,
    int TotalInvoicesCount);

public sealed record CreateBranchRequest(
    string Id,
    string BranchName,
    string? Address);

public sealed record UpdateBranchRequest(
    string BranchName,
    string? Address);
