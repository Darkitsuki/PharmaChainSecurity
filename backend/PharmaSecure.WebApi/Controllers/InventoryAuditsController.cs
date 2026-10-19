using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Inventory.Audits;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/inventory-audits")]
[Authorize(Roles = "OWNER,WAREHOUSE")]
public sealed class InventoryAuditsController : ControllerBase
{
    private readonly IInventoryAuditService auditService;

    public InventoryAuditsController(IInventoryAuditService auditService)
    {
        this.auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InventoryAuditResponse>>> GetByBranchAsync(CancellationToken cancellationToken = default)
    {
        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var audits = await auditService.GetByBranchAsync(branchId, cancellationToken);
        return Ok(audits);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InventoryAuditDetailResponse>> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã đợt kiểm kê không được rỗng.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var audit = await auditService.GetByIdAsync(id, branchId, cancellationToken);
        if (audit is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Đợt kiểm kê không tồn tại.");

        return Ok(audit);
    }

    [HttpPost]
    public async Task<ActionResult<InventoryAuditDetailResponse>> CreateAuditAsync(
        [FromBody] CreateInventoryAuditRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dữ liệu yêu cầu không được rỗng.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? "us-system";

        try
        {
            var audit = await auditService.CreateAuditAsync(request, branchId, userId, cancellationToken);
            return CreatedAtAction(nameof(GetByIdAsync), new { id = audit.Id }, audit);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }

    [HttpPut("{id}/items")]
    public async Task<ActionResult<InventoryAuditDetailResponse>> UpdateCountedItemsAsync(
        string id,
        [FromBody] UpdateAuditItemsRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã đợt kiểm kê không được rỗng.");

        if (request is null || request.Items is null || request.Items.Count == 0)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Danh sách kiểm đếm không được rỗng.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        try
        {
            var updated = await auditService.UpdateCountedItemsAsync(id, branchId, request, cancellationToken);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }

    [HttpPost("{id}/reconcile")]
    [Authorize(Roles = "OWNER")]
    public async Task<ActionResult<InventoryAuditDetailResponse>> ReconcileAsync(
        string id,
        [FromBody] ReconcileAuditRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã đợt kiểm kê không được rỗng.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var ownerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? "us-owner";

        try
        {
            var result = await auditService.ReconcileAsync(id, branchId, ownerId, request?.Reason, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<InventoryAuditDetailResponse>> CancelAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã đợt kiểm kê không được rỗng.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        try
        {
            var result = await auditService.CancelAuditAsync(id, branchId, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }
}
