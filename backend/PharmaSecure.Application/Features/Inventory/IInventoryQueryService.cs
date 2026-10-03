using PharmaSecure.Application.Common;

namespace PharmaSecure.Application.Features.Inventory;

public interface IInventoryQueryService
{
    Task<PagedResult<InventoryResponse>> GetPageAsync(
        string branchId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<InventoryAlertResponse>> GetExpiringSoonAsync(
        string branchId,
        int days = 90,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<InventoryAlertResponse>> GetLowStockAsync(
        string branchId,
        int threshold = 10,
        CancellationToken cancellationToken = default);
}