using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Procurement;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/purchase-orders")]
[Authorize(Roles = "OWNER,WAREHOUSE")]
public sealed class PurchaseOrdersController(IPurchaseOrderService service) : ControllerBase
{
    private async Task<IActionResult> Execute<T>(Func<Task<T>> action, bool created = false)
    {
        try
        {
            var result = await action();
            return created && result is PurchaseOrderResponse order
                ? CreatedAtAction(nameof(GetById), new { id = order.Id }, order) : Ok(result);
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException ex) { return Problem(statusCode: 404, title: ex.Message); }
        catch (ArgumentException ex) { return Problem(statusCode: 400, title: ex.Message); }
        catch (InvalidOperationException ex) { return Problem(statusCode: 409, title: ex.Message); }
    }
    [HttpGet]
    public Task<IActionResult> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null, CancellationToken cancellationToken = default)
        => Execute(() => service.GetAsync(page, pageSize, status, cancellationToken));
    [HttpGet("{id}")]
    public Task<IActionResult> GetById(string id, CancellationToken cancellationToken = default)
        => Execute(() => service.GetByIdAsync(id, cancellationToken));
    [HttpPost]
    [Authorize(Roles = "WAREHOUSE")]
    public Task<IActionResult> Create(CreatePurchaseOrderRequest request, CancellationToken cancellationToken = default)
        => Execute(() => service.CreateAsync(request, cancellationToken), true);
    [HttpPost("{id}/approve")]
    [Authorize(Roles = "OWNER")]
    public Task<IActionResult> Approve(string id, CancellationToken cancellationToken = default)
        => Execute(() => service.DecideAsync(id, true, null, cancellationToken));
    [HttpPost("{id}/reject")]
    [Authorize(Roles = "OWNER")]
    public Task<IActionResult> Reject(string id, PurchaseOrderDecisionRequest request, CancellationToken cancellationToken = default)
        => Execute(() => service.DecideAsync(id, false, request.Reason, cancellationToken));
    [HttpPost("{id}/order")]
    [Authorize(Roles = "WAREHOUSE")]
    public Task<IActionResult> Place(string id, CancellationToken cancellationToken = default)
        => Execute(() => service.PlaceAsync(id, cancellationToken));
}
