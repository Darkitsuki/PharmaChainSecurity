using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Invoices;
using PharmaSecure.Application.Features.Sales;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/invoices")]
public sealed class InvoicesController : ControllerBase
{
    private readonly ICheckoutService checkoutService;
    private readonly IInvoiceQueryService invoiceQueryService;
    private readonly ICurrentUserContext currentUserContext;

    public InvoicesController(
        ICheckoutService checkoutService,
        IInvoiceQueryService invoiceQueryService,
        ICurrentUserContext currentUserContext)
    {
        this.checkoutService = checkoutService;
        this.invoiceQueryService = invoiceQueryService;
        this.currentUserContext = currentUserContext;
    }

    [HttpGet]
    public async Task<ActionResult> GetPageAsync(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize is < 1 or > 100)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid pagination.");
        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.BranchId))
            return Unauthorized();

        return Ok(await invoiceQueryService.GetPageAsync(
            currentUserContext.BranchId,
            page,
            pageSize,
            cancellationToken));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceDetailResponse>> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invoice ID is required.");
        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.BranchId))
            return Unauthorized();

        var invoice = await invoiceQueryService.GetByIdAsync(currentUserContext.BranchId, id, cancellationToken);
        if (invoice is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Invoice was not found.");

        return Ok(invoice);
    }

    [HttpGet("{id}/items")]
    public async Task<ActionResult<IReadOnlyCollection<InvoiceItemResponse>>> GetItemsAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invoice ID is required.");
        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.BranchId))
            return Unauthorized();

        var items = await invoiceQueryService.GetItemsAsync(currentUserContext.BranchId, id, cancellationToken);
        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = "OWNER,SALES")]
    public async Task<ActionResult> CheckoutAsync(
        [FromBody] CheckoutRequestBody request,
        CancellationToken cancellationToken = default)
    {
        if (request.Lines is null || request.Lines.Count == 0)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "At least one invoice line is required.");
        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.UserId) || string.IsNullOrWhiteSpace(currentUserContext.BranchId))
            return Unauthorized();

        var result = await checkoutService.CheckoutAsync(
            new CheckoutRequest(
                currentUserContext.BranchId,
                currentUserContext.UserId,
                request.Lines.Select(line => new CheckoutLineRequest(line.DrugId, line.BatchId, line.Quantity)).ToArray()),
            cancellationToken);

        if (result.IsFailure)
            return UnprocessableEntity(new ProblemDetails { Title = result.Error, Status = StatusCodes.Status422UnprocessableEntity });

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }
}

public sealed record CheckoutRequestBody(IReadOnlyCollection<CheckoutLineBody> Lines);

public sealed record CheckoutLineBody(string DrugId, string BatchId, int Quantity);