using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Procurement;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/goods-receipts")]
[Authorize(Roles = "OWNER,WAREHOUSE")]
public sealed class GoodsReceiptsController : ControllerBase
{
    private readonly IGoodsReceiptService goodsReceiptService;

    public GoodsReceiptsController(IGoodsReceiptService goodsReceiptService)
    {
        this.goodsReceiptService = goodsReceiptService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<GoodsReceiptResponse>>> GetByBranchAsync(CancellationToken cancellationToken = default)
    {
        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var receipts = await goodsReceiptService.GetByBranchAsync(branchId, cancellationToken);
        return Ok(receipts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GoodsReceiptResponse>> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Receipt ID is required.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var receipt = await goodsReceiptService.GetByIdAsync(id, branchId, cancellationToken);
        if (receipt is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Goods receipt was not found.");

        return Ok(receipt);
    }

    [HttpPost]
    public async Task<ActionResult<GoodsReceiptResponse>> CreateAsync(
        [FromBody] CreateGoodsReceiptRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Request body cannot be null.");
        if (string.IsNullOrWhiteSpace(request.SupplierId))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "SupplierId is required.");
        if (request.Items is null || request.Items.Count == 0)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Items list cannot be empty.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value
                     ?? "us-00000000-0000-0000-0000-000000000002";

        try
        {
            var created = await goodsReceiptService.CreateReceiptAsync(branchId, userId, request, cancellationToken);
            return CreatedAtAction(nameof(GetByIdAsync), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status422UnprocessableEntity, title: ex.Message);
        }
    }
}
