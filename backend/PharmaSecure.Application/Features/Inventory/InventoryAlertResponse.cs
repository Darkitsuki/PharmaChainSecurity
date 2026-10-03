namespace PharmaSecure.Application.Features.Inventory;

public sealed record InventoryAlertResponse(
    string BranchId,
    string DrugId,
    string DrugCode,
    string DrugName,
    string BatchId,
    string BatchNo,
    DateTime ExpiryDate,
    int Quantity);
