using PharmaSecure.Domain.Entities;

namespace PharmaSecure.Application.Interfaces;

public sealed record InvoiceSignatureResult(
    string HashValueSha256,
    string SignatureData,
    string CertificateSerial,
    DateTime SignedAt);

public interface IDigitalSignatureService
{
    InvoiceSignatureResult SignInvoice(Invoice invoice);

    bool VerifyIntegrity(Invoice invoice, DigitalSignature digitalSignature);
}