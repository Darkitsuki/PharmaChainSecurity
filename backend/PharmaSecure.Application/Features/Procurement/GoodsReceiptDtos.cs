namespace PharmaSecure.Application.Features.Procurement;

public sealed record GoodsReceiptResponse(
    string Id,
    string ReceiptNo,
    string BranchId,
    string SupplierId,
    string SupplierName,
    string WarehouseStaffId,
    string? WarehouseStaffName,
    decimal TotalAmount,
    string? Note,
    string Status,
    DateTime CreatedDate,
    IReadOnlyList<GoodsReceiptItemResponse> Items);

public sealed record GoodsReceiptItemResponse(
    string Id,
    string ReceiptId,
    string DrugId,
    string DrugCode,
    string DrugName,
    string BatchId,
    string BatchNo,
    DateTime ExpiryDate,
    int Quantity,
    decimal ImportPrice,
    decimal SubTotal);

public sealed record CreateGoodsReceiptRequest(
    string SupplierId,
    string? Note,
    IReadOnlyList<CreateGoodsReceiptItemRequest> Items);

public sealed record CreateGoodsReceiptItemRequest(
    string DrugId,
    string BatchNo,
    DateTime ExpiryDate,
    DateTime? MfgDate,
    int Quantity,
    decimal ImportPrice);
