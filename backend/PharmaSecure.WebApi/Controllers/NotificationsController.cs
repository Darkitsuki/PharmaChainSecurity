using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Notifications;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public sealed class NotificationsController : ControllerBase
{
    private readonly INotificationService notificationService;
    private readonly ICurrentUserContext currentUserContext;
    private readonly ILogger<NotificationsController> logger;

    public NotificationsController(
        INotificationService notificationService,
        ICurrentUserContext currentUserContext,
        ILogger<NotificationsController> logger)
    {
        this.notificationService = notificationService;
        this.currentUserContext = currentUserContext;
        this.logger = logger;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<NotificationSummaryResponse>> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.BranchId))
            return Unauthorized();

        var branchId = currentUserContext.BranchId;
        var role = currentUserContext.Role?.ToString() ?? "SALES";

        var summary = await notificationService.GetBranchNotificationsAsync(branchId, role, cancellationToken);
        return Ok(summary);
    }
}
