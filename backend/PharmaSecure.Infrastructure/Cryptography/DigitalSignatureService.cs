using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Crypto.Signers;
using Org.BouncyCastle.Crypto.Digests;
using Org.BouncyCastle.Security;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Entities;

namespace PharmaSecure.Infrastructure.Cryptography;

public sealed class DigitalSignatureService : IDigitalSignatureService
{
    private readonly DigitalSignatureOptions options;

    public DigitalSignatureService(IOptions<DigitalSignatureOptions> options)
    {
        this.options = options.Value;
    }

    public InvoiceSignatureResult SignInvoice(Invoice invoice)
    {
        ArgumentNullException.ThrowIfNull(invoice);
        var hash = ComputeHash(invoice);
        var signature = SignHash(hash);
        var signedAt = DateTime.UtcNow;
        var certificateSerial = ResolveValue(options.CertificateSerial, "PHARMA_CERT_SERIAL");
        return new InvoiceSignatureResult(Convert.ToHexString(hash).ToLowerInvariant(), signature, certificateSerial, signedAt);
    }

    public bool VerifyIntegrity(Invoice invoice, DigitalSignature digitalSignature)
    {
        ArgumentNullException.ThrowIfNull(invoice);
        ArgumentNullException.ThrowIfNull(digitalSignature);

        var hash = ComputeHash(invoice);
        var expectedHash = Convert.ToHexString(hash).ToLowerInvariant();
        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.ASCII.GetBytes(expectedHash),
                Encoding.ASCII.GetBytes(digitalSignature.HashValueSha256.ToLowerInvariant())))
            return false;

        return VerifyHash(hash, digitalSignature.SignatureData);
    }

    private byte[] ComputeHash(Invoice invoice)
    {
        var canonical = new StringBuilder()
            .Append(invoice.InvoiceNumber).Append('|')
            .Append(invoice.TotalAmount.ToString("F2", CultureInfo.InvariantCulture)).Append('|')
            .Append(invoice.CreatedDate.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));

        foreach (var item in invoice.Items.OrderBy(item => item.DrugId).ThenBy(item => item.BatchId))
        {
            canonical.Append('|')
                .Append(item.DrugId).Append('|')
                .Append(item.BatchId).Append('|')
                .Append(item.Quantity.ToString(CultureInfo.InvariantCulture)).Append('|')
                .Append(item.UnitPrice.ToString("F2", CultureInfo.InvariantCulture)).Append('|')
                .Append(item.SubTotal.ToString("F2", CultureInfo.InvariantCulture));
        }

        return SHA256.HashData(Encoding.UTF8.GetBytes(canonical.ToString()));
    }

    private byte[] LoadPrivateKey()
    {
        var encodedKey = ResolveValue(options.PrivateKeyPkcs8Base64, "PHARMA_SIGNING_PRIVATE_KEY");
        try
        {
            return Convert.FromBase64String(encodedKey);
        }
        catch (FormatException exception)
        {
            throw new InvalidOperationException("The signing private key must be PKCS#8 Base64.", exception);
        }
    }

    private string SignHash(byte[] hash)
    {
        var privateKey = PrivateKeyFactory.CreateKey(LoadPrivateKey());
        var signer = new RsaDigestSigner(new Sha256Digest());
        signer.Init(true, privateKey);
        signer.BlockUpdate(hash, 0, hash.Length);
        return Convert.ToBase64String(signer.GenerateSignature());
    }

    private bool VerifyHash(byte[] hash, string signatureData)
    {
        try
        {
            var privateKey = PrivateKeyFactory.CreateKey(LoadPrivateKey());
            if (privateKey is not RsaPrivateCrtKeyParameters rsaPrivateKey)
                return false;

            var publicKey = new RsaKeyParameters(false, rsaPrivateKey.Modulus, rsaPrivateKey.PublicExponent);
            var signer = new RsaDigestSigner(new Sha256Digest());
            signer.Init(false, publicKey);
            signer.BlockUpdate(hash, 0, hash.Length);
            return signer.VerifySignature(Convert.FromBase64String(signatureData));
        }
        catch (FormatException)
        {
            return false;
        }
        catch (InvalidCipherTextException)
        {
            return false;
        }
    }

    private static string ResolveValue(string value, string environmentVariable)
    {
        if (!string.IsNullOrWhiteSpace(value) && !value.Equals($"${{{environmentVariable}}}", StringComparison.Ordinal))
            return value;

        var environmentValue = Environment.GetEnvironmentVariable(environmentVariable);
        if (string.IsNullOrWhiteSpace(environmentValue))
            throw new InvalidOperationException($"Environment variable '{environmentVariable}' is required.");

        return environmentValue;
    }
}