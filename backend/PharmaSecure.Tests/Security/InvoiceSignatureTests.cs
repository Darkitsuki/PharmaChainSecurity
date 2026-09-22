using Microsoft.Extensions.Options;
using PharmaSecure.Domain.Entities;
using PharmaSecure.Infrastructure.Cryptography;
using Xunit;

namespace PharmaSecure.Tests.Security;

public class InvoiceSignatureTests
{
    private static DigitalSignatureService CreateSignatureService()
    {
        // RSA 2048-bit test key in PKCS#8 format
        using var rsa = System.Security.Cryptography.RSA.Create(2048);
        var privateKeyPkcs8Base64 = Convert.ToBase64String(rsa.ExportPkcs8PrivateKey());

        var options = Options.Create(new DigitalSignatureOptions
        {
            PrivateKeyPkcs8Base64 = privateKeyPkcs8Base64,
            CertificateSerial = "TEST-CERT-123456"
        });

        return new DigitalSignatureService(options);
    }

    [Fact]
    public void SignInvoice_WhenInvoiceIsValid_GeneratesValidSha256Signature()
    {
        // Arrange
        var service = CreateSignatureService();
        var invoice = new Invoice("HD20260101-001", "br-001", "us-001");
        invoice.AddItem(new InvoiceItem(invoice.Id, "dr-001", "bt-001", 2, 50000m));
        invoice.MarkAsPaid();
        invoice.LockInvoice();

        // Act
        var signatureResult = service.SignInvoice(invoice);

        // Assert
        Assert.NotNull(signatureResult);
        Assert.False(string.IsNullOrWhiteSpace(signatureResult.HashValueSha256));
        Assert.False(string.IsNullOrWhiteSpace(signatureResult.SignatureData));
        Assert.Equal(64, signatureResult.HashValueSha256.Length); // SHA-256 hex string is 64 chars
    }

    [Fact]
    public void VerifyIntegrity_WhenUntampered_ReturnsTrue()
    {
        // Arrange
        var service = CreateSignatureService();
        var invoice = new Invoice("HD20260101-002", "br-001", "us-001");
        invoice.AddItem(new InvoiceItem(invoice.Id, "dr-001", "bt-001", 1, 35000m));
        invoice.MarkAsPaid();
        invoice.LockInvoice();

        var signatureResult = service.SignInvoice(invoice);
        var digitalSignature = new DigitalSignature(
            invoice.Id,
            signatureResult.HashValueSha256,
            signatureResult.SignatureData,
            signatureResult.CertificateSerial,
            signatureResult.SignedAt);

        // Act
        var isValid = service.VerifyIntegrity(invoice, digitalSignature);

        // Assert
        Assert.True(isValid);
    }

    [Fact]
    public void VerifyIntegrity_WhenHashMismatched_ReturnsFalse()
    {
        // Arrange
        var service = CreateSignatureService();
        var invoice = new Invoice("HD20260101-003", "br-001", "us-001");
        invoice.AddItem(new InvoiceItem(invoice.Id, "dr-001", "bt-001", 1, 35000m));
        invoice.MarkAsPaid();
        invoice.LockInvoice();

        var signatureResult = service.SignInvoice(invoice);
        // Tampered hash
        var fakeHash = "0000000000000000000000000000000000000000000000000000000000000000";
        var digitalSignature = new DigitalSignature(
            invoice.Id,
            fakeHash,
            signatureResult.SignatureData,
            signatureResult.CertificateSerial,
            signatureResult.SignedAt);

        // Act
        var isValid = service.VerifyIntegrity(invoice, digitalSignature);

        // Assert
        Assert.False(isValid);
    }
}
