using PharmaSecure.Application.Common;

namespace PharmaSecure.Application.Features.Inventory;

public interface IInventoryQueryService
{
    Task<PagedResult<InventoryResponse>> GetPageAsync(
        string branchId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}