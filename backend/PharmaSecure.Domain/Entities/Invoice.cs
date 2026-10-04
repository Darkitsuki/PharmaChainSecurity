using System.Globalization;
using System.Text;
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
        string? id = null,
        string? customerId = null)
    {
        Id = id ?? Guid.NewGuid().ToString("D");
        InvoiceNumber = string.IsNullOrWhiteSpace(invoiceNumber) ? throw new ArgumentException("Invoice number is required.", nameof(invoiceNumber)) : invoiceNumber;
        BranchId = string.IsNullOrWhiteSpace(branchId) ? throw new ArgumentException("Branch ID is required.", nameof(branchId)) : branchId;
        CashierId = string.IsNullOrWhiteSpace(cashierId) ? throw new ArgumentException("Cashier ID is required.", nameof(cashierId)) : cashierId;
        CustomerId = string.IsNullOrWhiteSpace(customerId) ? null : customerId.Trim();
        var timestamp = createdDate ?? DateTime.UtcNow;
        timestamp = timestamp.Kind switch
        {
            DateTimeKind.Local => timestamp.ToUniversalTime(),
            DateTimeKind.Unspecified => DateTime.SpecifyKind(timestamp, DateTimeKind.Utc),
            _ => timestamp
        };
        CreatedDate = new DateTime(timestamp.Ticks - timestamp.Ticks % 10, DateTimeKind.Utc);
        Status = InvoiceStatus.Draft;
    }

    public string InvoiceNumber { get; private set; } = null!;

    public DateTime CreatedDate { get; private set; }

    public decimal TotalAmount { get; private set; }

    public string BranchId { get; private set; } = null!;

    public string CashierId { get; private set; } = null!;

    public string? CustomerId { get; private set; }

    public InvoiceStatus Status { get; private set; }

    public Branch Branch { get; private set; } = null!;

    public User Cashier { get; private set; } = null!;

    public IReadOnlyCollection<InvoiceItem> Items => items;

    public DigitalSignature? DigitalSignature { get; private set; }

    public void SetCustomer(string? customerId)
    {
        if (Status != InvoiceStatus.Draft)
            throw new InvalidOperationException("Only draft invoices can be changed.");
        CustomerId = string.IsNullOrWhiteSpace(customerId) ? null : customerId.Trim();
    }

    public string GetCanonicalPayload()
    {
        var canonical = new StringBuilder()
            .Append(Id).Append('|')
            .Append(InvoiceNumber).Append('|')
            .Append(CreatedDate.ToString("yyyy-MM-dd'T'HH:mm:ss.ffffff'Z'", CultureInfo.InvariantCulture)).Append('|')
            .Append(TotalAmount.ToString("F2", CultureInfo.InvariantCulture)).Append('|')
            .Append(BranchId).Append('|')
            .Append(CashierId);

        foreach (var item in items.OrderBy(item => item.DrugId).ThenBy(item => item.BatchId))
        {
            canonical.Append('|')
                .Append(item.DrugId).Append('|')
                .Append(item.BatchId).Append('|')
                .Append(item.Quantity.ToString(CultureInfo.InvariantCulture)).Append('|')
                .Append(item.UnitPrice.ToString("F2", CultureInfo.InvariantCulture)).Append('|')
                .Append(item.SubTotal.ToString("F2", CultureInfo.InvariantCulture));
        }

        return canonical.ToString();
    }

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