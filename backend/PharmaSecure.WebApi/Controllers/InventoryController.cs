using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Inventory;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Authorize(Policy = "InventoryRead")]
[Route("api/v1/inventory")]
public sealed class InventoryController : ControllerBase
{
    private readonly IInventoryQueryService inventoryQueryService;

    public InventoryController(IInventoryQueryService inventoryQueryService)
    {
        this.inventoryQueryService = inventoryQueryService;
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
}