using PharmaSecure.Application.Common;

namespace PharmaSecure.Application.Features.Invoices;

public sealed record InvoiceResponse(
    string InvoiceId,
    string InvoiceNumber,
    DateTime CreatedDate,
    decimal TotalAmount,
    string BranchId,
    string CashierId);

public interface IInvoiceQueryService
{
    Task<PagedResult<InvoiceResponse>> GetPageAsync(
        string branchId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}