using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Inventory;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Authorize(Policy = "InventoryRead")]
[Route("api/v1/inventory")]
public sealed class InventoryController : ControllerBase
{
    private readonly IInventoryQueryService inventoryQueryService;
    private readonly IInventoryRepository inventoryRepository;

    public InventoryController(
        IInventoryQueryService inventoryQueryService,
        IInventoryRepository inventoryRepository)
    {
        this.inventoryQueryService = inventoryQueryService;
        this.inventoryRepository = inventoryRepository;
    }

    [HttpGet]
    public async Task<ActionResult> GetPageAsync(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize is < 1 or > 100)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid pagination.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        return Ok(await inventoryQueryService.GetPageAsync(branchId, page, pageSize, cancellationToken));
    }

    [HttpPost("adjust")]
    [Authorize(Roles = "OWNER,WAREHOUSE")]
    public async Task<ActionResult> AdjustStockAsync(
        [FromBody] StockAdjustmentRequestBody request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.DrugId) || string.IsNullOrWhiteSpace(request.BatchId))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "DrugId and BatchId are required.");
        if (request.NewQuantity < 0)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Quantity cannot be negative.");
        if (string.IsNullOrWhiteSpace(request.Reason))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Adjustment reason is required.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        await inventoryRepository.AdjustStockAsync(
            branchId,
            request.DrugId,
            request.BatchId,
            request.NewQuantity,
            request.Reason,
            cancellationToken);

        return NoContent();
    }
}

public sealed record StockAdjustmentRequestBody(string DrugId, string BatchId, int NewQuantity, string Reason);