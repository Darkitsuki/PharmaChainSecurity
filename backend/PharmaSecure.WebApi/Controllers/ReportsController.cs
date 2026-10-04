using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Reports;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/reports")]
[Authorize(Roles = "OWNER")]
public sealed class ReportsController : ControllerBase
{
    private readonly IReportService reportService;
    private readonly ICurrentUserContext currentUserContext;
    private readonly ILogger<ReportsController> logger;

    public ReportsController(
        IReportService reportService,
        ICurrentUserContext currentUserContext,
        ILogger<ReportsController> logger)
    {
        this.reportService = reportService;
        this.currentUserContext = currentUserContext;
        this.logger = logger;
    }

    [HttpGet("sales-summary")]
    public async Task<IActionResult> GetSalesSummary(
        [FromQuery] int days = 7,
        CancellationToken cancellationToken = default)
    {
        if (days <= 0 || days > 365)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid days parameter",
                Detail = "Days must be between 1 and 365."
            });
        }

        var branchId = currentUserContext.BranchId;
        logger.LogInformation("Generating sales summary report for branch {BranchId} over {Days} days", branchId, days);

        var report = await reportService.GetSalesSummaryAsync(branchId, days, cancellationToken);
        return Ok(report);
    }
}
