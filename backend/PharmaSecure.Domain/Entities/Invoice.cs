using PharmaSecure.Domain.Enums;

namespace PharmaSecure.Domain.Entities;

public sealed class Invoice : EntityBase<string>
{
    private readonly List<InvoiceItem> items = [];

    private Invoice()
    {
    }

    public Invoice(
        string invoiceNumber,
        string branchId,
        string cashierId,
        DateTime? createdDate = null,
        string? id = null)
    {
        Id = id ?? Guid.NewGuid().ToString("D");
        InvoiceNumber = string.IsNullOrWhiteSpace(invoiceNumber) ? throw new ArgumentException("Invoice number is required.", nameof(invoiceNumber)) : invoiceNumber;
        BranchId = string.IsNullOrWhiteSpace(branchId) ? throw new ArgumentException("Branch ID is required.", nameof(branchId)) : branchId;
        CashierId = string.IsNullOrWhiteSpace(cashierId) ? throw new ArgumentException("Cashier ID is required.", nameof(cashierId)) : cashierId;
        CreatedDate = createdDate ?? DateTime.UtcNow;
        Status = InvoiceStatus.Draft;
    }

    public string InvoiceNumber { get; private set; } = null!;

    public DateTime CreatedDate { get; private set; }

    public decimal TotalAmount { get; private set; }

    public string BranchId { get; private set; } = null!;

    public string CashierId { get; private set; } = null!;

    public InvoiceStatus Status { get; private set; }

    public Branch Branch { get; private set; } = null!;

    public User Cashier { get; private set; } = null!;

    public IReadOnlyCollection<InvoiceItem> Items => items;

    public DigitalSignature? DigitalSignature { get; private set; }

    public void AddItem(InvoiceItem item)
    {
        ArgumentNullException.ThrowIfNull(item);

        if (Status != InvoiceStatus.Draft)
            throw new InvalidOperationException("Only draft invoices can be changed.");

        items.Add(item);
        TotalAmount += item.SubTotal;
    }

    public void MarkAsPaid()
    {
        if (Status != InvoiceStatus.Draft)
            throw new InvalidOperationException("Only draft invoices can be paid.");

        Status = InvoiceStatus.Paid;
    }

    public void LockInvoice()
    {
        if (Status != InvoiceStatus.Paid)
            throw new InvalidOperationException("Only paid invoices can be locked.");

        Status = InvoiceStatus.Locked;
    }
}