namespace PharmaSecure.Application.Features.Inventory;

public sealed record AvailableInventoryResponse(
    string DrugId,
    int AvailableQuantity);
