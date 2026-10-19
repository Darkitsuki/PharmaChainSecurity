using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Inventory.Transfers;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/stock-transfers")]
[Authorize(Roles = "OWNER,WAREHOUSE")]
public sealed class StockTransfersController : ControllerBase
{
    private readonly IStockTransferService transferService;

    public StockTransfersController(IStockTransferService transferService)
    {
        this.transferService = transferService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StockTransferResponse>>> GetTransfersAsync(
        [FromQuery] string? direction,
        CancellationToken cancellationToken = default)
    {
        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var transfers = await transferService.GetTransfersAsync(branchId, direction, cancellationToken);
        return Ok(transfers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StockTransferDetailResponse>> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã phiếu điều chuyển không được rỗng.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var transfer = await transferService.GetByIdAsync(id, branchId, cancellationToken);
        if (transfer is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Phiếu điều chuyển không tồn tại hoặc không thuộc thẩm quyền chi nhánh.");

        return Ok(transfer);
    }

    [HttpPost]
    public async Task<ActionResult<StockTransferDetailResponse>> CreateTransferAsync(
        [FromBody] CreateStockTransferRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dữ liệu yêu cầu không được rỗng.");

        if (string.IsNullOrWhiteSpace(request.ToBranchId))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Chi nhánh nhận là bắt buộc.");

        if (request.Items is null || request.Items.Count == 0)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Danh sách sản phẩm điều chuyển không được rỗng.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? "us-system";

        try
        {
            var created = await transferService.CreateTransferAsync(request, branchId, userId, cancellationToken);
            return CreatedAtAction(nameof(GetByIdAsync), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }

    [HttpPost("{id}/ship")]
    public async Task<ActionResult<StockTransferDetailResponse>> ShipTransferAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã phiếu điều chuyển không được rỗng.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? "us-system";

        try
        {
            var shipped = await transferService.ShipTransferAsync(id, branchId, userId, cancellationToken);
            return Ok(shipped);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }

    [HttpPost("{id}/receive")]
    public async Task<ActionResult<StockTransferDetailResponse>> ReceiveTransferAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã phiếu điều chuyển không được rỗng.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? "us-system";

        try
        {
            var received = await transferService.ReceiveTransferAsync(id, branchId, userId, cancellationToken);
            return Ok(received);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<StockTransferDetailResponse>> CancelTransferAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã phiếu điều chuyển không được rỗng.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? "us-system";

        try
        {
            var cancelled = await transferService.CancelTransferAsync(id, branchId, userId, cancellationToken);
            return Ok(cancelled);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }
}
