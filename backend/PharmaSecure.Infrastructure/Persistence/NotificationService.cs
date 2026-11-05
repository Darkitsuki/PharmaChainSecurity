using System.Data;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Inventory;
using PharmaSecure.Application.Features.Notifications;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class NotificationService : INotificationService
{
    private readonly IOracleConnectionFactory connectionFactory;
    private readonly IInventoryQueryService inventoryQueryService;
    private readonly ILogger<NotificationService> logger;

    public NotificationService(
        IOracleConnectionFactory connectionFactory,
        IInventoryQueryService inventoryQueryService,
        ILogger<NotificationService> logger)
    {
        this.connectionFactory = connectionFactory;
        this.inventoryQueryService = inventoryQueryService;
        this.logger = logger;
    }

    public async Task<NotificationSummaryResponse> GetBranchNotificationsAsync(
        string branchId,
        string userRole,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            return new NotificationSummaryResponse(0, 0, 0, 0, Array.Empty<NotificationItemDto>());

        var items = new List<NotificationItemDto>();
        int ordersCount = 0;
        int procurementCount = 0;
        int inventoryAlertsCount = 0;

        var roleUpper = userRole?.ToUpperInvariant() ?? "SALES";
        var canViewOrders = roleUpper is "SALES" or "OWNER";
        var canViewProcurement = roleUpper is "WAREHOUSE" or "OWNER";
        var canViewInventory = true;

        await using var connection = await connectionFactory.CreateOpenConnectionAsync(branchId, cancellationToken);
        await using var sessionContextScope = new OracleSessionContextScope(connectionFactory, connection);

        // 1. Online orders waiting for counter payment & medicine preparation
        if (canViewOrders)
        {
            try
            {
                await using var cmd = connection.CreateCommand();
                cmd.BindByName = true;
                cmd.CommandText = """
                    SELECT i.id, i.InvoiceNo, i.TotalAmount, i.CreatedDate,
                           NVL(c.FullName, 'Khách hàng vãng lai') AS CustomerName,
                           NVL(c.PhoneNumber, '') AS PhoneNumber
                    FROM INVOICES i
                    LEFT JOIN CUSTOMERS c ON i.CustomerId = c.id
                    WHERE i.BranchId = :branchId
                      AND i.PaymentStatus = 'PENDING'
                      AND NVL(i.Status, 'COMPLETED') != 'CANCELLED'
                    ORDER BY i.CreatedDate DESC
                    FETCH FIRST 15 ROWS ONLY
                    """;
                cmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    ordersCount++;
                    var id = reader.GetString(0);
                    var invNo = reader.GetString(1);
                    var total = reader.GetDecimal(2);
                    var date = reader.GetDateTime(3);
                    var custName = reader.GetString(4);
                    var phone = reader.GetString(5);

                    var phoneStr = string.IsNullOrWhiteSpace(phone) ? "" : $" ({phone})";
                    items.Add(new NotificationItemDto(
                        Id: $"ord-{id}",
                        Category: "ORDER",
                        Type: "PENDING_CHECKOUT",
                        Title: $"Đơn mới {invNo} chờ chuẩn bị & thu tiền",
                        Subtitle: $"{custName}{phoneStr} · {total:N0} đ",
                        TargetUrl: "/invoices",
                        Timestamp: date,
                        Severity: "URGENT",
                        Amount: total
                    ));
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Lỗi truy vấn thông báo đơn hàng chi nhánh {BranchId}", branchId);
            }
        }

        // 2. Procurement (Purchase Orders & Stock Transfers)
        if (canViewProcurement)
        {
            try
            {
                await using var cmd = connection.CreateCommand();
                cmd.BindByName = true;
                cmd.CommandText = """
                    SELECT p.id, p.OrderNo, p.TotalAmount, p.CreatedDate, NVL(s.SupplierName, 'Nhà cung cấp')
                    FROM PURCHASE_ORDERS p
                    LEFT JOIN SUPPLIERS s ON s.id = p.SupplierId
                    WHERE p.BranchId = :branchId
                      AND p.Status = 'PENDING'
                    ORDER BY p.CreatedDate DESC
                    FETCH FIRST 10 ROWS ONLY
                    """;
                cmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    procurementCount++;
                    var id = reader.GetString(0);
                    var poNo = reader.GetString(1);
                    var total = reader.IsDBNull(2) ? 0m : reader.GetDecimal(2);
                    var date = reader.GetDateTime(3);
                    var supName = reader.GetString(4);

                    items.Add(new NotificationItemDto(
                        Id: $"po-{id}",
                        Category: "PROCUREMENT",
                        Type: "PURCHASE_ORDER_PENDING",
                        Title: $"Đơn mua thuốc {poNo} chờ phê duyệt",
                        Subtitle: $"NCC: {supName} · {total:N0} đ",
                        TargetUrl: "/purchase-orders",
                        Timestamp: date,
                        Severity: "WARNING",
                        Amount: total
                    ));
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Lỗi truy vấn thông báo đơn mua hàng chi nhánh {BranchId}", branchId);
            }

            try
            {
                await using var cmd = connection.CreateCommand();
                cmd.BindByName = true;
                cmd.CommandText = """
                    SELECT t.id, t.TransferNo, t.Status, t.CreatedDate, fb.BranchName, tb.BranchName
                    FROM STOCK_TRANSFERS t
                    INNER JOIN BRANCHES fb ON t.FromBranchId = fb.id
                    INNER JOIN BRANCHES tb ON t.ToBranchId = tb.id
                    WHERE ((t.FromBranchId = :branchId AND t.Status IN ('REQUESTED', 'PENDING'))
                        OR (t.ToBranchId = :branchId AND t.Status = 'SHIPPED'))
                    ORDER BY t.CreatedDate DESC
                    FETCH FIRST 10 ROWS ONLY
                    """;
                cmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    procurementCount++;
                    var id = reader.GetString(0);
                    var stNo = reader.GetString(1);
                    var status = reader.GetString(2);
                    var date = reader.GetDateTime(3);
                    var fromBranch = reader.GetString(4);
                    var toBranch = reader.GetString(5);

                    var isIncoming = string.Equals(status, "SHIPPED", StringComparison.OrdinalIgnoreCase);
                    var title = isIncoming
                        ? $"Phiếu chuyển kho {stNo} đang chuyển đến"
                        : $"Yêu cầu xuất chuyển kho {stNo} chờ xử lý";
                    var subtitle = isIncoming
                        ? $"Từ {fromBranch} -> Cần kiểm đếm nhận hàng"
                        : $"Chuyển đến {toBranch} -> Cần duyệt xuất kho";

                    items.Add(new NotificationItemDto(
                        Id: $"st-{id}",
                        Category: "PROCUREMENT",
                        Type: "TRANSFER_PENDING",
                        Title: title,
                        Subtitle: subtitle,
                        TargetUrl: "/stock-transfers",
                        Timestamp: date,
                        Severity: "INFO"
                    ));
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Lỗi truy vấn thông báo chuyển kho chi nhánh {BranchId}", branchId);
            }
        }

        // 3. Inventory Alerts (Low stock & Expiring soon)
        if (canViewInventory)
        {
            try
            {
                var lowStock = await inventoryQueryService.GetLowStockAsync(branchId, threshold: 10, cancellationToken);
                foreach (var alert in lowStock.Take(8))
                {
                    inventoryAlertsCount++;
                    items.Add(new NotificationItemDto(
                        Id: $"low-{alert.DrugId}-{alert.BatchId}",
                        Category: "INVENTORY",
                        Type: "LOW_STOCK",
                        Title: $"Thuốc sắp hết: {alert.DrugName}",
                        Subtitle: $"Mã: {alert.DrugCode} · Còn lại: {alert.Quantity} (Ngưỡng an toàn: 10)",
                        TargetUrl: "/inventory",
                        Timestamp: DateTime.UtcNow,
                        Severity: alert.Quantity == 0 ? "URGENT" : "WARNING"
                    ));
                }

                var expiringSoon = await inventoryQueryService.GetExpiringSoonAsync(branchId, days: 60, cancellationToken);
                foreach (var alert in expiringSoon.Take(8))
                {
                    inventoryAlertsCount++;
                    var daysRemaining = (alert.ExpiryDate.Date - DateTime.UtcNow.Date).Days;
                    items.Add(new NotificationItemDto(
                        Id: $"exp-{alert.DrugId}-{alert.BatchId}",
                        Category: "INVENTORY",
                        Type: "EXPIRING_SOON",
                        Title: $"Lô thuốc cận date: {alert.DrugName}",
                        Subtitle: $"Lô: {alert.BatchNo} · Hết hạn: {alert.ExpiryDate:dd/MM/yyyy} (còn {daysRemaining} ngày)",
                        TargetUrl: "/inventory",
                        Timestamp: DateTime.UtcNow,
                        Severity: daysRemaining <= 15 ? "URGENT" : "WARNING"
                    ));
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Lỗi truy vấn cảnh báo tồn kho chi nhánh {BranchId}", branchId);
            }
        }

        var sortedItems = items.OrderByDescending(i => i.Severity == "URGENT")
                               .ThenByDescending(i => i.Timestamp)
                               .ToList();

        var totalUnread = ordersCount + procurementCount + inventoryAlertsCount;

        return new NotificationSummaryResponse(
            TotalUnread: totalUnread,
            OrdersCount: ordersCount,
            ProcurementCount: procurementCount,
            InventoryAlertsCount: inventoryAlertsCount,
            Items: sortedItems
        );
    }
}

