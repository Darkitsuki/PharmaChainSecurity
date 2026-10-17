using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Branches;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/branches")]
[Authorize(Roles = "OWNER")]
public sealed class BranchesController : ControllerBase
{
    private readonly IBranchService branchService;

    public BranchesController(IBranchService branchService)
    {
        this.branchService = branchService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BranchResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var branches = await branchService.GetAllAsync(cancellationToken);
        return Ok(branches);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BranchResponse>> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã chi nhánh không được để trống.");

        var branch = await branchService.GetByIdAsync(id, cancellationToken);
        if (branch is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Chi nhánh không tồn tại.");

        return Ok(branch);
    }

    [HttpPost]
    public async Task<ActionResult<BranchResponse>> CreateAsync(
        [FromBody] CreateBranchRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dữ liệu yêu cầu không được rỗng.");

        if (string.IsNullOrWhiteSpace(request.Id) || string.IsNullOrWhiteSpace(request.BranchName))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã chi nhánh và Tên chi nhánh là bắt buộc.");

        try
        {
            var created = await branchService.CreateAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetByIdAsync), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, title: ex.Message);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BranchResponse>> UpdateAsync(
        string id,
        [FromBody] UpdateBranchRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã chi nhánh không được để trống.");

        if (request is null || string.IsNullOrWhiteSpace(request.BranchName))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Tên chi nhánh là bắt buộc.");

        try
        {
            var updated = await branchService.UpdateAsync(id, request, cancellationToken);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status404NotFound, title: ex.Message);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }
}
