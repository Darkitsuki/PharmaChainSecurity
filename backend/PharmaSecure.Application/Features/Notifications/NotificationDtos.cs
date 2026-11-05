namespace PharmaSecure.Application.Features.Notifications;

public sealed record NotificationItemDto(
    string Id,
    string Category,      // "ORDER", "PROCUREMENT", "INVENTORY"
    string Type,          // "PENDING_CHECKOUT", "PURCHASE_ORDER_PENDING", "TRANSFER_PENDING", "LOW_STOCK", "EXPIRING_SOON"
    string Title,
    string Subtitle,
    string TargetUrl,
    DateTime Timestamp,
    string Severity = "INFO", // "INFO", "WARNING", "URGENT"
    decimal? Amount = null
);

public sealed record NotificationSummaryResponse(
    int TotalUnread,
    int OrdersCount,
    int ProcurementCount,
    int InventoryAlertsCount,
    IReadOnlyCollection<NotificationItemDto> Items
);

