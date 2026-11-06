using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Returns;
using PharmaSecure.Application.Features.Sales;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/returns")]
[Authorize(Roles = "OWNER,SALES")]
public sealed class ReturnsController : ControllerBase
{
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> RequestLocks = new();
    private readonly IReturnService returnService;
    private readonly IIdempotencyService idempotencyService;

    public ReturnsController(IReturnService returnService, IIdempotencyService idempotencyService)
    {
        this.returnService = returnService;
        this.idempotencyService = idempotencyService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ReturnResponse>>> GetByBranchAsync(CancellationToken cancellationToken = default)
    {
        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId)) return Forbid();
        return Ok(await returnService.GetByBranchAsync(branchId, cancellationToken));
    }

    [HttpGet("{id}", Name = "GetReturnById")]
    public async Task<ActionResult<ReturnResponse>> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Return identifier is required.");
        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId)) return Forbid();
        var result = await returnService.GetByIdAsync(id, branchId, cancellationToken);
        return result is null
            ? Problem(statusCode: StatusCodes.Status404NotFound, title: "Return transaction was not found.")
            : Ok(result);
    }

    [HttpGet("lookup-invoice/{invoiceQuery}")]
    public async Task<ActionResult<ReturnableInvoiceResponse>> LookupInvoiceAsync(string invoiceQuery, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(invoiceQuery))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invoice identifier is required.");
        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId)) return Forbid();
        var result = await returnService.LookupInvoiceForReturnAsync(invoiceQuery, branchId, cancellationToken);
        return result is null
            ? Problem(statusCode: StatusCodes.Status404NotFound, title: "A paid invoice was not found in the current branch.")
            : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ReturnResponse>> CreateAsync(
        [FromBody] CreateReturnRequest request,
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Request body is required.");
        if (string.IsNullOrWhiteSpace(idempotencyKey) || idempotencyKey.Length > 100)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "A valid Idempotency-Key is required.");

        var branchId = User.FindFirst("BranchId")?.Value;
        var cashierId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(branchId) || string.IsNullOrWhiteSpace(cashierId)) return Forbid();

        var cacheKey = $"return:{branchId}:{idempotencyKey.Trim()}";
        var requestLock = RequestLocks.GetOrAdd(cacheKey, _ => new SemaphoreSlim(1, 1));
        await requestLock.WaitAsync(cancellationToken);
        try
        {
            if (idempotencyService.TryGet<ReturnResponse>(cacheKey, out var cached) && cached is not null)
            {
                Response.Headers["X-Idempotent-Replayed"] = "true";
                return Ok(cached);
            }

            var created = await returnService.CreateReturnAsync(request, branchId, cashierId, cancellationToken);
            idempotencyService.Set(cacheKey, created, TimeSpan.FromHours(24));
            return CreatedAtAction("GetById", new { id = created.Id }, created);
        }
        catch (ArgumentException exception)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: exception.Message);
        }
        catch (InvalidOperationException exception)
        {
            return Problem(statusCode: StatusCodes.Status422UnprocessableEntity, title: exception.Message);
        }
        catch (DigitalSignatureException)
        {
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "The exchange invoice could not be signed.",
                detail: "The complete transaction was rolled back.");
        }
        finally
        {
            requestLock.Release();
            if (requestLock.CurrentCount == 1)
                RequestLocks.TryRemove(new KeyValuePair<string, SemaphoreSlim>(cacheKey, requestLock));
        }
    }
}
