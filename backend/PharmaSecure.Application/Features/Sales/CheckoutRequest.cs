namespace PharmaSecure.Application.Features.Sales;

public sealed record CheckoutLineRequest(
    string DrugId,
    string BatchId,
    int Quantity);

public sealed record CheckoutRequest(
    string BranchId,
    string CashierId,
    IReadOnlyCollection<CheckoutLineRequest> Lines);

public sealed record CheckoutResponse(
    string InvoiceId,
    string InvoiceNumber,
    decimal TotalAmount,
    string HashValueSha256);