using PharmaSecure.Domain.Entities;

namespace PharmaSecure.Application.Interfaces;

public interface IInventoryRepository
{
    Task<Inventory?> LockRowForUpdateAsync(
        string branchId,
        string drugId,
        string batchId,
        CancellationToken cancellationToken = default);

    Task UpdateQuantityAsync(
        Inventory inventory,
        CancellationToken cancellationToken = default);

    Task AdjustStockAsync(
        string branchId,
        string drugId,
        string batchId,
        int newQuantity,
        string reason,
        CancellationToken cancellationToken = default);
}