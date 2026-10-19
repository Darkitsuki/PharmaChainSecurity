namespace PharmaSecure.Application.Features.Inventory.Transfers;

public interface IStockTransferService
{
    Task<IReadOnlyList<StockTransferResponse>> GetTransfersAsync(string branchId, string? direction = null, CancellationToken cancellationToken = default);

    Task<StockTransferDetailResponse?> GetByIdAsync(string id, string branchId, CancellationToken cancellationToken = default);

    Task<StockTransferDetailResponse> CreateTransferAsync(CreateStockTransferRequest request, string fromBranchId, string userId, CancellationToken cancellationToken = default);

    Task<StockTransferDetailResponse> ShipTransferAsync(string id, string branchId, string userId, CancellationToken cancellationToken = default);

    Task<StockTransferDetailResponse> ReceiveTransferAsync(string id, string branchId, string userId, CancellationToken cancellationToken = default);

    Task<StockTransferDetailResponse> CancelTransferAsync(string id, string branchId, string userId, CancellationToken cancellationToken = default);
}
