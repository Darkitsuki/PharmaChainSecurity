using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Sales;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Authorize(Roles = "SALES")]
[Route("api/v1/checkout")]
public sealed class CheckoutController : ControllerBase
{
    private readonly ICheckoutService checkoutService;
    private readonly IIdempotencyService idempotencyService;

    public CheckoutController(ICheckoutService checkoutService, IIdempotencyService idempotencyService)
    {
        this.checkoutService = checkoutService;
        this.idempotencyService = idempotencyService;
    }

    [HttpPost]
    public async Task<ActionResult<CheckoutResponse>> ProcessCheckoutAsync(
        [FromBody] CheckoutRequest request,
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null,
        CancellationToken cancellationToken = default)
    {
        if (request?.Lines is null || request.Lines.Count == 0 || request.Lines.Any(line =>
                line is null ||
                string.IsNullOrWhiteSpace(line.DrugId) ||
                string.IsNullOrWhiteSpace(line.BatchId) ||
                line.Quantity <= 0))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Checkout lines are invalid.");

        var branchId = User.Claims.FirstOrDefault(claim => claim.Type is "BranchId" or "branch_id")?.Value;
        var cashierId = User.Claims.FirstOrDefault(claim => claim.Type == "UserId")?.Value
            ?? User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
        if (!User.Identity?.IsAuthenticated ?? true)
            return Unauthorized();
        if (string.IsNullOrWhiteSpace(branchId) || string.IsNullOrWhiteSpace(cashierId))
            return Forbid();

        var cacheKey = !string.IsNullOrWhiteSpace(idempotencyKey)
            ? $"checkout:{branchId}:{cashierId}:{idempotencyKey.Trim()}"
            : null;
        if (cacheKey is not null && idempotencyService.TryGet<CheckoutResponse>(cacheKey, out var cachedResponse) && cachedResponse is not null)
        {
            Response.Headers["X-Idempotent-Replayed"] = "true";
            return Ok(cachedResponse);
        }

        try
        {
            var result = await checkoutService.ProcessCheckoutAsync(request, branchId, cashierId, cancellationToken);
            if (result.IsFailure)
                return UnprocessableEntity(new ProblemDetails { Title = result.Error, Status = StatusCodes.Status422UnprocessableEntity });

            if (cacheKey is not null)
                idempotencyService.Set(cacheKey, result.Value, TimeSpan.FromHours(24));

            return Ok(result.Value);
        }
        catch (InsufficientStockException exception)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Insufficient stock.", detail: exception.Message);
        }
    }
}