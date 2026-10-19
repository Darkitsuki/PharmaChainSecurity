namespace PharmaSecure.Application.Features.Inventory.Transfers;

public sealed record StockTransferResponse(
    string Id,
    string TransferNo,
    string FromBranchId,
    string FromBranchName,
    string ToBranchId,
    string ToBranchName,
    string CreatedById,
    string CreatedByName,
    string? ShippedById,
    string? ShippedByName,
    string? ReceivedById,
    string? ReceivedByName,
    string Status,
    int TotalItemsCount,
    int TotalQuantity,
    DateTime? ShippedDate,
    DateTime? ReceivedDate,
    string? Notes,
    DateTime CreatedDate
);

public sealed record StockTransferItemDto(
    string DrugId,
    string DrugCode,
    string DrugName,
    string Unit,
    string BatchId,
    string BatchNumber,
    DateTime ExpiryDate,
    int Quantity,
    string? Notes
);

public sealed record StockTransferDetailResponse(
    string Id,
    string TransferNo,
    string FromBranchId,
    string FromBranchName,
    string ToBranchId,
    string ToBranchName,
    string CreatedById,
    string CreatedByName,
    string? ShippedById,
    string? ShippedByName,
    string? ReceivedById,
    string? ReceivedByName,
    string Status,
    int TotalItemsCount,
    int TotalQuantity,
    DateTime? ShippedDate,
    DateTime? ReceivedDate,
    string? Notes,
    DateTime CreatedDate,
    IReadOnlyList<StockTransferItemDto> Items
);

public sealed record CreateStockTransferItemRequest(
    string DrugId,
    string BatchId,
    int Quantity,
    string? Notes
);

public sealed record CreateStockTransferRequest(
    string ToBranchId,
    string? Notes,
    List<CreateStockTransferItemRequest> Items
);
