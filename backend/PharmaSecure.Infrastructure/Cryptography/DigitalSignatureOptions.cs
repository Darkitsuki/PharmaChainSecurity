namespace PharmaSecure.Infrastructure.Cryptography;

public sealed class DigitalSignatureOptions
{
    public string PrivateKeyPkcs8Base64 { get; init; } = string.Empty;

    public string CertificateSerial { get; init; } = string.Empty;
}