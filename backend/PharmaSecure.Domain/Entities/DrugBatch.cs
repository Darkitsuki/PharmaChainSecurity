namespace PharmaSecure.Domain.Entities;

public sealed class DrugBatch : EntityBase<string>
{
    private readonly List<Inventory> inventories = [];
    private readonly List<InvoiceItem> invoiceItems = [];

    private DrugBatch()
    {
    }

    public DrugBatch(
        string drugId,
        string batchNumber,
        DateTime expiryDate,
        DateTime? manufacturingDate = null,
        string? id = null)
    {
        Id = id ?? Guid.NewGuid().ToString("D");
        DrugId = string.IsNullOrWhiteSpace(drugId) ? throw new ArgumentException("Drug ID is required.", nameof(drugId)) : drugId;
        BatchNumber = string.IsNullOrWhiteSpace(batchNumber) ? throw new ArgumentException("Batch number is required.", nameof(batchNumber)) : batchNumber;
        if (manufacturingDate.HasValue && expiryDate <= manufacturingDate.Value)
            throw new ArgumentException("Expiry date must be after the manufacturing date.", nameof(expiryDate));

        ExpiryDate = expiryDate;
        ManufacturingDate = manufacturingDate;
    }

    public string DrugId { get; private set; } = null!;

    public string BatchNumber { get; private set; } = null!;

    public DateTime? ManufacturingDate { get; private set; }

    public DateTime ExpiryDate { get; private set; }

    public Drug Drug { get; private set; } = null!;

    public IReadOnlyCollection<Inventory> Inventories => inventories;

    public IReadOnlyCollection<InvoiceItem> InvoiceItems => invoiceItems;

    public bool IsExpired(DateTime utcNow) => ExpiryDate <= utcNow;
}