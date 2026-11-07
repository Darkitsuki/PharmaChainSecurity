namespace PharmaSecure.Application.Features.Inventory;

public sealed record InventoryResponse(
    string BranchId,
    string DrugId,
    string DrugName,
    string BatchId,
    string BatchNo,
    DateTime? MfgDate,
    DateTime ExpiryDate,
    int Quantity,
    int AvailableQuantity);
