using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Security;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/drugs")]
public sealed class DrugsController : ControllerBase
{
    private readonly IDrugQueryService drugQueryService;

    public DrugsController(IDrugQueryService drugQueryService)
    {
        this.drugQueryService = drugQueryService;
    }

    [HttpGet]
    public async Task<ActionResult> GetPageAsync(
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize is < 1 or > 100)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid pagination.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        return Ok(await drugQueryService.GetPageAsync(branchId, page, pageSize, search, cancellationToken));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DrugResponse>> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Drug ID is required.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var drug = await drugQueryService.GetByIdAsync(branchId, id, cancellationToken);
        if (drug is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Drug was not found.");

        return Ok(drug);
    }

    [HttpGet("{id}/batches")]
    public async Task<ActionResult<IReadOnlyCollection<DrugBatchResponse>>> GetBatchesAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Drug ID is required.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var batches = await drugQueryService.GetBatchesAsync(branchId, id, cancellationToken);
        return Ok(batches);
    }
}