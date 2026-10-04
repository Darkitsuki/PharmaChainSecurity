using System.Data;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Procurement;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class GoodsReceiptService : IGoodsReceiptService
{
    private readonly IUnitOfWork unitOfWork;

    public GoodsReceiptService(IUnitOfWork unitOfWork)
    {
        this.unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<GoodsReceiptResponse>> GetByBranchAsync(
        string branchId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var receipts = new List<GoodsReceiptResponse>();
            await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
            command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            command.BindByName = true;
            command.CommandText = """
                SELECT r.id, r.ReceiptNo, r.BranchId, r.SupplierId, s.SupplierName,
                       r.WarehouseStaffId, u.Username, r.TotalAmount, r.Note, r.Status, r.CreatedDate
                FROM GOODS_RECEIPTS r
                JOIN SUPPLIERS s ON r.SupplierId = s.id
                JOIN USERS u ON r.WarehouseStaffId = u.id
                WHERE r.BranchId = :branchId
                ORDER BY r.CreatedDate DESC
                """;
            command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                receipts.Add(new GoodsReceiptResponse(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.GetString(3),
                    reader.GetString(4),
                    reader.GetString(5),
                    reader.IsDBNull(6) ? null : reader.GetString(6),
                    reader.GetDecimal(7),
                    reader.IsDBNull(8) ? null : reader.GetString(8),
                    reader.GetString(9),
                    reader.GetDateTime(10),
                    Array.Empty<GoodsReceiptItemResponse>()));
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return receipts;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<GoodsReceiptResponse?> GetByIdAsync(
        string id,
        string branchId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(branchId))
            return null;

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            await using var headerCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
            headerCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            headerCmd.BindByName = true;
            headerCmd.CommandText = """
                SELECT r.id, r.ReceiptNo, r.BranchId, r.SupplierId, s.SupplierName,
                       r.WarehouseStaffId, u.Username, r.TotalAmount, r.Note, r.Status, r.CreatedDate
                FROM GOODS_RECEIPTS r
                JOIN SUPPLIERS s ON r.SupplierId = s.id
                JOIN USERS u ON r.WarehouseStaffId = u.id
                WHERE r.id = :id AND r.BranchId = :branchId
                """;
            headerCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;
            headerCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

            await using var headerReader = await headerCmd.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
            if (!await headerReader.ReadAsync(cancellationToken))
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return null;
            }

            var receiptId = headerReader.GetString(0);
            var receiptNo = headerReader.GetString(1);
            var bId = headerReader.GetString(2);
            var sId = headerReader.GetString(3);
            var sName = headerReader.GetString(4);
            var staffId = headerReader.GetString(5);
            var staffName = headerReader.IsDBNull(6) ? null : headerReader.GetString(6);
            var totalAmount = headerReader.GetDecimal(7);
            var note = headerReader.IsDBNull(8) ? null : headerReader.GetString(8);
            var status = headerReader.GetString(9);
            var createdDate = headerReader.GetDateTime(10);
            await headerReader.CloseAsync();

            var items = new List<GoodsReceiptItemResponse>();
            await using var itemCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
            itemCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            itemCmd.BindByName = true;
            itemCmd.CommandText = """
                SELECT i.id, i.ReceiptId, i.DrugId, d.DrugCode, d.Name,
                       i.BatchId, i.BatchNo, i.ExpiryDate, i.Quantity, i.ImportPrice, i.SubTotal
                FROM GOODS_RECEIPT_ITEMS i
                JOIN DRUGS d ON i.DrugId = d.id
                WHERE i.ReceiptId = :receiptId
                ORDER BY d.Name
                """;
            itemCmd.Parameters.Add("receiptId", OracleDbType.Varchar2, 50).Value = receiptId;

            await using var itemReader = await itemCmd.ExecuteReaderAsync(cancellationToken);
            while (await itemReader.ReadAsync(cancellationToken))
            {
                items.Add(new GoodsReceiptItemResponse(
                    itemReader.GetString(0),
                    itemReader.GetString(1),
                    itemReader.GetString(2),
                    itemReader.GetString(3),
                    itemReader.GetString(4),
                    itemReader.GetString(5),
                    itemReader.GetString(6),
                    itemReader.GetDateTime(7),
                    itemReader.GetInt32(8),
                    itemReader.GetDecimal(9),
                    itemReader.GetDecimal(10)));
            }

            await unitOfWork.CommitAsync(cancellationToken);

            return new GoodsReceiptResponse(
                receiptId,
                receiptNo,
                bId,
                sId,
                sName,
                staffId,
                staffName,
                totalAmount,
                note,
                status,
                createdDate,
                items);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<GoodsReceiptResponse> CreateReceiptAsync(
        string branchId,
        string warehouseStaffId,
        CreateGoodsReceiptRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));
        if (string.IsNullOrWhiteSpace(warehouseStaffId))
            throw new ArgumentException("Warehouse staff ID is required.", nameof(warehouseStaffId));
        if (string.IsNullOrWhiteSpace(request.SupplierId))
            throw new ArgumentException("Supplier ID is required.");
        if (request.Items is null || request.Items.Count == 0)
            throw new ArgumentException("At least one receipt item is required.");

        foreach (var item in request.Items)
        {
            if (string.IsNullOrWhiteSpace(item.DrugId))
                throw new ArgumentException("Drug ID is required for each item.");
            if (string.IsNullOrWhiteSpace(item.BatchNo))
                throw new ArgumentException("Batch number is required for each item.");
            if (item.Quantity <= 0)
                throw new ArgumentException("Quantity must be greater than zero.");
            if (item.ImportPrice < 0)
                throw new ArgumentException("Import price cannot be negative.");
            if (item.ExpiryDate <= DateTime.UtcNow.Date)
                throw new ArgumentException("Expiry date must be in the future.");
        }

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            // 1. Verify supplier
            await using var supCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
            supCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            supCmd.BindByName = true;
            supCmd.CommandText = "SELECT SupplierName FROM SUPPLIERS WHERE id = :id AND IsActive = 1";
            supCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = request.SupplierId;
            var supplierNameObj = await supCmd.ExecuteScalarAsync(cancellationToken);
            if (supplierNameObj is null)
                throw new InvalidOperationException("Nhà cung cấp không tồn tại hoặc đã ngừng hoạt động.");
            var supplierName = (string)supplierNameObj;

            var receiptId = $"rc-{Guid.NewGuid():N}"[..36];
            var receiptNo = $"PN{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..18].ToUpperInvariant();
            var now = DateTime.UtcNow;
            decimal totalAmount = 0;
            var responseItems = new List<GoodsReceiptItemResponse>();

            // 2. Process each item
            foreach (var item in request.Items)
            {
                // Verify Drug
                await using var drugCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
                drugCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                drugCmd.BindByName = true;
                drugCmd.CommandText = "SELECT DrugCode, Name FROM DRUGS WHERE id = :drugId";
                drugCmd.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
                await using var drugReader = await drugCmd.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
                if (!await drugReader.ReadAsync(cancellationToken))
                    throw new InvalidOperationException($"Thuốc với mã '{item.DrugId}' không tồn tại trong danh mục.");
                var drugCode = drugReader.GetString(0);
                var drugName = drugReader.GetString(1);
                await drugReader.CloseAsync();

                // Find or create Drug Batch
                string batchId;
                await using var batchFindCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
                batchFindCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                batchFindCmd.BindByName = true;
                batchFindCmd.CommandText = "SELECT id FROM DRUG_BATCHES WHERE DrugId = :drugId AND BatchNo = :batchNo";
                batchFindCmd.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
                batchFindCmd.Parameters.Add("batchNo", OracleDbType.Varchar2, 100).Value = item.BatchNo.Trim();
                var batchIdObj = await batchFindCmd.ExecuteScalarAsync(cancellationToken);

                if (batchIdObj is not null)
                {
                    batchId = (string)batchIdObj;
                }
                else
                {
                    batchId = $"bt-{Guid.NewGuid():N}"[..36];
                    await using var batchInsertCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
                    batchInsertCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                    batchInsertCmd.BindByName = true;
                    batchInsertCmd.CommandText = """
                        INSERT INTO DRUG_BATCHES (id, DrugId, BatchNo, MfgDate, ExpiryDate)
                        VALUES (:id, :drugId, :batchNo, :mfgDate, :expiryDate)
                        """;
                    batchInsertCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = batchId;
                    batchInsertCmd.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
                    batchInsertCmd.Parameters.Add("batchNo", OracleDbType.Varchar2, 100).Value = item.BatchNo.Trim();
                    batchInsertCmd.Parameters.Add("mfgDate", OracleDbType.Date).Value = (object?)item.MfgDate ?? DBNull.Value;
                    batchInsertCmd.Parameters.Add("expiryDate", OracleDbType.Date).Value = item.ExpiryDate.Date;
                    await batchInsertCmd.ExecuteNonQueryAsync(cancellationToken);
                }

                // Lock & update or insert INVENTORIES
                int newQuantity;
                await using var invFindCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
                invFindCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                invFindCmd.BindByName = true;
                invFindCmd.CommandText = """
                    SELECT Quantity FROM INVENTORIES
                    WHERE BranchId = :branchId AND DrugId = :drugId AND BatchId = :batchId
                    FOR UPDATE
                    """;
                invFindCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                invFindCmd.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
                invFindCmd.Parameters.Add("batchId", OracleDbType.Varchar2, 50).Value = batchId;
                var currentQtyObj = await invFindCmd.ExecuteScalarAsync(cancellationToken);

                if (currentQtyObj is not null)
                {
                    var currentQty = Convert.ToInt32(currentQtyObj);
                    newQuantity = currentQty + item.Quantity;
                    await using var invUpdateCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
                    invUpdateCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                    invUpdateCmd.BindByName = true;
                    invUpdateCmd.CommandText = """
                        UPDATE INVENTORIES
                        SET Quantity = :quantity
                        WHERE BranchId = :branchId AND DrugId = :drugId AND BatchId = :batchId
                        """;
                    invUpdateCmd.Parameters.Add("quantity", OracleDbType.Int32).Value = newQuantity;
                    invUpdateCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                    invUpdateCmd.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
                    invUpdateCmd.Parameters.Add("batchId", OracleDbType.Varchar2, 50).Value = batchId;
                    await invUpdateCmd.ExecuteNonQueryAsync(cancellationToken);
                }
                else
                {
                    newQuantity = item.Quantity;
                    await using var invInsertCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
                    invInsertCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                    invInsertCmd.BindByName = true;
                    invInsertCmd.CommandText = """
                        INSERT INTO INVENTORIES (BranchId, DrugId, BatchId, Quantity)
                        VALUES (:branchId, :drugId, :batchId, :quantity)
                        """;
                    invInsertCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                    invInsertCmd.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
                    invInsertCmd.Parameters.Add("batchId", OracleDbType.Varchar2, 50).Value = batchId;
                    invInsertCmd.Parameters.Add("quantity", OracleDbType.Int32).Value = newQuantity;
                    await invInsertCmd.ExecuteNonQueryAsync(cancellationToken);
                }

                // Insert into INVENTORY_TRANSACTIONS (Audit)
                var txId = $"tx-{Guid.NewGuid():N}"[..36];
                await using var txCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
                txCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                txCmd.BindByName = true;
                txCmd.CommandText = """
                    INSERT INTO INVENTORY_TRANSACTIONS
                    (id, BranchId, DrugId, BatchId, TransactionType, QuantityChange, RemainingQuantity, CreatedBy, CreatedDate, Note)
                    VALUES (:id, :branchId, :drugId, :batchId, 'NHAP', :change, :remaining, :createdBy, :createdDate, :note)
                    """;
                txCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = txId;
                txCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                txCmd.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
                txCmd.Parameters.Add("batchId", OracleDbType.Varchar2, 50).Value = batchId;
                txCmd.Parameters.Add("change", OracleDbType.Int32).Value = item.Quantity;
                txCmd.Parameters.Add("remaining", OracleDbType.Int32).Value = newQuantity;
                txCmd.Parameters.Add("createdBy", OracleDbType.Varchar2, 50).Value = warehouseStaffId;
                txCmd.Parameters.Add("createdDate", OracleDbType.TimeStamp).Value = now;
                txCmd.Parameters.Add("note", OracleDbType.Varchar2, 500).Value = $"Nhập kho phiếu {receiptNo} (Lô: {item.BatchNo.Trim()})";
                await txCmd.ExecuteNonQueryAsync(cancellationToken);

                // Insert into GOODS_RECEIPT_ITEMS
                var itemId = $"ri-{Guid.NewGuid():N}"[..36];
                var subtotal = item.Quantity * item.ImportPrice;
                totalAmount += subtotal;

                await using var itemInsertCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
                itemInsertCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                itemInsertCmd.BindByName = true;
                itemInsertCmd.CommandText = """
                    INSERT INTO GOODS_RECEIPT_ITEMS (id, ReceiptId, DrugId, BatchId, BatchNo, ExpiryDate, Quantity, ImportPrice, SubTotal)
                    VALUES (:id, :receiptId, :drugId, :batchId, :batchNo, :expiryDate, :quantity, :price, :subtotal)
                    """;
                itemInsertCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = itemId;
                itemInsertCmd.Parameters.Add("receiptId", OracleDbType.Varchar2, 50).Value = receiptId;
                itemInsertCmd.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
                itemInsertCmd.Parameters.Add("batchId", OracleDbType.Varchar2, 50).Value = batchId;
                itemInsertCmd.Parameters.Add("batchNo", OracleDbType.Varchar2, 100).Value = item.BatchNo.Trim();
                itemInsertCmd.Parameters.Add("expiryDate", OracleDbType.Date).Value = item.ExpiryDate.Date;
                itemInsertCmd.Parameters.Add("quantity", OracleDbType.Int32).Value = item.Quantity;
                itemInsertCmd.Parameters.Add("price", OracleDbType.Decimal).Value = item.ImportPrice;
                itemInsertCmd.Parameters.Add("subtotal", OracleDbType.Decimal).Value = subtotal;
                await itemInsertCmd.ExecuteNonQueryAsync(cancellationToken);

                responseItems.Add(new GoodsReceiptItemResponse(
                    itemId,
                    receiptId,
                    item.DrugId,
                    drugCode,
                    drugName,
                    batchId,
                    item.BatchNo.Trim(),
                    item.ExpiryDate.Date,
                    item.Quantity,
                    item.ImportPrice,
                    subtotal));
            }

            // 3. Insert GOODS_RECEIPTS header
            await using var receiptInsertCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
            receiptInsertCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            receiptInsertCmd.BindByName = true;
            receiptInsertCmd.CommandText = """
                INSERT INTO GOODS_RECEIPTS (id, ReceiptNo, BranchId, SupplierId, WarehouseStaffId, TotalAmount, Note, Status, CreatedDate)
                VALUES (:id, :no, :branchId, :supplierId, :staffId, :total, :note, 'COMPLETED', :createdDate)
                """;
            receiptInsertCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = receiptId;
            receiptInsertCmd.Parameters.Add("no", OracleDbType.Varchar2, 50).Value = receiptNo;
            receiptInsertCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
            receiptInsertCmd.Parameters.Add("supplierId", OracleDbType.Varchar2, 50).Value = request.SupplierId;
            receiptInsertCmd.Parameters.Add("staffId", OracleDbType.Varchar2, 50).Value = warehouseStaffId;
            receiptInsertCmd.Parameters.Add("total", OracleDbType.Decimal).Value = totalAmount;
            receiptInsertCmd.Parameters.Add("note", OracleDbType.Varchar2, 500).Value = (object?)request.Note?.Trim() ?? DBNull.Value;
            receiptInsertCmd.Parameters.Add("createdDate", OracleDbType.TimeStamp).Value = now;
            await receiptInsertCmd.ExecuteNonQueryAsync(cancellationToken);

            // Commit atomic transaction
            await unitOfWork.CommitAsync(cancellationToken);

            return new GoodsReceiptResponse(
                receiptId,
                receiptNo,
                branchId,
                request.SupplierId,
                supplierName,
                warehouseStaffId,
                null,
                totalAmount,
                request.Note?.Trim(),
                "COMPLETED",
                now,
                responseItems);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
