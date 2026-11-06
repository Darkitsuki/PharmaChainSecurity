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
// Configuration errors are technical unavailability, never proof of invoice tampering.
public sealed class SignatureConfigurationException : InvalidOperationException
{
    public SignatureConfigurationException(string message, Exception? innerException = null)
        : base(message, innerException) { }
}
