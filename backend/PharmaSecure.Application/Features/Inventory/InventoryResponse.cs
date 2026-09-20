namespace PharmaSecure.Application.Features.Inventory;

public sealed record InventoryResponse(
    string BranchId,
    string DrugId,
    string BatchId,
    int Quantity);