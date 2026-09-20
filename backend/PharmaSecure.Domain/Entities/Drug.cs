namespace PharmaSecure.Domain.Entities;

public sealed class Drug : EntityBase<string>
{
    private readonly List<DrugBatch> batches = [];
    private readonly List<Inventory> inventories = [];
    private readonly List<InvoiceItem> invoiceItems = [];

    private Drug()
    {
    }

    public Drug(
        string drugCode,
        string name,
        string unit,
        decimal price,
        string? activeIngredient = null,
        string? id = null)
    {
        Id = id ?? Guid.NewGuid().ToString("D");
        DrugCode = string.IsNullOrWhiteSpace(drugCode) ? throw new ArgumentException("Drug code is required.", nameof(drugCode)) : drugCode;
        Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("Drug name is required.", nameof(name)) : name;
        Unit = string.IsNullOrWhiteSpace(unit) ? throw new ArgumentException("Drug unit is required.", nameof(unit)) : unit;
        Price = price < 0 ? throw new ArgumentOutOfRangeException(nameof(price)) : price;
        ActiveIngredient = activeIngredient;
    }

    public string DrugCode { get; private set; } = null!;

    public string Name { get; private set; } = null!;

    public string? ActiveIngredient { get; private set; }

    public string Unit { get; private set; } = null!;

    public decimal Price { get; private set; }

    public IReadOnlyCollection<DrugBatch> Batches => batches;

    public IReadOnlyCollection<Inventory> Inventories => inventories;

    public IReadOnlyCollection<InvoiceItem> InvoiceItems => invoiceItems;
}