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

    [HttpPost]
    [Authorize(Roles = "OWNER")]
    public async Task<ActionResult<DrugResponse>> CreateAsync(
        [FromBody] CreateDrugRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Request body cannot be null.");
        if (string.IsNullOrWhiteSpace(request.DrugCode) || string.IsNullOrWhiteSpace(request.Name))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "DrugCode and Name are required.");
        if (string.IsNullOrWhiteSpace(request.Unit))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Unit is required.");
        if (request.Price < 0)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Price cannot be negative.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        try
        {
            var created = await drugQueryService.CreateDrugAsync(branchId, request, cancellationToken);
            return CreatedAtAction(nameof(GetByIdAsync), new { id = created.DrugId }, created);
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
    [Authorize(Roles = "OWNER")]
    public async Task<ActionResult<DrugResponse>> UpdateAsync(
        string id,
        [FromBody] UpdateDrugRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Drug ID is required.");
        if (request is null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Request body cannot be null.");
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Unit))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Name and Unit are required.");
        if (request.Price < 0)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Price cannot be negative.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        try
        {
            var updated = await drugQueryService.UpdateDrugAsync(branchId, id, request, cancellationToken);
            if (updated is null)
                return Problem(statusCode: StatusCodes.Status404NotFound, title: "Drug was not found.");

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "OWNER")]
    public async Task<ActionResult> DeactivateAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Drug ID is required.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        var success = await drugQueryService.DeactivateDrugAsync(branchId, id, cancellationToken);
        if (!success)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Drug was not found.");

        return NoContent();
    }
}