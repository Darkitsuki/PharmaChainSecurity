namespace PharmaSecure.Domain.Entities;

public sealed class InvoiceItem
{
    private InvoiceItem()
    {
    }

    public InvoiceItem(string invoiceId, string drugId, string batchId, int quantity, decimal unitPrice)
    {
        InvoiceId = string.IsNullOrWhiteSpace(invoiceId) ? throw new ArgumentException("Invoice ID is required.", nameof(invoiceId)) : invoiceId;
        DrugId = string.IsNullOrWhiteSpace(drugId) ? throw new ArgumentException("Drug ID is required.", nameof(drugId)) : drugId;
        BatchId = string.IsNullOrWhiteSpace(batchId) ? throw new ArgumentException("Batch ID is required.", nameof(batchId)) : batchId;
        Quantity = quantity <= 0 ? throw new ArgumentOutOfRangeException(nameof(quantity)) : quantity;
        UnitPrice = unitPrice < 0 ? throw new ArgumentOutOfRangeException(nameof(unitPrice)) : unitPrice;
        SubTotal = Quantity * UnitPrice;
    }

    public string InvoiceId { get; private set; } = null!;

    public string DrugId { get; private set; } = null!;

    public string BatchId { get; private set; } = null!;

    public int Quantity { get; private set; }

    public decimal UnitPrice { get; private set; }

    public decimal SubTotal { get; private set; }

    public Invoice Invoice { get; private set; } = null!;

    public Drug Drug { get; private set; } = null!;

    public DrugBatch Batch { get; private set; } = null!;
}