namespace PharmaSecure.Application.Features.Sales;

public sealed class DigitalSignatureException : Exception
{
    public DigitalSignatureException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}