using PharmaSecure.Application.Common;

namespace PharmaSecure.Application.Features.Sales;

public interface ICheckoutService
{
    Task<Result<CheckoutResponse>> CheckoutAsync(
        CheckoutRequest request,
        CancellationToken cancellationToken = default);
}