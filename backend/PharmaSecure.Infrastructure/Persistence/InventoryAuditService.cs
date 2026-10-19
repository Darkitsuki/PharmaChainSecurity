using System.Data;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Inventory.Audits;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class InventoryAuditService : IInventoryAuditService
{
    private readonly IUnitOfWork unitOfWork;
    private readonly IBranchContextAccessor branchContextAccessor;

    public InventoryAuditService(IUnitOfWork unitOfWork, IBranchContextAccessor branchContextAccessor)
    {
        this.unitOfWork = unitOfWork;
        this.branchContextAccessor = branchContextAccessor;
    }

    public async Task<IReadOnlyList<InventoryAuditResponse>> GetByBranchAsync(string branchId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            return Array.Empty<InventoryAuditResponse>();

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var list = new List<InventoryAuditResponse>();
            await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
            command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            command.BindByName = true;
            command.CommandText = """
                SELECT a.id, a.AuditNo, a.BranchId,
                       a.CreatedBy, u1.FullName AS CreatorName,
                       a.ApprovedBy, u2.FullName AS ApproverName,
                       a.AuditDate, a.ApprovedDate, a.Status,
                       a.TotalItemsCount, a.MatchedCount, a.DiscrepancyCount,
                       a.TotalDiscrepancyValue, a.Notes, a.CreatedDate
                FROM INVENTORY_AUDITS a
                JOIN USERS u1 ON a.CreatedBy = u1.id
                LEFT JOIN USERS u2 ON a.ApprovedBy = u2.id
                WHERE a.BranchId = :BranchId
                ORDER BY a.AuditDate DESC
                """;
            command.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(new InventoryAuditResponse(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.GetString(3),
                    reader.GetString(4),
                    reader.IsDBNull(5) ? null : reader.GetString(5),
                    reader.IsDBNull(6) ? null : reader.GetString(6),
                    reader.GetDateTime(7),
                    reader.IsDBNull(8) ? null : reader.GetDateTime(8),
                    reader.GetString(9),
                    reader.GetInt32(10),
                    reader.GetInt32(11),
                    reader.GetInt32(12),
                    reader.GetDecimal(13),
                    reader.IsDBNull(14) ? null : reader.GetString(14),
                    reader.GetDateTime(15)));
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return list;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<InventoryAuditDetailResponse?> GetByIdAsync(string id, string branchId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(branchId))
            return null;

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            InventoryAuditDetailResponse? audit = null;
            await using (var command = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                command.BindByName = true;
                command.CommandText = """
                    SELECT a.id, a.AuditNo, a.BranchId,
                           a.CreatedBy, u1.FullName AS CreatorName,
                           a.ApprovedBy, u2.FullName AS ApproverName,
                           a.AuditDate, a.ApprovedDate, a.Status,
                           a.TotalItemsCount, a.MatchedCount, a.DiscrepancyCount,
                           a.TotalDiscrepancyValue, a.Notes, a.CreatedDate
                    FROM INVENTORY_AUDITS a
                    JOIN USERS u1 ON a.CreatedBy = u1.id
                    LEFT JOIN USERS u2 ON a.ApprovedBy = u2.id
                    WHERE a.id = :id AND a.BranchId = :BranchId
                    """;
                command.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, id, ParameterDirection.Input));
                command.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));

                await using var reader = await command.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    audit = new InventoryAuditDetailResponse(
                        reader.GetString(0),
                        reader.GetString(1),
                        reader.GetString(2),
                        reader.GetString(3),
                        reader.GetString(4),
                        reader.IsDBNull(5) ? null : reader.GetString(5),
                        reader.IsDBNull(6) ? null : reader.GetString(6),
                        reader.GetDateTime(7),
                        reader.IsDBNull(8) ? null : reader.GetDateTime(8),
                        reader.GetString(9),
                        reader.GetInt32(10),
                        reader.GetInt32(11),
                        reader.GetInt32(12),
                        reader.GetDecimal(13),
                        reader.IsDBNull(14) ? null : reader.GetString(14),
                        reader.GetDateTime(15),
                        new List<InventoryAuditItemDto>());
                }
            }

            if (audit is null)
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return null;
            }

            var items = new List<InventoryAuditItemDto>();
            await using (var itemCommand = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                itemCommand.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                itemCommand.BindByName = true;
                itemCommand.CommandText = """
                    SELECT ai.DrugId, d.DrugCode, d.Name, d.ActiveIngredient, d.Unit,
                           ai.BatchId, b.BatchNumber, b.ExpiryDate,
                           ai.SystemQuantity, ai.ActualQuantity, ai.DiscrepancyQuantity,
                           ai.UnitPrice, ai.DiscrepancyValue, ai.Reason
                    FROM INVENTORY_AUDIT_ITEMS ai
                    JOIN DRUGS d ON ai.DrugId = d.id
                    JOIN DRUG_BATCHES b ON ai.BatchId = b.id
                    WHERE ai.AuditId = :AuditId
                    ORDER BY d.Name, b.BatchNumber
                    """;
                itemCommand.Parameters.Add(new OracleParameter("AuditId", OracleDbType.Varchar2, audit.Id, ParameterDirection.Input));

                await using var reader = await itemCommand.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    items.Add(new InventoryAuditItemDto(
                        reader.GetString(0),
                        reader.GetString(1),
                        reader.GetString(2),
                        reader.IsDBNull(3) ? null : reader.GetString(3),
                        reader.IsDBNull(4) ? null : reader.GetString(4),
                        reader.GetString(5),
                        reader.GetString(6),
                        reader.GetDateTime(7),
                        reader.GetInt32(8),
                        reader.GetInt32(9),
                        reader.GetInt32(10),
                        reader.GetDecimal(11),
                        reader.GetDecimal(12),
                        reader.IsDBNull(13) ? null : reader.GetString(13)));
                }
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return audit with { Items = items };
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<InventoryAuditDetailResponse> CreateAuditAsync(
        CreateInventoryAuditRequest request,
        string branchId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var auditId = $"aud-{Guid.NewGuid():N}";
        var auditNo = $"KK{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..24];
        var now = DateTime.UtcNow;

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            // 1. Tạo phiếu đợt kiểm kê
            await using (var insertCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                insertCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                insertCmd.BindByName = true;
                insertCmd.CommandText = """
                    INSERT INTO INVENTORY_AUDITS (id, AuditNo, BranchId, CreatedBy, AuditDate, Status, Notes, CreatedDate)
                    VALUES (:id, :AuditNo, :BranchId, :CreatedBy, :AuditDate, 'IN_PROGRESS', :Notes, :CreatedDate)
                    """;
                insertCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, auditId, ParameterDirection.Input));
                insertCmd.Parameters.Add(new OracleParameter("AuditNo", OracleDbType.Varchar2, auditNo, ParameterDirection.Input));
                insertCmd.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));
                insertCmd.Parameters.Add(new OracleParameter("CreatedBy", OracleDbType.Varchar2, userId, ParameterDirection.Input));
                insertCmd.Parameters.Add(new OracleParameter("AuditDate", OracleDbType.TimeStamp, now, ParameterDirection.Input));
                insertCmd.Parameters.Add(new OracleParameter("Notes", OracleDbType.Varchar2, (object?)request.Notes?.Trim() ?? DBNull.Value, ParameterDirection.Input));
                insertCmd.Parameters.Add(new OracleParameter("CreatedDate", OracleDbType.TimeStamp, now, ParameterDirection.Input));

                await insertCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // 2. Snapshot toàn bộ các mặt hàng đang có trong tồn kho chi nhánh
            var items = new List<InventoryAuditItemDto>();
            await using (var snapshotCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                snapshotCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                snapshotCmd.BindByName = true;
                snapshotCmd.CommandText = """
                    SELECT inv.DrugId, d.DrugCode, d.Name, d.ActiveIngredient, d.Unit,
                           inv.BatchId, b.BatchNumber, b.ExpiryDate, inv.Quantity, d.Price
                    FROM INVENTORIES inv
                    JOIN DRUGS d ON inv.DrugId = d.id
                    JOIN DRUG_BATCHES b ON inv.BatchId = b.id
                    WHERE inv.BranchId = :BranchId AND d.IsActive = 1
                    ORDER BY d.Name, b.BatchNumber
                    """;
                snapshotCmd.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));

                await using var reader = await snapshotCmd.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    items.Add(new InventoryAuditItemDto(
                        reader.GetString(0),
                        reader.GetString(1),
                        reader.GetString(2),
                        reader.IsDBNull(3) ? null : reader.GetString(3),
                        reader.IsDBNull(4) ? null : reader.GetString(4),
                        reader.GetString(5),
                        reader.GetString(6),
                        reader.GetDateTime(7),
                        reader.GetInt32(8),
                        reader.GetInt32(8), // Actual khởi tạo = SystemQuantity
                        0,                  // Lệch = 0
                        reader.GetDecimal(9),
                        0m,
                        null));
                }
            }

            // 3. Chèn vào bảng INVENTORY_AUDIT_ITEMS
            foreach (var item in items)
            {
                await using var itemCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
                itemCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                itemCmd.BindByName = true;
                itemCmd.CommandText = """
                    INSERT INTO INVENTORY_AUDIT_ITEMS (AuditId, DrugId, BatchId, SystemQuantity, ActualQuantity, DiscrepancyQuantity, UnitPrice, DiscrepancyValue)
                    VALUES (:AuditId, :DrugId, :BatchId, :SystemQuantity, :ActualQuantity, 0, :UnitPrice, 0)
                    """;
                itemCmd.Parameters.Add(new OracleParameter("AuditId", OracleDbType.Varchar2, auditId, ParameterDirection.Input));
                itemCmd.Parameters.Add(new OracleParameter("DrugId", OracleDbType.Varchar2, item.DrugId, ParameterDirection.Input));
                itemCmd.Parameters.Add(new OracleParameter("BatchId", OracleDbType.Varchar2, item.BatchId, ParameterDirection.Input));
                itemCmd.Parameters.Add(new OracleParameter("SystemQuantity", OracleDbType.Int32, item.SystemQuantity, ParameterDirection.Input));
                itemCmd.Parameters.Add(new OracleParameter("ActualQuantity", OracleDbType.Int32, item.ActualQuantity, ParameterDirection.Input));
                itemCmd.Parameters.Add(new OracleParameter("UnitPrice", OracleDbType.Decimal, item.UnitPrice, ParameterDirection.Input));

                await itemCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // 4. Cập nhật đếm tổng
            await using (var updateCountsCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                updateCountsCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                updateCountsCmd.BindByName = true;
                updateCountsCmd.CommandText = """
                    UPDATE INVENTORY_AUDITS
                    SET TotalItemsCount = :Count, MatchedCount = :Count, DiscrepancyCount = 0, TotalDiscrepancyValue = 0
                    WHERE id = :id
                    """;
                updateCountsCmd.Parameters.Add(new OracleParameter("Count", OracleDbType.Int32, items.Count, ParameterDirection.Input));
                updateCountsCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, auditId, ParameterDirection.Input));

                await updateCountsCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            await unitOfWork.CommitAsync(cancellationToken);

            return new InventoryAuditDetailResponse(
                auditId,
                auditNo,
                branchId,
                userId,
                "Nhân viên",
                null,
                null,
                now,
                null,
                "IN_PROGRESS",
                items.Count,
                items.Count,
                0,
                0m,
                request.Notes?.Trim(),
                now,
                items);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<InventoryAuditDetailResponse> UpdateCountedItemsAsync(
        string id,
        UpdateAuditItemsRequest request,
        string branchId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.Items is null || request.Items.Count == 0)
            throw new ArgumentException("Danh sách mặt hàng kiểm đếm không được rỗng.", nameof(request));

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            // Kiểm tra trạng thái đợt kiểm
            await using (var checkCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                checkCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                checkCmd.BindByName = true;
                checkCmd.CommandText = "SELECT Status FROM INVENTORY_AUDITS WHERE id = :id AND BranchId = :BranchId";
                checkCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, id, ParameterDirection.Input));
                checkCmd.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));

                var status = (string?)await checkCmd.ExecuteScalarAsync(cancellationToken);
                if (status is null)
                    throw new InvalidOperationException("Không tìm thấy đợt kiểm kê.");
                if (!string.Equals(status, "IN_PROGRESS", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("Chỉ có thể cập nhật đợt kiểm kê đang diễn ra (IN_PROGRESS).");
            }

            // Cập nhật từng dòng kiểm đếm
            foreach (var item in request.Items)
            {
                if (item.ActualQuantity < 0)
                    throw new ArgumentException("Số lượng thực đếm không được âm.");

                await using var updateItemCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
                updateItemCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                updateItemCmd.BindByName = true;
                updateItemCmd.CommandText = """
                    UPDATE INVENTORY_AUDIT_ITEMS
                    SET ActualQuantity = :ActualQty,
                        DiscrepancyQuantity = :ActualQty - SystemQuantity,
                        DiscrepancyValue = (:ActualQty - SystemQuantity) * UnitPrice,
                        Reason = :Reason
                    WHERE AuditId = :AuditId AND DrugId = :DrugId AND BatchId = :BatchId
                    """;
                updateItemCmd.Parameters.Add(new OracleParameter("ActualQty", OracleDbType.Int32, item.ActualQuantity, ParameterDirection.Input));
                updateItemCmd.Parameters.Add(new OracleParameter("Reason", OracleDbType.Varchar2, (object?)item.Reason?.Trim() ?? DBNull.Value, ParameterDirection.Input));
                updateItemCmd.Parameters.Add(new OracleParameter("AuditId", OracleDbType.Varchar2, id, ParameterDirection.Input));
                updateItemCmd.Parameters.Add(new OracleParameter("DrugId", OracleDbType.Varchar2, item.DrugId, ParameterDirection.Input));
                updateItemCmd.Parameters.Add(new OracleParameter("BatchId", OracleDbType.Varchar2, item.BatchId, ParameterDirection.Input));

                await updateItemCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // Tính toán lại thống kê tổng thể
            await using (var calcCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                calcCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                calcCmd.BindByName = true;
                calcCmd.CommandText = """
                    UPDATE INVENTORY_AUDITS
                    SET MatchedCount = (SELECT COUNT(*) FROM INVENTORY_AUDIT_ITEMS WHERE AuditId = :id AND DiscrepancyQuantity = 0),
                        DiscrepancyCount = (SELECT COUNT(*) FROM INVENTORY_AUDIT_ITEMS WHERE AuditId = :id AND DiscrepancyQuantity <> 0),
                        TotalDiscrepancyValue = (SELECT NVL(SUM(DiscrepancyValue), 0) FROM INVENTORY_AUDIT_ITEMS WHERE AuditId = :id)
                    WHERE id = :id
                    """;
                calcCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, id, ParameterDirection.Input));

                await calcCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            await unitOfWork.CommitAsync(cancellationToken);

            // Trả về bản ghi chi tiết mới nhất
            var detail = await GetByIdAsync(id, branchId, cancellationToken);
            return detail ?? throw new InvalidOperationException("Không thể tải thông tin sau cập nhật.");
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<InventoryAuditDetailResponse> ReconcileAsync(
        string id,
        string branchId,
        string ownerId,
        ReconcileAuditRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var now = DateTime.UtcNow;

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            string auditNo;
            // 1. Kiểm tra trạng thái
            await using (var checkCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                checkCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                checkCmd.BindByName = true;
                checkCmd.CommandText = "SELECT AuditNo, Status FROM INVENTORY_AUDITS WHERE id = :id AND BranchId = :BranchId";
                checkCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, id, ParameterDirection.Input));
                checkCmd.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));

                await using var reader = await checkCmd.ExecuteReaderAsync(cancellationToken);
                if (!await reader.ReadAsync(cancellationToken))
                    throw new InvalidOperationException("Không tìm thấy đợt kiểm kê.");

                auditNo = reader.GetString(0);
                var status = reader.GetString(1);
                if (!string.Equals(status, "IN_PROGRESS", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("Đợt kiểm kê này đã được cân đối hoặc bị hủy.");
            }

            // 2. Lấy danh sách các mặt hàng có chênh lệch
            var discrepancies = new List<(string DrugId, string BatchId, int ActualQty, int Diff)>();
            await using (var diffCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                diffCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                diffCmd.BindByName = true;
                diffCmd.CommandText = """
                    SELECT DrugId, BatchId, ActualQuantity, DiscrepancyQuantity
                    FROM INVENTORY_AUDIT_ITEMS
                    WHERE AuditId = :AuditId AND DiscrepancyQuantity <> 0
                    """;
                diffCmd.Parameters.Add(new OracleParameter("AuditId", OracleDbType.Varchar2, id, ParameterDirection.Input));

                await using var reader = await diffCmd.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    discrepancies.Add((
                        reader.GetString(0),
                        reader.GetString(1),
                        reader.GetInt32(2),
                        reader.GetInt32(3)));
                }
            }

            // 3. Cân đối tồn kho và sinh nhật ký biến động kho (INVENTORY_TRANSACTIONS)
            foreach (var (drugId, batchId, actualQty, diff) in discrepancies)
            {
                // Cập nhật tồn kho thực tế
                await using (var updateInvCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
                {
                    updateInvCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                    updateInvCmd.BindByName = true;
                    updateInvCmd.CommandText = """
                        UPDATE INVENTORIES
                        SET Quantity = :Quantity
                        WHERE BranchId = :BranchId AND DrugId = :DrugId AND BatchId = :BatchId
                        """;
                    updateInvCmd.Parameters.Add(new OracleParameter("Quantity", OracleDbType.Int32, actualQty, ParameterDirection.Input));
                    updateInvCmd.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));
                    updateInvCmd.Parameters.Add(new OracleParameter("DrugId", OracleDbType.Varchar2, drugId, ParameterDirection.Input));
                    updateInvCmd.Parameters.Add(new OracleParameter("BatchId", OracleDbType.Varchar2, batchId, ParameterDirection.Input));

                    await updateInvCmd.ExecuteNonQueryAsync(cancellationToken);
                }

                // Ghi nhận biến động kho loại DIEU_CHINH
                await using (var insertTxCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
                {
                    insertTxCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                    insertTxCmd.BindByName = true;
                    insertTxCmd.CommandText = """
                        INSERT INTO INVENTORY_TRANSACTIONS (id, BranchId, DrugId, BatchId, TransactionType, QuantityChange, BalanceAfter, ReferenceId, Note, CreatedDate)
                        VALUES (:id, :BranchId, :DrugId, :BatchId, 'DIEU_CHINH', :QuantityChange, :BalanceAfter, :ReferenceId, :Note, :CreatedDate)
                        """;
                    insertTxCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, $"tx-{Guid.NewGuid():N}", ParameterDirection.Input));
                    insertTxCmd.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));
                    insertTxCmd.Parameters.Add(new OracleParameter("DrugId", OracleDbType.Varchar2, drugId, ParameterDirection.Input));
                    insertTxCmd.Parameters.Add(new OracleParameter("BatchId", OracleDbType.Varchar2, batchId, ParameterDirection.Input));
                    insertTxCmd.Parameters.Add(new OracleParameter("QuantityChange", OracleDbType.Int32, diff, ParameterDirection.Input));
                    insertTxCmd.Parameters.Add(new OracleParameter("BalanceAfter", OracleDbType.Int32, actualQty, ParameterDirection.Input));
                    insertTxCmd.Parameters.Add(new OracleParameter("ReferenceId", OracleDbType.Varchar2, id, ParameterDirection.Input));
                    insertTxCmd.Parameters.Add(new OracleParameter("Note", OracleDbType.Varchar2, $"Cân đối kho theo phiếu kiểm kê {auditNo}", ParameterDirection.Input));
                    insertTxCmd.Parameters.Add(new OracleParameter("CreatedDate", OracleDbType.TimeStamp, now, ParameterDirection.Input));

                    await insertTxCmd.ExecuteNonQueryAsync(cancellationToken);
                }
            }

            // 4. Đổi trạng thái phiếu kiểm kê sang COMPLETED và lưu người phê duyệt
            await using (var completeCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                completeCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                completeCmd.BindByName = true;
                completeCmd.CommandText = """
                    UPDATE INVENTORY_AUDITS
                    SET Status = 'COMPLETED',
                        ApprovedBy = :ApprovedBy,
                        ApprovedDate = :ApprovedDate,
                        Notes = CASE WHEN :Notes IS NOT NULL THEN :Notes ELSE Notes END
                    WHERE id = :id AND BranchId = :BranchId
                    """;
                completeCmd.Parameters.Add(new OracleParameter("ApprovedBy", OracleDbType.Varchar2, ownerId, ParameterDirection.Input));
                completeCmd.Parameters.Add(new OracleParameter("ApprovedDate", OracleDbType.TimeStamp, now, ParameterDirection.Input));
                completeCmd.Parameters.Add(new OracleParameter("Notes", OracleDbType.Varchar2, (object?)request.Notes?.Trim() ?? DBNull.Value, ParameterDirection.Input));
                completeCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, id, ParameterDirection.Input));
                completeCmd.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));

                await completeCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            await unitOfWork.CommitAsync(cancellationToken);

            var result = await GetByIdAsync(id, branchId, cancellationToken);
            return result ?? throw new InvalidOperationException("Không thể tải thông tin phiếu sau khi cân đối.");
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task CancelAuditAsync(string id, string branchId, string userId, CancellationToken cancellationToken = default)
    {
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            await using var cmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
            cmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            cmd.BindByName = true;
            cmd.CommandText = """
                UPDATE INVENTORY_AUDITS
                SET Status = 'CANCELLED'
                WHERE id = :id AND BranchId = :BranchId AND Status = 'IN_PROGRESS'
                """;
            cmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, id, ParameterDirection.Input));
            cmd.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));

            var affected = await cmd.ExecuteNonQueryAsync(cancellationToken);
            if (affected == 0)
                throw new InvalidOperationException("Không tìm thấy đợt kiểm kê hoặc đợt đã đóng.");

            await unitOfWork.CommitAsync(cancellationToken);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
