namespace PharmaSecure.Application.Features.Notifications;

public interface INotificationService
{
    Task<NotificationSummaryResponse> GetBranchNotificationsAsync(
        string branchId,
        string userRole,
        CancellationToken cancellationToken = default);
}

