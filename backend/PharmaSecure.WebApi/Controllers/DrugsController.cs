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
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize is < 1 or > 100)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid pagination.");

        var branchId = User.FindFirst("BranchId")?.Value;
        if (string.IsNullOrWhiteSpace(branchId))
            return Forbid();

        return Ok(await drugQueryService.GetPageAsync(branchId, page, pageSize, cancellationToken));
    }
}