namespace PharmaSecure.Application.Features.Inventory.Audits;

public interface IInventoryAuditService
{
    Task<IReadOnlyList<InventoryAuditResponse>> GetByBranchAsync(string branchId, CancellationToken cancellationToken = default);
    Task<InventoryAuditDetailResponse?> GetByIdAsync(string id, string branchId, CancellationToken cancellationToken = default);
    Task<InventoryAuditDetailResponse> CreateAuditAsync(CreateInventoryAuditRequest request, string branchId, string userId, CancellationToken cancellationToken = default);
    Task<InventoryAuditDetailResponse> UpdateCountedItemsAsync(string id, UpdateAuditItemsRequest request, string branchId, CancellationToken cancellationToken = default);
    Task<InventoryAuditDetailResponse> ReconcileAsync(string id, string branchId, string ownerId, ReconcileAuditRequest request, CancellationToken cancellationToken = default);
    Task CancelAuditAsync(string id, string branchId, string userId, CancellationToken cancellationToken = default);
}
