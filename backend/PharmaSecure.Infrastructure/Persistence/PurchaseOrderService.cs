using System.Text;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Common;
using PharmaSecure.Application.Features.Procurement;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Common;
using PharmaSecure.Domain.Enums;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class PurchaseOrderService(IUnitOfWork unitOfWork, ICurrentUserContext user) : IPurchaseOrderService
{
    private const decimal MinimumEstimatedUnitPrice = 1000m;
    private const decimal MaximumMoney = 9999999999999.99m;
    private string Branch => !string.IsNullOrWhiteSpace(user.BranchId) && user.IsAuthenticated
        ? user.BranchId : throw new UnauthorizedAccessException("Authenticated branch is required.");
    private string UserId => !string.IsNullOrWhiteSpace(user.UserId)
        ? user.UserId : throw new UnauthorizedAccessException("Authenticated user is required.");
    private void Require(params UserRole[] roles)
    {
        _ = Branch; _ = UserId;
        if (user.Role is null || !roles.Contains(user.Role.Value)) throw new UnauthorizedAccessException("Role is not permitted.");
    }
    private OracleCommand Command(string sql, params (string Name, object? Value)[] values)
    {
        var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
        command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
        command.BindByName = true; command.CommandText = sql;
        foreach (var (name, value) in values)
        {
            var type = value switch { int => OracleDbType.Int32, decimal => OracleDbType.Decimal,
                DateTime => OracleDbType.TimeStamp, _ => OracleDbType.Varchar2 };
            command.Parameters.Add(name, type).Value = value ?? DBNull.Value;
        }
        return command;
    }
    private async Task<T> Transaction<T>(Func<Task<T>> action, CancellationToken ct)
    {
        await unitOfWork.BeginTransactionAsync(Branch, ct);
        try { var result = await action(); await unitOfWork.CommitAsync(ct); return result; }
        catch { await unitOfWork.RollbackAsync(ct); throw; }
    }
    public static decimal Validate(CreatePurchaseOrderRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.SupplierId) || request.SupplierId.Length > 50)
            throw new ArgumentException("Nhà cung cấp không hợp lệ.");
        if (request.Items is null || request.Items.Count is < 1 or > 100)
            throw new ArgumentException("Đơn mua cần từ 1 đến 100 dòng thuốc.");
        Text(request.Notes, 500);
        var drugs = new HashSet<string>(StringComparer.Ordinal);
        decimal total = 0;
        foreach (var item in request.Items)
        {
            if (item is null || string.IsNullOrWhiteSpace(item.DrugId) || item.DrugId.Length > 50 || !drugs.Add(item.DrugId))
                throw new ArgumentException("Thuốc không hợp lệ hoặc bị lặp trong đơn.");
            if (item.Quantity <= 0 || item.EstimatedUnitPrice < MinimumEstimatedUnitPrice ||
                item.EstimatedUnitPrice > decimal.Truncate(MaximumMoney) ||
                decimal.Truncate(item.EstimatedUnitPrice) != item.EstimatedUnitPrice)
                throw new ArgumentException("Số lượng phải dương; đơn giá phải là số nguyên VND từ 1.000 đến 9.999.999.999.999 đồng.");
            Text(item.Notes, 255);
            try { total = checked(total + item.Quantity * item.EstimatedUnitPrice); }
            catch (OverflowException) { throw new ArgumentException("Tổng tiền vượt giới hạn."); }
            if (total > MaximumMoney) throw new ArgumentException("Tổng tiền vượt giới hạn.");
        }
        return total;
    }
    private static void Text(string? value, int bytes)
    {
        if (value is not null && Encoding.UTF8.GetByteCount(value) > bytes) throw new ArgumentException($"Ghi chú vượt giới hạn {bytes} byte.");
    }
    public Task<PagedResult<PurchaseOrderResponse>> GetAsync(int page, int pageSize, string? status, CancellationToken cancellationToken = default)
    {
        Require(UserRole.OWNER, UserRole.WAREHOUSE);
        if (page < 1 || pageSize is < 1 or > 100 || (long)(page - 1) * pageSize > int.MaxValue) throw new ArgumentException("Phân trang không hợp lệ.");
        if (status is not null && !new[] { "PENDING", "APPROVED", "REJECTED", "ORDERED", "RECEIVED", "CANCELLED" }.Contains(status))
            throw new ArgumentException("Trạng thái không hợp lệ.");
        return Transaction(async () =>
        {
            var filter = status is null ? "" : " AND Status=:status";
            using var count = Command("SELECT COUNT(*) FROM PURCHASE_ORDERS WHERE BranchId=:branch" + filter, ("branch", Branch));
            using var list = Command("SELECT id FROM PURCHASE_ORDERS WHERE BranchId=:branch" + filter + " ORDER BY CreatedDate DESC,id OFFSET :skip ROWS FETCH NEXT :take ROWS ONLY",
                ("branch", Branch), ("skip", checked((page - 1) * pageSize)), ("take", pageSize));
            if (status is not null) { count.Parameters.Add("status", OracleDbType.Varchar2).Value = status; list.Parameters.Add("status", OracleDbType.Varchar2).Value = status; }
            var total = Convert.ToInt32(await count.ExecuteScalarAsync(cancellationToken));
            var ids = new List<string>();
            await using (var reader = await list.ExecuteReaderAsync(cancellationToken))
                while (await reader.ReadAsync(cancellationToken)) ids.Add(reader.GetString(0));
            var result = new List<PurchaseOrderResponse>();
            foreach (var id in ids) result.Add(await Detail(id, cancellationToken));
            return new PagedResult<PurchaseOrderResponse>(result, page, pageSize, total);
        }, cancellationToken);
    }
    public Task<PurchaseOrderResponse> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        Require(UserRole.OWNER, UserRole.WAREHOUSE);
        return Transaction(() => Detail(id, cancellationToken), cancellationToken);
    }
    public Task<PurchaseOrderResponse> CreateAsync(CreatePurchaseOrderRequest request, CancellationToken cancellationToken = default)
    {
        Require(UserRole.WAREHOUSE);
        var total = Validate(request);
        return Transaction(async () =>
        {
            using var supplier = Command("SELECT COUNT(*) FROM SUPPLIERS WHERE id=:id AND IsActive=1", ("id", request.SupplierId));
            if (Convert.ToInt32(await supplier.ExecuteScalarAsync(cancellationToken)) != 1) throw new ArgumentException("Nhà cung cấp không hoạt động.");
            foreach (var item in request.Items)
            {
                using var drug = Command("SELECT COUNT(*) FROM DRUGS WHERE id=:id AND IsActive=1", ("id", item.DrugId));
                if (Convert.ToInt32(await drug.ExecuteScalarAsync(cancellationToken)) != 1) throw new ArgumentException("Thuốc không hoạt động.");
            }
            var now = VietnamTimeHelper.Now;
            var id = $"po-{Guid.NewGuid():N}";
            using var insert = Command("""
                INSERT INTO PURCHASE_ORDERS(id,OrderNo,BranchId,SupplierId,CreatedBy,TotalEstimatedAmount,Status,ExpectedDeliveryDate,Notes,CreatedDate)
                VALUES(:id,:no,:branch,:supplier,:creator,:total,'PENDING',:expected,:notes,:pDate)
                """, ("id", id), ("no", $"PO-{now:yyyyMMdd}-{Guid.NewGuid():N}"), ("branch", Branch),
                ("supplier", request.SupplierId), ("creator", UserId), ("total", total), ("expected", request.ExpectedDeliveryDate?.Date),
                ("notes", request.Notes?.Trim()), ("pDate", DateTime.SpecifyKind(now, DateTimeKind.Unspecified)));
            await insert.ExecuteNonQueryAsync(cancellationToken);
            foreach (var item in request.Items)
            {
                using var line = Command("""
                    INSERT INTO PURCHASE_ORDER_ITEMS(OrderId,DrugId,Quantity,EstimatedUnitPrice,SubTotal,Notes)
                    VALUES(:orderId,:drug,:qty,:price,:subtotal,:notes)
                    """, ("orderId", id), ("drug", item.DrugId), ("qty", item.Quantity), ("price", item.EstimatedUnitPrice),
                    ("subtotal", item.Quantity * item.EstimatedUnitPrice), ("notes", item.Notes?.Trim()));
                await line.ExecuteNonQueryAsync(cancellationToken);
            }
            await Audit(id, "CREATED", cancellationToken);
            return await Detail(id, cancellationToken);
        }, cancellationToken);
    }
    public Task<PurchaseOrderResponse> DecideAsync(string id, bool approve, string? reason, CancellationToken cancellationToken = default)
    {
        Require(UserRole.OWNER);
        if (!approve && string.IsNullOrWhiteSpace(reason)) throw new ArgumentException("Cần lý do từ chối.");
        Text(reason, 400);
        return Transaction(async () =>
        {
            await Lock(id, "PENDING", cancellationToken);
            var before = await Detail(id, cancellationToken);
            var notes = approve ? before.Notes : string.Join("\n", new[] { before.Notes, "Từ chối: " + reason?.Trim() }.Where(s => !string.IsNullOrWhiteSpace(s)));
            Text(notes, 500);
            using var update = Command("UPDATE PURCHASE_ORDERS SET Status=:status,ApprovedBy=:actor,ApprovedDate=:pDate,Notes=:notes WHERE id=:id AND BranchId=:branch",
                ("status", approve ? "APPROVED" : "REJECTED"), ("actor", UserId), ("pDate", DateTime.SpecifyKind(VietnamTimeHelper.Now, DateTimeKind.Unspecified)), ("notes", notes), ("id", id), ("branch", Branch));
            await update.ExecuteNonQueryAsync(cancellationToken);
            await Audit(id, approve ? "APPROVED" : "REJECTED", cancellationToken);
            return await Detail(id, cancellationToken);
        }, cancellationToken);
    }
    public Task<PurchaseOrderResponse> PlaceAsync(string id, CancellationToken cancellationToken = default)
    {
        Require(UserRole.WAREHOUSE);
        return Transaction(async () =>
        {
            await Lock(id, "APPROVED", cancellationToken);
            using var update = Command("UPDATE PURCHASE_ORDERS SET Status='ORDERED' WHERE id=:id AND BranchId=:branch", ("id", id), ("branch", Branch));
            await update.ExecuteNonQueryAsync(cancellationToken);
            await Audit(id, "ORDERED", cancellationToken);
            return await Detail(id, cancellationToken);
        }, cancellationToken);
    }
    private async Task Lock(string id, string expected, CancellationToken ct)
    {
        using var command = Command("SELECT Status FROM PURCHASE_ORDERS WHERE id=:id AND BranchId=:branch FOR UPDATE", ("id", id), ("branch", Branch));
        var value = await command.ExecuteScalarAsync(ct);
        if (value is null) throw new KeyNotFoundException("Không tìm thấy đơn mua trong chi nhánh.");
        if ((string)value != expected) throw new InvalidOperationException("Trạng thái đơn đã thay đổi hoặc không cho phép thao tác.");
    }
    private async Task Audit(string id, string action, CancellationToken ct)
    {
        using var command = Command("""
            INSERT INTO AUDIT_LOGS(id,UserId,Username,BranchId,EventType,FailureReason,CreatedDate)
            VALUES(:id,:userId,:username,:branch,:event,:detail,:pDate)
            """, ("id", Guid.NewGuid().ToString("N")), ("userId", UserId), ("username", user.Username), ("branch", Branch),
            ("event", "PURCHASE_ORDER_" + action), ("detail", id), ("pDate", DateTime.SpecifyKind(VietnamTimeHelper.Now, DateTimeKind.Unspecified)));
        await command.ExecuteNonQueryAsync(ct);
    }
    private async Task<PurchaseOrderResponse> Detail(string id, CancellationToken ct)
    {
        using var command = Command("""
            SELECT p.id,p.OrderNo,p.BranchId,p.SupplierId,s.SupplierName,p.CreatedBy,u.FullName,p.ApprovedBy,a.FullName,
                   p.TotalEstimatedAmount,p.Status,p.ApprovedDate,p.ExpectedDeliveryDate,p.Notes,p.CreatedDate
            FROM PURCHASE_ORDERS p JOIN SUPPLIERS s ON s.id=p.SupplierId JOIN USERS u ON u.id=p.CreatedBy
            LEFT JOIN USERS a ON a.id=p.ApprovedBy WHERE p.id=:id AND p.BranchId=:branch
            """, ("id", id), ("branch", Branch));
        PurchaseOrderResponse result;
        await using (var reader = await command.ExecuteReaderAsync(ct))
        {
            if (!await reader.ReadAsync(ct)) throw new KeyNotFoundException("Không tìm thấy đơn mua trong chi nhánh.");
            result = new(reader.GetString(0), reader.GetString(1), reader.GetString(2), reader.GetString(3), reader.GetString(4), reader.GetString(5), reader.GetString(6),
                reader.IsDBNull(7) ? null : reader.GetString(7), reader.IsDBNull(8) ? null : reader.GetString(8), reader.GetDecimal(9), reader.GetString(10),
                reader.IsDBNull(11) ? null : reader.GetDateTime(11), reader.IsDBNull(12) ? null : reader.GetDateTime(12), reader.IsDBNull(13) ? null : reader.GetString(13),
                reader.GetDateTime(14), Array.Empty<PurchaseOrderItemResponse>(), Array.Empty<PurchaseOrderReceiptResponse>());
        }
        var items = new List<PurchaseOrderItemResponse>();
        using var lines = Command("""
            SELECT i.DrugId,d.Name,i.Quantity,i.EstimatedUnitPrice,i.SubTotal,
                NVL((SELECT SUM(ri.Quantity) FROM GOODS_RECEIPT_ITEMS ri JOIN GOODS_RECEIPTS r ON r.id=ri.ReceiptId
                     WHERE r.PurchaseOrderId=i.OrderId AND r.BranchId=:branch AND r.Status='COMPLETED' AND ri.DrugId=i.DrugId),0),i.Notes
            FROM PURCHASE_ORDER_ITEMS i JOIN DRUGS d ON d.id=i.DrugId WHERE i.OrderId=:id ORDER BY d.Name,i.DrugId
            """, ("branch", Branch), ("id", id));
        await using (var reader = await lines.ExecuteReaderAsync(ct))
            while (await reader.ReadAsync(ct)) items.Add(new(reader.GetString(0), reader.GetString(1), reader.GetInt32(2), reader.GetDecimal(3), reader.GetDecimal(4), reader.GetInt32(5), reader.IsDBNull(6) ? null : reader.GetString(6)));
        var receipts = new List<PurchaseOrderReceiptResponse>();
        using var receiptCommand = Command("SELECT id,ReceiptNo,CreatedDate,Status FROM GOODS_RECEIPTS WHERE PurchaseOrderId=:id AND BranchId=:branch ORDER BY CreatedDate", ("id", id), ("branch", Branch));
        await using (var reader = await receiptCommand.ExecuteReaderAsync(ct))
            while (await reader.ReadAsync(ct)) receipts.Add(new(reader.GetString(0), reader.GetString(1), reader.GetDateTime(2), reader.GetString(3)));
        return result with { Items = items, Receipts = receipts };
    }
}
