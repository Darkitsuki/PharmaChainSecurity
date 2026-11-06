using Microsoft.Extensions.Options;
using PharmaSecure.Domain.Common;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Entities;
using PharmaSecure.Infrastructure.Cryptography;
using Xunit;

namespace PharmaSecure.Tests.Security;

[CollectionDefinition("Invoice signing configuration", DisableParallelization = true)]
public class InvoiceSigningConfigurationCollection { }

[Collection("Invoice signing configuration")]
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
        Assert.Contains("2026-09-30T19:34:56.000000Z", firstInvoice.GetCanonicalPayload());
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

    [Fact]
    public void VietnamTimeHelper_Now_IsWithinExpectedOffsetFromUtc()
    {
        var nowVn = VietnamTimeHelper.Now;
        var nowUtc = DateTime.UtcNow;
        var expectedVn = nowUtc.AddHours(7);

        Assert.Equal(DateTimeKind.Unspecified, nowVn.Kind);
        Assert.True(Math.Abs((nowVn - expectedVn).TotalSeconds) < 2);
    }

    [Fact]
    public void Invoice_WhenCreatedDateNotSpecified_SetsVietnamTimeWithUnspecifiedKind()
    {
        var invoice = new Invoice("HD20261103-001", "br-001", "us-001");
        var nowVn = VietnamTimeHelper.Now;

        Assert.Equal(DateTimeKind.Unspecified, invoice.CreatedDate.Kind);
        Assert.True(Math.Abs((invoice.CreatedDate - nowVn).TotalSeconds) < 2);
    }

    [Fact]
    public void Invoice_WhenUtcCreatedDateProvided_ConvertsToVietnamTime()
    {
        var utcTime = new DateTime(2026, 11, 3, 5, 0, 0, DateTimeKind.Utc);
        var invoice = new Invoice("HD20261103-002", "br-001", "us-001", createdDate: utcTime);

        Assert.Equal(DateTimeKind.Unspecified, invoice.CreatedDate.Kind);
        Assert.Equal(new DateTime(2026, 11, 3, 12, 0, 0, DateTimeKind.Unspecified), invoice.CreatedDate);
    }

    [Fact]
    public void DigitalSignature_WhenSignedAtNotSpecified_SetsVietnamTimeWithUnspecifiedKind()
    {
        var sig = new DigitalSignature("iv-001", "hash", "data", "serial");
        var nowVn = VietnamTimeHelper.Now;

        Assert.Equal(DateTimeKind.Unspecified, sig.SignedAt.Kind);
        Assert.True(Math.Abs((sig.SignedAt - nowVn).TotalSeconds) < 2);
    }

    [Fact]
    public void DigitalSignature_WhenUtcSignedAtProvided_ConvertsToVietnamTime()
    {
        var utcTime = new DateTime(2026, 11, 3, 5, 0, 0, DateTimeKind.Utc);
        var sig = new DigitalSignature("iv-001", "hash", "data", "serial", signedAt: utcTime);

        Assert.Equal(DateTimeKind.Unspecified, sig.SignedAt.Kind);
        Assert.Equal(new DateTime(2026, 11, 3, 12, 0, 0, DateTimeKind.Unspecified), sig.SignedAt);
    }

    [Fact]
    public void VerifyIntegrity_AfterServiceRecreationWithSameKey_RemainsValid()
    {
        using var rsa = System.Security.Cryptography.RSA.Create(2048);
        var options = Options.Create(new DigitalSignatureOptions
        {
            PrivateKeyPkcs8Base64 = Convert.ToBase64String(rsa.ExportPkcs8PrivateKey()),
            CertificateSerial = "STABLE-TEST-KEY"
        });
        var invoice = new Invoice("HD-RESTART", "br-test", "u-test");
        invoice.AddItem(new InvoiceItem(invoice.Id, "drug", "batch", 3, 12.35m));
        var signed = new DigitalSignatureService(options).SignInvoice(invoice);
        var stored = new DigitalSignature(invoice.Id, signed.HashValueSha256, signed.SignatureData, signed.CertificateSerial, signed.SignedAt);
        Assert.True(new DigitalSignatureService(options).VerifyIntegrity(invoice, stored));
    }

    [Fact]
    public void VerifyIntegrity_WithDifferentKey_DoesNotValidateHistoricalSignature()
    {
        var invoice = new Invoice("HD-KEY", "br-test", "u-test");
        var signed = CreateSignatureService().SignInvoice(invoice);
        var stored = new DigitalSignature(invoice.Id, signed.HashValueSha256, signed.SignatureData, signed.CertificateSerial, signed.SignedAt);
        Assert.False(CreateSignatureService().VerifyIntegrity(invoice, stored));
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-base64-key")]
    [InlineData("AAAA")]
    public void SignInvoice_WithoutUsableConfiguredKey_FailsInsteadOfGeneratingKey(string key)
    {
        var previous = Environment.GetEnvironmentVariable("PHARMA_SIGNING_PRIVATE_KEY");
        try
        {
            Environment.SetEnvironmentVariable("PHARMA_SIGNING_PRIVATE_KEY", null);
            var service = new DigitalSignatureService(Options.Create(new DigitalSignatureOptions
            { PrivateKeyPkcs8Base64 = key, CertificateSerial = "TEST" }));
            Assert.Throws<SignatureConfigurationException>(() => service.SignInvoice(new Invoice("HD-MISSING", "br", "u")));
        }
        finally { Environment.SetEnvironmentVariable("PHARMA_SIGNING_PRIVATE_KEY", previous); }
    }

    [Fact]
    public void VerifyIntegrity_WithMissingHistoricalKeyIdentifier_IsUnavailable()
    {
        var service = CreateSignatureService();
        var invoice = new Invoice("HD-HISTORY", "br", "u");
        var signed = service.SignInvoice(invoice);
        var stored = new DigitalSignature(invoice.Id, signed.HashValueSha256, signed.SignatureData, "OTHER-HISTORICAL-KEY", signed.SignedAt);
        Assert.Throws<SignatureConfigurationException>(() => service.VerifyIntegrity(invoice, stored));
    }
}
