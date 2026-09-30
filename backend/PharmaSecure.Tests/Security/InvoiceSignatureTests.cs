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

    [Fact]
    public void VerifyIntegrity_AfterOracleTimestampRoundTrip_ReturnsTrue()
    {
        var service = CreateSignatureService();
        var createdDate = new DateTime(2026, 9, 30, 12, 34, 56, DateTimeKind.Utc).AddTicks(1234567);
        var signedInvoice = new Invoice("HD20260930-001", "br-001", "us-001", createdDate, "iv-001");
        signedInvoice.AddItem(new InvoiceItem(signedInvoice.Id, "dr-001", "bt-001", 2, 35000m));
        signedInvoice.MarkAsPaid();
        signedInvoice.LockInvoice();

        var signatureResult = service.SignInvoice(signedInvoice);
        var databaseTimestamp = DateTime.SpecifyKind(signedInvoice.CreatedDate, DateTimeKind.Unspecified);
        var reconstructedInvoice = new Invoice(
            signedInvoice.InvoiceNumber,
            signedInvoice.BranchId,
            signedInvoice.CashierId,
            databaseTimestamp,
            signedInvoice.Id);
        reconstructedInvoice.AddItem(new InvoiceItem(reconstructedInvoice.Id, "dr-001", "bt-001", 2, 35000m));
        reconstructedInvoice.MarkAsPaid();
        reconstructedInvoice.LockInvoice();

        var digitalSignature = new DigitalSignature(
            signedInvoice.Id,
            signatureResult.HashValueSha256,
            signatureResult.SignatureData,
            signatureResult.CertificateSerial,
            signatureResult.SignedAt);

        Assert.True(service.VerifyIntegrity(reconstructedInvoice, digitalSignature));
    }

    [Fact]
    public void GetCanonicalPayload_WhenItemsAreAddedInDifferentOrders_ReturnsSamePayload()
    {
        var createdDate = new DateTime(2026, 9, 30, 12, 34, 56, DateTimeKind.Utc);
        var firstInvoice = new Invoice("HD20260930-003", "br-001", "us-001", createdDate, "iv-003");
        firstInvoice.AddItem(new InvoiceItem(firstInvoice.Id, "dr-002", "bt-002", 1, 20m));
        firstInvoice.AddItem(new InvoiceItem(firstInvoice.Id, "dr-001", "bt-001", 2, 10m));

        var secondInvoice = new Invoice("HD20260930-003", "br-001", "us-001", createdDate, "iv-003");
        secondInvoice.AddItem(new InvoiceItem(secondInvoice.Id, "dr-001", "bt-001", 2, 10m));
        secondInvoice.AddItem(new InvoiceItem(secondInvoice.Id, "dr-002", "bt-002", 1, 20m));

        Assert.Equal(firstInvoice.GetCanonicalPayload(), secondInvoice.GetCanonicalPayload());
        Assert.Contains("2026-09-30T12:34:56.000000Z", firstInvoice.GetCanonicalPayload());
    }

    [Theory]
    [InlineData("iv-002", "br-001", "us-001")]
    [InlineData("iv-001", "br-002", "us-001")]
    [InlineData("iv-001", "br-001", "us-002")]
    public void VerifyIntegrity_WhenInvoiceIdentityChanges_ReturnsFalse(
        string invoiceId,
        string branchId,
        string cashierId)
    {
        var service = CreateSignatureService();
        var createdDate = new DateTime(2026, 9, 30, 12, 34, 56, DateTimeKind.Utc);
        var signedInvoice = new Invoice("HD20260930-002", "br-001", "us-001", createdDate, "iv-001");
        signedInvoice.AddItem(new InvoiceItem(signedInvoice.Id, "dr-001", "bt-001", 1, 35000m));
        signedInvoice.MarkAsPaid();
        signedInvoice.LockInvoice();

        var signatureResult = service.SignInvoice(signedInvoice);
        var tamperedInvoice = new Invoice(
            signedInvoice.InvoiceNumber,
            branchId,
            cashierId,
            signedInvoice.CreatedDate,
            invoiceId);
        tamperedInvoice.AddItem(new InvoiceItem(tamperedInvoice.Id, "dr-001", "bt-001", 1, 35000m));
        tamperedInvoice.MarkAsPaid();
        tamperedInvoice.LockInvoice();
        var digitalSignature = new DigitalSignature(
            signedInvoice.Id,
            signatureResult.HashValueSha256,
            signatureResult.SignatureData,
            signatureResult.CertificateSerial,
            signatureResult.SignedAt);

        Assert.False(service.VerifyIntegrity(tamperedInvoice, digitalSignature));
    }
}
