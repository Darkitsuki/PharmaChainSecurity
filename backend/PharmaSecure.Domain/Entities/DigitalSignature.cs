namespace PharmaSecure.Domain.Entities;

public sealed class DigitalSignature : EntityBase<string>
{
    private DigitalSignature()
    {
    }

    public DigitalSignature(
        string invoiceId,
        string hashValueSha256,
        string signatureData,
        string certificateSerial,
        DateTime? signedAt = null,
        string? id = null)
    {
        Id = id ?? Guid.NewGuid().ToString("D");
        InvoiceId = string.IsNullOrWhiteSpace(invoiceId) ? throw new ArgumentException("Invoice ID is required.", nameof(invoiceId)) : invoiceId;
        HashValueSha256 = string.IsNullOrWhiteSpace(hashValueSha256) ? throw new ArgumentException("Hash value is required.", nameof(hashValueSha256)) : hashValueSha256;
        SignatureData = string.IsNullOrWhiteSpace(signatureData) ? throw new ArgumentException("Signature data is required.", nameof(signatureData)) : signatureData;
        CertificateSerial = string.IsNullOrWhiteSpace(certificateSerial) ? throw new ArgumentException("Certificate serial is required.", nameof(certificateSerial)) : certificateSerial;
        SignedAt = signedAt ?? DateTime.UtcNow;
    }

    public string InvoiceId { get; private set; } = null!;

    public string HashValueSha256 { get; private set; } = null!;

    public string SignatureData { get; private set; } = null!;

    public string CertificateSerial { get; private set; } = null!;

    public DateTime SignedAt { get; private set; }

    public Invoice Invoice { get; private set; } = null!;
}