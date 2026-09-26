namespace PharmaSecure.Application.Features.Sales;

public sealed class InsufficientStockException : Exception
{
    public InsufficientStockException(string drugId, string batchId, int availableQuantity, int requestedQuantity)
        : base("The requested quantity exceeds the available stock.")
    {
        DrugId = drugId;
        BatchId = batchId;
        AvailableQuantity = availableQuantity;
        RequestedQuantity = requestedQuantity;
    }

    public string DrugId { get; }

    public string BatchId { get; }

    public int AvailableQuantity { get; }

    public int RequestedQuantity { get; }
}