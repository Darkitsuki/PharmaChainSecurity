using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Returns;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/returns")]
[Authorize(Roles = "OWNER,SALES")]
public sealed class ReturnsController : ControllerBase
{
    private readonly IReturnService returnService;

    public ReturnsController(IReturnService returnService)
    {
        this.returnService = returnService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ReturnResponse>>> GetByBranchAsync(CancellationToken cancellationToken = default)
    {
        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var returns = await returnService.GetByBranchAsync(branchId, cancellationToken);
        return Ok(returns);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ReturnResponse>> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã phiếu đổi trả không được rỗng.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var returnOrder = await returnService.GetByIdAsync(id, branchId, cancellationToken);
        if (returnOrder is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Phiếu đổi trả không tồn tại.");

        return Ok(returnOrder);
    }

    [HttpGet("lookup-invoice/{invoiceQuery}")]
    public async Task<ActionResult<ReturnableInvoiceResponse>> LookupInvoiceAsync(string invoiceQuery, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(invoiceQuery))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã hóa đơn tra cứu không được rỗng.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var invoice = await returnService.LookupInvoiceForReturnAsync(invoiceQuery, branchId, cancellationToken);
        if (invoice is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Không tìm thấy hóa đơn hợp lệ tại chi nhánh.");

        return Ok(invoice);
    }

    [HttpPost]
    public async Task<ActionResult<ReturnResponse>> CreateAsync(
        [FromBody] CreateReturnRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dữ liệu yêu cầu không được rỗng.");

        if (string.IsNullOrWhiteSpace(request.InvoiceId))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã hóa đơn gốc là bắt buộc.");

        if (string.IsNullOrWhiteSpace(request.Reason))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Lý do trả hàng là bắt buộc.");

        if (request.Items is null || request.Items.Count == 0)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Danh sách sản phẩm trả không được rỗng.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var cashierId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? "us-00000000-0000-0000-0000-000000000003";

        try
        {
            var created = await returnService.CreateReturnAsync(request, branchId, cashierId, cancellationToken);
            return CreatedAtAction(nameof(GetByIdAsync), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }
}
