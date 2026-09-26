namespace PharmaSecure.Application.Features.Sales;

public sealed record CheckoutLineRequest(
    string DrugId,
    string BatchId,
    int Quantity);

public sealed record CheckoutRequest(
    IReadOnlyCollection<CheckoutLineRequest>? Lines);

public sealed record CheckoutResponse(
    string InvoiceId,
    string InvoiceNumber,
    DateTime CreatedDate,
    decimal TotalAmount,
    string BranchId,
    string CashierId,
    IReadOnlyCollection<CheckoutInvoiceItemResponse> Items,
    CheckoutSignatureResponse Signature);

public sealed record CheckoutInvoiceItemResponse(
    string DrugId,
    string BatchId,
    int Quantity,
    decimal UnitPrice,
    decimal SubTotal);

public sealed record CheckoutSignatureResponse(
    string HashValueSha256,
    string SignatureData,
    string CertificateSerial,
    DateTime SignedAt);