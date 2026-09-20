using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Security;

public sealed class BranchContextAccessor : IBranchContextAccessor
{
    public string? BranchId { get; set; }
}