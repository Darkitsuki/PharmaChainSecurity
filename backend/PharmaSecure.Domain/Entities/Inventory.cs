namespace PharmaSecure.Domain.Entities;

public sealed class Inventory
{
    private Inventory()
    {
    }

    public Inventory(string branchId, string drugId, string batchId, int quantity = 0)
    {
        BranchId = string.IsNullOrWhiteSpace(branchId) ? throw new ArgumentException("Branch ID is required.", nameof(branchId)) : branchId;
        DrugId = string.IsNullOrWhiteSpace(drugId) ? throw new ArgumentException("Drug ID is required.", nameof(drugId)) : drugId;
        BatchId = string.IsNullOrWhiteSpace(batchId) ? throw new ArgumentException("Batch ID is required.", nameof(batchId)) : batchId;
        Quantity = quantity < 0 ? throw new ArgumentOutOfRangeException(nameof(quantity)) : quantity;
    }

    public string BranchId { get; private set; } = null!;

    public string DrugId { get; private set; } = null!;

    public string BatchId { get; private set; } = null!;

    public int Quantity { get; private set; }

    public Branch Branch { get; private set; } = null!;

    public Drug Drug { get; private set; } = null!;

    public DrugBatch Batch { get; private set; } = null!;

    public void DecreaseQuantity(int quantity)
    {
        if (quantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(quantity));

        if (quantity > Quantity)
            throw new InvalidOperationException("Inventory does not contain enough stock.");

        Quantity -= quantity;
    }

    public void IncreaseQuantity(int quantity)
    {
        if (quantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(quantity));

        Quantity += quantity;
    }
}