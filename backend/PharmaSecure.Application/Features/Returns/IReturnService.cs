namespace PharmaSecure.Application.Features.Returns;

public interface IReturnService
{
    Task<IReadOnlyList<ReturnResponse>> GetByBranchAsync(string branchId, CancellationToken cancellationToken = default);
    Task<ReturnResponse?> GetByIdAsync(string id, string branchId, CancellationToken cancellationToken = default);
    Task<ReturnableInvoiceResponse?> LookupInvoiceForReturnAsync(string invoiceQuery, string branchId, CancellationToken cancellationToken = default);
    Task<ReturnResponse> CreateReturnAsync(CreateReturnRequest request, string branchId, string cashierId, CancellationToken cancellationToken = default);
}
