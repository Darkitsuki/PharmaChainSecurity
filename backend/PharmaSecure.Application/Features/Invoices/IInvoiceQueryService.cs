using PharmaSecure.Application.Common;

namespace PharmaSecure.Application.Features.Invoices;

public sealed record InvoiceResponse(
    string InvoiceId,
    string InvoiceNumber,
    DateTime CreatedDate,
    decimal TotalAmount,
    string BranchId,
    string CashierId);

public sealed record InvoiceItemResponse(
    string DrugId,
    string DrugCode,
    string DrugName,
    string BatchId,
    int Quantity,
    decimal UnitPrice,
    decimal SubTotal);

public sealed record InvoiceSignatureResponse(
    string HashValueSha256,
    string SignatureData,
    string CertificateSerial,
    DateTime SignedAt);

public sealed record InvoiceDetailResponse(
    string InvoiceId,
    string InvoiceNumber,
    DateTime CreatedDate,
    decimal TotalAmount,
    string BranchId,
    string CashierId,
    IReadOnlyCollection<InvoiceItemResponse> Items,
    InvoiceSignatureResponse? Signature);

public interface IInvoiceQueryService
{
    Task<PagedResult<InvoiceResponse>> GetPageAsync(
        string branchId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<InvoiceDetailResponse?> GetByIdAsync(
        string branchId,
        string id,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<InvoiceItemResponse>> GetItemsAsync(
        string branchId,
        string invoiceId,
        CancellationToken cancellationToken = default);
}