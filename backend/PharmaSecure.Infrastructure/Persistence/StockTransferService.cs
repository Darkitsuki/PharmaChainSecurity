using System.Data;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Inventory.Transfers;
using PharmaSecure.Infrastructure.Security;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class StockTransferService : IStockTransferService
{
    private readonly IOracleConnectionFactory connectionFactory;
    private readonly ILogger<StockTransferService> logger;

    public StockTransferService(
        IOracleConnectionFactory connectionFactory,
        ILogger<StockTransferService> logger)
    {
        this.connectionFactory = connectionFactory;
        this.logger = logger;
    }

    public async Task<IReadOnlyList<StockTransferResponse>> GetTransfersAsync(string branchId, string? direction = null, CancellationToken cancellationToken = default)
    {
        await using var connection = await connectionFactory.CreateOpenConnectionAsync(branchId, cancellationToken);
        await using var sessionContextScope = new OracleSessionContextScope(connectionFactory, connection);

        var query = @"
            SELECT t.id, t.TransferNo, t.FromBranchId, fb.BranchName AS FromBranchName,
                   t.ToBranchId, tb.BranchName AS ToBranchName,
                   t.CreatedBy, uc.FullName AS CreatedByName,
                   t.ShippedBy, us.FullName AS ShippedByName,
                   t.ReceivedBy, ur.FullName AS ReceivedByName,
                   t.Status, t.TotalItemsCount, t.TotalQuantity,
                   t.ShippedDate, t.ReceivedDate, t.Notes, t.CreatedDate
            FROM STOCK_TRANSFERS t
            INNER JOIN BRANCHES fb ON t.FromBranchId = fb.id
            INNER JOIN BRANCHES tb ON t.ToBranchId = tb.id
            INNER JOIN USERS uc ON t.CreatedBy = uc.id
            LEFT JOIN USERS us ON t.ShippedBy = us.id
            LEFT JOIN USERS ur ON t.ReceivedBy = ur.id
            WHERE (t.FromBranchId = :branchId OR t.ToBranchId = :branchId)";

        if (string.Equals(direction, "OUTGOING", StringComparison.OrdinalIgnoreCase))
        {
            query += " AND t.FromBranchId = :branchId";
        }
        else if (string.Equals(direction, "INCOMING", StringComparison.OrdinalIgnoreCase))
        {
            query += " AND t.ToBranchId = :branchId";
        }

        query += " ORDER BY t.CreatedDate DESC";

        using var cmd = connection.CreateCommand();
        cmd.CommandText = query;
        cmd.Parameters.Add(new OracleParameter("branchId", branchId));

        var results = new List<StockTransferResponse>();
        using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(MapTransferResponse(reader));
        }

        return results;
    }

    public async Task<StockTransferDetailResponse?> GetByIdAsync(string id, string branchId, CancellationToken cancellationToken = default)
    {
        await using var connection = await connectionFactory.CreateOpenConnectionAsync(branchId, cancellationToken);
        await using var sessionContextScope = new OracleSessionContextScope(connectionFactory, connection);

        const string queryHeader = @"
            SELECT t.id, t.TransferNo, t.FromBranchId, fb.BranchName AS FromBranchName,
                   t.ToBranchId, tb.BranchName AS ToBranchName,
                   t.CreatedBy, uc.FullName AS CreatedByName,
                   t.ShippedBy, us.FullName AS ShippedByName,
                   t.ReceivedBy, ur.FullName AS ReceivedByName,
                   t.Status, t.TotalItemsCount, t.TotalQuantity,
                   t.ShippedDate, t.ReceivedDate, t.Notes, t.CreatedDate
            FROM STOCK_TRANSFERS t
            INNER JOIN BRANCHES fb ON t.FromBranchId = fb.id
            INNER JOIN BRANCHES tb ON t.ToBranchId = tb.id
            INNER JOIN USERS uc ON t.CreatedBy = uc.id
            LEFT JOIN USERS us ON t.ShippedBy = us.id
            LEFT JOIN USERS ur ON t.ReceivedBy = ur.id
            WHERE t.id = :id AND (t.FromBranchId = :branchId OR t.ToBranchId = :branchId)";

        using var cmd = connection.CreateCommand();
        cmd.CommandText = queryHeader;
        cmd.Parameters.Add(new OracleParameter("id", id));
        cmd.Parameters.Add(new OracleParameter("branchId", branchId));

        StockTransferResponse? header = null;
        using (var reader = await cmd.ExecuteReaderAsync(cancellationToken))
        {
            if (await reader.ReadAsync(cancellationToken))
            {
                header = MapTransferResponse(reader);
            }
        }

        if (header is null) return null;

        // Fetch Items
        const string queryItems = @"
            SELECT i.DrugId, d.DrugCode, d.DrugName, d.Unit,
                   i.BatchId, b.BatchNumber, b.ExpiryDate,
                   i.Quantity, i.Notes
            FROM STOCK_TRANSFER_ITEMS i
            INNER JOIN DRUGS d ON i.DrugId = d.id
            INNER JOIN DRUG_BATCHES b ON i.BatchId = b.id
            WHERE i.TransferId = :transferId
            ORDER BY d.DrugName ASC";

        using var cmdItems = connection.CreateCommand();
        cmdItems.CommandText = queryItems;
        cmdItems.Parameters.Add(new OracleParameter("transferId", id));

        var items = new List<StockTransferItemDto>();
        using (var reader = await cmdItems.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(new StockTransferItemDto(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.GetString(3),
                    reader.GetString(4),
                    reader.GetString(5),
                    reader.GetDateTime(6),
                    Convert.ToInt32(reader.GetValue(7)),
                    reader.IsDBNull(8) ? null : reader.GetString(8)
                ));
            }
        }

        return new StockTransferDetailResponse(
            header.Id, header.TransferNo, header.FromBranchId, header.FromBranchName,
            header.ToBranchId, header.ToBranchName, header.CreatedById, header.CreatedByName,
            header.ShippedById, header.ShippedByName, header.ReceivedById, header.ReceivedByName,
            header.Status, header.TotalItemsCount, header.TotalQuantity,
            header.ShippedDate, header.ReceivedDate, header.Notes, header.CreatedDate,
            items
        );
    }

    public async Task<StockTransferDetailResponse> CreateTransferAsync(CreateStockTransferRequest request, string fromBranchId, string userId, CancellationToken cancellationToken = default)
    {
        if (string.Equals(fromBranchId, request.ToBranchId, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Chi nhánh gửi và chi nhánh nhận không được trùng nhau.");

        if (request.Items is null || request.Items.Count == 0)
            throw new InvalidOperationException("Danh sách mặt hàng điều chuyển không được rỗng.");

        await using var connection = await connectionFactory.CreateOpenConnectionAsync(fromBranchId, cancellationToken);
        await using var sessionContextScope = new OracleSessionContextScope(connectionFactory, connection);
        using var tx = connection.BeginTransaction();

        try
        {
            var transferId = $"st-{Guid.NewGuid():N}";
            var transferNo = $"DC{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
            var totalItems = request.Items.Count;
            var totalQuantity = request.Items.Sum(i => i.Quantity);

            const string insertTransferSql = @"
                INSERT INTO STOCK_TRANSFERS (
                    id, TransferNo, FromBranchId, ToBranchId, CreatedBy,
                    Status, TotalItemsCount, TotalQuantity, Notes, CreatedDate
                ) VALUES (
                    :id, :transferNo, :fromBranchId, :toBranchId, :createdBy,
                    'PENDING', :totalItems, :totalQuantity, :notes, CURRENT_TIMESTAMP
                )";

            using var cmd = connection.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = insertTransferSql;
            cmd.Parameters.Add(new OracleParameter("id", transferId));
            cmd.Parameters.Add(new OracleParameter("transferNo", transferNo));
            cmd.Parameters.Add(new OracleParameter("fromBranchId", fromBranchId));
            cmd.Parameters.Add(new OracleParameter("toBranchId", request.ToBranchId));
            cmd.Parameters.Add(new OracleParameter("createdBy", userId));
            cmd.Parameters.Add(new OracleParameter("totalItems", totalItems));
            cmd.Parameters.Add(new OracleParameter("totalQuantity", totalQuantity));
            cmd.Parameters.Add(new OracleParameter("notes", (object?)request.Notes ?? DBNull.Value));
            await cmd.ExecuteNonQueryAsync(cancellationToken);

            const string insertItemSql = @"
                INSERT INTO STOCK_TRANSFER_ITEMS (
                    TransferId, DrugId, BatchId, Quantity, Notes
                ) VALUES (
                    :transferId, :drugId, :batchId, :quantity, :notes
                )";

            foreach (var item in request.Items)
            {
                if (item.Quantity <= 0)
                    throw new InvalidOperationException("Số lượng điều chuyển phải lớn hơn 0.");

                // Validate stock availability in fromBranch
                const string checkStockSql = @"
                    SELECT Quantity FROM INVENTORIES
                    WHERE BranchId = :fromBranchId AND DrugId = :drugId AND BatchId = :batchId";

                using var checkCmd = connection.CreateCommand();
                checkCmd.Transaction = tx;
                checkCmd.CommandText = checkStockSql;
                checkCmd.Parameters.Add(new OracleParameter("fromBranchId", fromBranchId));
                checkCmd.Parameters.Add(new OracleParameter("drugId", item.DrugId));
                checkCmd.Parameters.Add(new OracleParameter("batchId", item.BatchId));

                var currentStockObj = await checkCmd.ExecuteScalarAsync(cancellationToken);
                if (currentStockObj is null)
                    throw new InvalidOperationException($"Lô thuốc {item.BatchId} không tồn tại trong kho chi nhánh gửi.");

                var currentStock = Convert.ToInt32(currentStockObj);
                if (currentStock < item.Quantity)
                    throw new InvalidOperationException($"Tồn kho chi nhánh gửi không đủ (hiện có: {currentStock}, yêu cầu chuyển: {item.Quantity}).");

                using var itemCmd = connection.CreateCommand();
                itemCmd.Transaction = tx;
                itemCmd.CommandText = insertItemSql;
                itemCmd.Parameters.Add(new OracleParameter("transferId", transferId));
                itemCmd.Parameters.Add(new OracleParameter("drugId", item.DrugId));
                itemCmd.Parameters.Add(new OracleParameter("batchId", item.BatchId));
                itemCmd.Parameters.Add(new OracleParameter("quantity", item.Quantity));
                itemCmd.Parameters.Add(new OracleParameter("notes", (object?)item.Notes ?? DBNull.Value));
                await itemCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            tx.Commit();
            logger.LogInformation("Stock transfer created successfully: {TransferNo} ({TransferId})", transferNo, transferId);

            return (await GetByIdAsync(transferId, fromBranchId, cancellationToken))!;
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task<StockTransferDetailResponse> ShipTransferAsync(string id, string branchId, string userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await connectionFactory.CreateOpenConnectionAsync(branchId, cancellationToken);
        await using var sessionContextScope = new OracleSessionContextScope(connectionFactory, connection);
        using var tx = connection.BeginTransaction();

        try
        {
            // Lock and verify transfer
            const string selectSql = @"
                SELECT FromBranchId, Status FROM STOCK_TRANSFERS
                WHERE id = :id FOR UPDATE";

            using var cmd = connection.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = selectSql;
            cmd.Parameters.Add(new OracleParameter("id", id));

            string fromBranchId;
            string status;
            using (var reader = await cmd.ExecuteReaderAsync(cancellationToken))
            {
                if (!await reader.ReadAsync(cancellationToken))
                    throw new InvalidOperationException("Phiếu điều chuyển không tồn tại.");

                fromBranchId = reader.GetString(0);
                status = reader.GetString(1);
            }

            if (!string.Equals(fromBranchId, branchId, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Chỉ chi nhánh gửi mới có quyền xác nhận xuất kho điều chuyển.");

            if (!string.Equals(status, "PENDING", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Phiếu điều chuyển đang ở trạng thái '{status}', không thể xuất kho.");

            // Fetch items
            const string itemsSql = @"
                SELECT DrugId, BatchId, Quantity FROM STOCK_TRANSFER_ITEMS
                WHERE TransferId = :transferId";

            using var itemsCmd = connection.CreateCommand();
            itemsCmd.Transaction = tx;
            itemsCmd.CommandText = itemsSql;
            itemsCmd.Parameters.Add(new OracleParameter("transferId", id));

            var transferItems = new List<(string DrugId, string BatchId, int Quantity)>();
            using (var reader = await itemsCmd.ExecuteReaderAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    transferItems.Add((reader.GetString(0), reader.GetString(1), Convert.ToInt32(reader.GetValue(2))));
                }
            }

            // Deduct inventory and record transaction
            foreach (var item in transferItems)
            {
                const string lockInvSql = @"
                    SELECT id, Quantity FROM INVENTORIES
                    WHERE BranchId = :fromBranchId AND DrugId = :drugId AND BatchId = :batchId FOR UPDATE";

                using var lockCmd = connection.CreateCommand();
                lockCmd.Transaction = tx;
                lockCmd.CommandText = lockInvSql;
                lockCmd.Parameters.Add(new OracleParameter("fromBranchId", fromBranchId));
                lockCmd.Parameters.Add(new OracleParameter("drugId", item.DrugId));
                lockCmd.Parameters.Add(new OracleParameter("batchId", item.BatchId));

                string invId;
                int currentQty;
                using (var reader = await lockCmd.ExecuteReaderAsync(cancellationToken))
                {
                    if (!await reader.ReadAsync(cancellationToken))
                        throw new InvalidOperationException("Không tìm thấy dữ liệu tồn kho của lô thuốc cần chuyển.");

                    invId = reader.GetString(0);
                    currentQty = Convert.ToInt32(reader.GetValue(1));
                }

                if (currentQty < item.Quantity)
                    throw new InvalidOperationException($"Tồn kho chi nhánh gửi không đủ (hiện có: {currentQty}, cần xuất: {item.Quantity}).");

                const string deductSql = @"
                    UPDATE INVENTORIES
                    SET Quantity = Quantity - :deductQty, UpdatedDate = CURRENT_TIMESTAMP
                    WHERE id = :invId";

                using var deductCmd = connection.CreateCommand();
                deductCmd.Transaction = tx;
                deductCmd.CommandText = deductSql;
                deductCmd.Parameters.Add(new OracleParameter("deductQty", item.Quantity));
                deductCmd.Parameters.Add(new OracleParameter("invId", invId));
                await deductCmd.ExecuteNonQueryAsync(cancellationToken);

                // Add INVENTORY_TRANSACTION
                const string txLogSql = @"
                    INSERT INTO INVENTORY_TRANSACTIONS (
                        id, BranchId, DrugId, BatchId, TransactionType,
                        Quantity, BalanceAfter, ReferenceType, ReferenceId, Notes, CreatedDate
                    ) VALUES (
                        :id, :branchId, :drugId, :batchId, 'XUAT_DIEU_CHUYEN',
                        :quantity, :balanceAfter, 'STOCK_TRANSFER', :refId, 'Xuất kho chuyển hàng chi nhánh', CURRENT_TIMESTAMP
                    )";

                using var txCmd = connection.CreateCommand();
                txCmd.Transaction = tx;
                txCmd.CommandText = txLogSql;
                txCmd.Parameters.Add(new OracleParameter("id", $"tx-{Guid.NewGuid():N}"));
                txCmd.Parameters.Add(new OracleParameter("branchId", fromBranchId));
                txCmd.Parameters.Add(new OracleParameter("drugId", item.DrugId));
                txCmd.Parameters.Add(new OracleParameter("batchId", item.BatchId));
                txCmd.Parameters.Add(new OracleParameter("quantity", item.Quantity));
                txCmd.Parameters.Add(new OracleParameter("balanceAfter", currentQty - item.Quantity));
                txCmd.Parameters.Add(new OracleParameter("refId", id));
                await txCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // Update Transfer status to IN_TRANSIT
            const string updateTransferSql = @"
                UPDATE STOCK_TRANSFERS
                SET Status = 'IN_TRANSIT', ShippedBy = :shippedBy, ShippedDate = CURRENT_TIMESTAMP
                WHERE id = :id";

            using var updateCmd = connection.CreateCommand();
            updateCmd.Transaction = tx;
            updateCmd.CommandText = updateTransferSql;
            updateCmd.Parameters.Add(new OracleParameter("shippedBy", userId));
            updateCmd.Parameters.Add(new OracleParameter("id", id));
            await updateCmd.ExecuteNonQueryAsync(cancellationToken);

            tx.Commit();
            logger.LogInformation("Stock transfer {TransferId} dispatched by user {UserId}", id, userId);

            return (await GetByIdAsync(id, branchId, cancellationToken))!;
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task<StockTransferDetailResponse> ReceiveTransferAsync(string id, string branchId, string userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await connectionFactory.CreateOpenConnectionAsync(branchId, cancellationToken);
        await using var sessionContextScope = new OracleSessionContextScope(connectionFactory, connection);
        using var tx = connection.BeginTransaction();

        try
        {
            // Lock and verify transfer
            const string selectSql = @"
                SELECT ToBranchId, Status FROM STOCK_TRANSFERS
                WHERE id = :id FOR UPDATE";

            using var cmd = connection.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = selectSql;
            cmd.Parameters.Add(new OracleParameter("id", id));

            string toBranchId;
            string status;
            using (var reader = await cmd.ExecuteReaderAsync(cancellationToken))
            {
                if (!await reader.ReadAsync(cancellationToken))
                    throw new InvalidOperationException("Phiếu điều chuyển không tồn tại.");

                toBranchId = reader.GetString(0);
                status = reader.GetString(1);
            }

            if (!string.Equals(toBranchId, branchId, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Chỉ chi nhánh nhận mới có quyền xác nhận tiếp nhận hàng chuyển đến.");

            if (!string.Equals(status, "IN_TRANSIT", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Phiếu điều chuyển đang ở trạng thái '{status}', chỉ có thể nhận hàng khi đang trên đường chuyển ('IN_TRANSIT').");

            // Fetch items
            const string itemsSql = @"
                SELECT DrugId, BatchId, Quantity FROM STOCK_TRANSFER_ITEMS
                WHERE TransferId = :transferId";

            using var itemsCmd = connection.CreateCommand();
            itemsCmd.Transaction = tx;
            itemsCmd.CommandText = itemsSql;
            itemsCmd.Parameters.Add(new OracleParameter("transferId", id));

            var transferItems = new List<(string DrugId, string BatchId, int Quantity)>();
            using (var reader = await itemsCmd.ExecuteReaderAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    transferItems.Add((reader.GetString(0), reader.GetString(1), Convert.ToInt32(reader.GetValue(2))));
                }
            }

            // Increase inventory and record transaction at ToBranch
            foreach (var item in transferItems)
            {
                const string checkInvSql = @"
                    SELECT id, Quantity FROM INVENTORIES
                    WHERE BranchId = :toBranchId AND DrugId = :drugId AND BatchId = :batchId FOR UPDATE";

                using var checkCmd = connection.CreateCommand();
                checkCmd.Transaction = tx;
                checkCmd.CommandText = checkInvSql;
                checkCmd.Parameters.Add(new OracleParameter("toBranchId", toBranchId));
                checkCmd.Parameters.Add(new OracleParameter("drugId", item.DrugId));
                checkCmd.Parameters.Add(new OracleParameter("batchId", item.BatchId));

                string? toInvId = null;
                int currentQty = 0;
                using (var reader = await checkCmd.ExecuteReaderAsync(cancellationToken))
                {
                    if (await reader.ReadAsync(cancellationToken))
                    {
                        toInvId = reader.GetString(0);
                        currentQty = Convert.ToInt32(reader.GetValue(1));
                    }
                }

                if (toInvId is not null)
                {
                    const string updateInvSql = @"
                        UPDATE INVENTORIES
                        SET Quantity = Quantity + :incQty, UpdatedDate = CURRENT_TIMESTAMP
                        WHERE id = :invId";

                    using var updateInvCmd = connection.CreateCommand();
                    updateInvCmd.Transaction = tx;
                    updateInvCmd.CommandText = updateInvSql;
                    updateInvCmd.Parameters.Add(new OracleParameter("incQty", item.Quantity));
                    updateInvCmd.Parameters.Add(new OracleParameter("invId", toInvId));
                    await updateInvCmd.ExecuteNonQueryAsync(cancellationToken);
                }
                else
                {
                    const string insertInvSql = @"
                        INSERT INTO INVENTORIES (
                            id, BranchId, DrugId, BatchId, Quantity, MinQuantity, MaxQuantity, Location, CreatedDate
                        ) VALUES (
                            :id, :branchId, :drugId, :batchId, :quantity, 0, 1000, 'Khu vực nhận chuyển', CURRENT_TIMESTAMP
                        )";

                    toInvId = $"inv-{Guid.NewGuid():N}";
                    using var insertInvCmd = connection.CreateCommand();
                    insertInvCmd.Transaction = tx;
                    insertInvCmd.CommandText = insertInvSql;
                    insertInvCmd.Parameters.Add(new OracleParameter("id", toInvId));
                    insertInvCmd.Parameters.Add(new OracleParameter("branchId", toBranchId));
                    insertInvCmd.Parameters.Add(new OracleParameter("drugId", item.DrugId));
                    insertInvCmd.Parameters.Add(new OracleParameter("batchId", item.BatchId));
                    insertInvCmd.Parameters.Add(new OracleParameter("quantity", item.Quantity));
                    await insertInvCmd.ExecuteNonQueryAsync(cancellationToken);
                }

                // Add INVENTORY_TRANSACTION
                const string txLogSql = @"
                    INSERT INTO INVENTORY_TRANSACTIONS (
                        id, BranchId, DrugId, BatchId, TransactionType,
                        Quantity, BalanceAfter, ReferenceType, ReferenceId, Notes, CreatedDate
                    ) VALUES (
                        :id, :branchId, :drugId, :batchId, 'NHAP_DIEU_CHUYEN',
                        :quantity, :balanceAfter, 'STOCK_TRANSFER', :refId, 'Nhập kho từ chuyển hàng chi nhánh', CURRENT_TIMESTAMP
                    )";

                using var txCmd = connection.CreateCommand();
                txCmd.Transaction = tx;
                txCmd.CommandText = txLogSql;
                txCmd.Parameters.Add(new OracleParameter("id", $"tx-{Guid.NewGuid():N}"));
                txCmd.Parameters.Add(new OracleParameter("branchId", toBranchId));
                txCmd.Parameters.Add(new OracleParameter("drugId", item.DrugId));
                txCmd.Parameters.Add(new OracleParameter("batchId", item.BatchId));
                txCmd.Parameters.Add(new OracleParameter("quantity", item.Quantity));
                txCmd.Parameters.Add(new OracleParameter("balanceAfter", currentQty + item.Quantity));
                txCmd.Parameters.Add(new OracleParameter("refId", id));
                await txCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // Update Transfer status to COMPLETED
            const string updateTransferSql = @"
                UPDATE STOCK_TRANSFERS
                SET Status = 'COMPLETED', ReceivedBy = :receivedBy, ReceivedDate = CURRENT_TIMESTAMP
                WHERE id = :id";

            using var updateCmd = connection.CreateCommand();
            updateCmd.Transaction = tx;
            updateCmd.CommandText = updateTransferSql;
            updateCmd.Parameters.Add(new OracleParameter("receivedBy", userId));
            updateCmd.Parameters.Add(new OracleParameter("id", id));
            await updateCmd.ExecuteNonQueryAsync(cancellationToken);

            tx.Commit();
            logger.LogInformation("Stock transfer {TransferId} completed and received by user {UserId}", id, userId);

            return (await GetByIdAsync(id, branchId, cancellationToken))!;
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task<StockTransferDetailResponse> CancelTransferAsync(string id, string branchId, string userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await connectionFactory.CreateOpenConnectionAsync(branchId, cancellationToken);
        await using var sessionContextScope = new OracleSessionContextScope(connectionFactory, connection);
        using var tx = connection.BeginTransaction();

        try
        {
            const string selectSql = @"
                SELECT FromBranchId, Status FROM STOCK_TRANSFERS
                WHERE id = :id FOR UPDATE";

            using var cmd = connection.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = selectSql;
            cmd.Parameters.Add(new OracleParameter("id", id));

            string fromBranchId;
            string status;
            using (var reader = await cmd.ExecuteReaderAsync(cancellationToken))
            {
                if (!await reader.ReadAsync(cancellationToken))
                    throw new InvalidOperationException("Phiếu điều chuyển không tồn tại.");

                fromBranchId = reader.GetString(0);
                status = reader.GetString(1);
            }

            if (!string.Equals(fromBranchId, branchId, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Chỉ chi nhánh gửi mới có quyền hủy phiếu điều chuyển.");

            if (!string.Equals(status, "PENDING", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Chỉ có thể hủy phiếu khi đang ở trạng thái 'PENDING'. Trạng thái hiện tại: {status}.");

            const string updateSql = @"
                UPDATE STOCK_TRANSFERS
                SET Status = 'CANCELLED'
                WHERE id = :id";

            using var updateCmd = connection.CreateCommand();
            updateCmd.Transaction = tx;
            updateCmd.CommandText = updateSql;
            updateCmd.Parameters.Add(new OracleParameter("id", id));
            await updateCmd.ExecuteNonQueryAsync(cancellationToken);

            tx.Commit();
            logger.LogInformation("Stock transfer {TransferId} cancelled by user {UserId}", id, userId);

            return (await GetByIdAsync(id, branchId, cancellationToken))!;
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    private static StockTransferResponse MapTransferResponse(IDataRecord reader)
    {
        return new StockTransferResponse(
            reader.GetString(0),
            reader.GetString(1),
            reader.GetString(2),
            reader.GetString(3),
            reader.GetString(4),
            reader.GetString(5),
            reader.GetString(6),
            reader.GetString(7),
            reader.IsDBNull(8) ? null : reader.GetString(8),
            reader.IsDBNull(9) ? null : reader.GetString(9),
            reader.IsDBNull(10) ? null : reader.GetString(10),
            reader.IsDBNull(11) ? null : reader.GetString(11),
            reader.GetString(12),
            Convert.ToInt32(reader.GetValue(13)),
            Convert.ToInt32(reader.GetValue(14)),
            reader.IsDBNull(15) ? null : reader.GetDateTime(15),
            reader.IsDBNull(16) ? null : reader.GetDateTime(16),
            reader.IsDBNull(17) ? null : reader.GetString(17),
            reader.GetDateTime(18)
        );
    }
}
