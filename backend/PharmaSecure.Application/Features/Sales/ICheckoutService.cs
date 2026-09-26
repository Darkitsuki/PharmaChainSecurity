using PharmaSecure.Application.Common;

namespace PharmaSecure.Application.Features.Sales;

public interface ICheckoutService
{
    Task<Result<CheckoutResponse>> ProcessCheckoutAsync(
        CheckoutRequest request,
        string branchId,
        string cashierId,
        CancellationToken cancellationToken = default);
}