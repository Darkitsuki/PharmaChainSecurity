using System.Data;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Returns;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class ReturnService : IReturnService
{
    private readonly IUnitOfWork unitOfWork;
    private readonly IBranchContextAccessor branchContextAccessor;

    public ReturnService(IUnitOfWork unitOfWork, IBranchContextAccessor branchContextAccessor)
    {
        this.unitOfWork = unitOfWork;
        this.branchContextAccessor = branchContextAccessor;
    }

    public async Task<IReadOnlyList<ReturnResponse>> GetByBranchAsync(string branchId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            return Array.Empty<ReturnResponse>();

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var list = new List<ReturnResponse>();
            await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
            command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
            command.BindByName = true;
            command.CommandText = """
                SELECT r.id, r.ReturnNo, r.InvoiceId, i.InvoiceNo, r.BranchId,
                       r.CashierId, u.FullName AS CashierName,
                       r.CustomerId, c.FullName AS CustomerName,
                       r.TotalRefundAmount, r.Reason, r.Status, r.CreatedDate
                FROM RETURNS r
                JOIN INVOICES i ON r.InvoiceId = i.id
                JOIN USERS u ON r.CashierId = u.id
                LEFT JOIN CUSTOMERS c ON r.CustomerId = c.id
                WHERE r.BranchId = :BranchId
                ORDER BY r.CreatedDate DESC
                """;
            command.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(new ReturnResponse(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.GetString(3),
                    reader.GetString(4),
                    reader.GetString(5),
                    reader.GetString(6),
                    reader.IsDBNull(7) ? null : reader.GetString(7),
                    reader.IsDBNull(8) ? null : reader.GetString(8),
                    reader.GetDecimal(9),
                    reader.GetString(10),
                    reader.GetString(11),
                    reader.GetDateTime(12),
                    Array.Empty<ReturnItemResponse>()));
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

    public async Task<ReturnResponse?> GetByIdAsync(string id, string branchId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(branchId))
            return null;

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            ReturnResponse? returnOrder = null;
            await using (var command = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                command.BindByName = true;
                command.CommandText = """
                    SELECT r.id, r.ReturnNo, r.InvoiceId, i.InvoiceNo, r.BranchId,
                           r.CashierId, u.FullName AS CashierName,
                           r.CustomerId, c.FullName AS CustomerName,
                           r.TotalRefundAmount, r.Reason, r.Status, r.CreatedDate
                    FROM RETURNS r
                    JOIN INVOICES i ON r.InvoiceId = i.id
                    JOIN USERS u ON r.CashierId = u.id
                    LEFT JOIN CUSTOMERS c ON r.CustomerId = c.id
                    WHERE r.id = :id AND r.BranchId = :BranchId
                    """;
                command.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, id, ParameterDirection.Input));
                command.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));

                await using var reader = await command.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    returnOrder = new ReturnResponse(
                        reader.GetString(0),
                        reader.GetString(1),
                        reader.GetString(2),
                        reader.GetString(3),
                        reader.GetString(4),
                        reader.GetString(5),
                        reader.GetString(6),
                        reader.IsDBNull(7) ? null : reader.GetString(7),
                        reader.IsDBNull(8) ? null : reader.GetString(8),
                        reader.GetDecimal(9),
                        reader.GetString(10),
                        reader.GetString(11),
                        reader.GetDateTime(12),
                        new List<ReturnItemResponse>());
                }
            }

            if (returnOrder is null)
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return null;
            }

            var items = new List<ReturnItemResponse>();
            await using (var itemCommand = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                itemCommand.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                itemCommand.BindByName = true;
                itemCommand.CommandText = """
                    SELECT ri.DrugId, d.DrugCode, d.Name AS DrugName,
                           ri.BatchId, b.BatchNumber,
                           ri.Quantity, ri.RefundPrice, ri.SubTotal, ri.ActionType
                    FROM RETURN_ITEMS ri
                    JOIN DRUGS d ON ri.DrugId = d.id
                    JOIN DRUG_BATCHES b ON ri.BatchId = b.id
                    WHERE ri.ReturnId = :ReturnId
                    """;
                itemCommand.Parameters.Add(new OracleParameter("ReturnId", OracleDbType.Varchar2, returnOrder.Id, ParameterDirection.Input));

                await using var reader = await itemCommand.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    items.Add(new ReturnItemResponse(
                        reader.GetString(0),
                        reader.GetString(1),
                        reader.GetString(2),
                        reader.GetString(3),
                        reader.GetString(4),
                        reader.GetInt32(5),
                        reader.GetDecimal(6),
                        reader.GetDecimal(7),
                        reader.GetString(8)));
                }
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return returnOrder with { Items = items };
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ReturnableInvoiceResponse?> LookupInvoiceForReturnAsync(string invoiceQuery, string branchId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(invoiceQuery) || string.IsNullOrWhiteSpace(branchId))
            return null;

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            ReturnableInvoiceResponse? invoice = null;
            await using (var command = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                command.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                command.BindByName = true;
                command.CommandText = """
                    SELECT i.id, i.InvoiceNo, i.CreatedDate, i.TotalAmount, i.BranchId,
                           i.CustomerId, c.FullName, c.PhoneNumber
                    FROM INVOICES i
                    LEFT JOIN CUSTOMERS c ON i.CustomerId = c.id
                    WHERE (i.id = :q OR UPPER(i.InvoiceNo) = UPPER(:q))
                      AND i.BranchId = :BranchId
                    """;
                command.Parameters.Add(new OracleParameter("q", OracleDbType.Varchar2, invoiceQuery.Trim(), ParameterDirection.Input));
                command.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));

                await using var reader = await command.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    invoice = new ReturnableInvoiceResponse(
                        reader.GetString(0),
                        reader.GetString(1),
                        reader.GetDateTime(2),
                        reader.GetDecimal(3),
                        reader.GetString(4),
                        reader.IsDBNull(5) ? null : reader.GetString(5),
                        reader.IsDBNull(6) ? null : reader.GetString(6),
                        reader.IsDBNull(7) ? null : reader.GetString(7),
                        new List<ReturnableInvoiceItemResponse>());
                }
            }

            if (invoice is null)
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return null;
            }

            var items = new List<ReturnableInvoiceItemResponse>();
            await using (var itemCommand = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                itemCommand.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                itemCommand.BindByName = true;
                itemCommand.CommandText = """
                    SELECT ii.DrugId, d.DrugCode, d.Name AS DrugName,
                           ii.BatchId, b.BatchNumber,
                           ii.Quantity AS OriginalQuantity,
                           NVL((SELECT SUM(ri.Quantity)
                                FROM RETURNS r
                                JOIN RETURN_ITEMS ri ON r.id = ri.ReturnId
                                WHERE r.InvoiceId = ii.InvoiceId
                                  AND ri.DrugId = ii.DrugId
                                  AND ri.BatchId = ii.BatchId
                                  AND r.Status = 'COMPLETED'), 0) AS ReturnedQuantity,
                           ii.UnitPrice
                    FROM INVOICE_ITEMS ii
                    JOIN DRUGS d ON ii.DrugId = d.id
                    JOIN DRUG_BATCHES b ON ii.BatchId = b.id
                    WHERE ii.InvoiceId = :InvoiceId
                    """;
                itemCommand.Parameters.Add(new OracleParameter("InvoiceId", OracleDbType.Varchar2, invoice.InvoiceId, ParameterDirection.Input));

                await using var reader = await itemCommand.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    var drugId = reader.GetString(0);
                    var drugCode = reader.GetString(1);
                    var drugName = reader.GetString(2);
                    var batchId = reader.GetString(3);
                    var batchNo = reader.GetString(4);
                    var origQty = reader.GetInt32(5);
                    var retQty = Convert.ToInt32(reader.GetValue(6));
                    var unitPrice = reader.GetDecimal(7);
                    var available = Math.Max(0, origQty - retQty);

                    items.Add(new ReturnableInvoiceItemResponse(
                        drugId, drugCode, drugName, batchId, batchNo,
                        origQty, retQty, available, unitPrice));
                }
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return invoice with { Items = items };
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ReturnResponse> CreateReturnAsync(
        CreateReturnRequest request,
        string branchId,
        string cashierId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.InvoiceId))
            throw new ArgumentException("Mã hóa đơn gốc không được để trống.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new ArgumentException("Lý do trả hàng là bắt buộc.", nameof(request));

        if (request.Items is null || request.Items.Count == 0)
            throw new ArgumentException("Danh sách mặt hàng trả không được để trống.", nameof(request));

        if (request.Items.Any(i => i.Quantity <= 0))
            throw new ArgumentException("Số lượng trả phải lớn hơn 0.", nameof(request));

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            // 1. Kiểm tra hóa đơn gốc và chi nhánh
            string invoiceNo;
            string? customerId = null;
            await using (var invCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                invCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                invCmd.BindByName = true;
                invCmd.CommandText = "SELECT InvoiceNo, CustomerId, BranchId FROM INVOICES WHERE id = :id";
                invCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, request.InvoiceId, ParameterDirection.Input));

                await using var reader = await invCmd.ExecuteReaderAsync(cancellationToken);
                if (!await reader.ReadAsync(cancellationToken))
                    throw new InvalidOperationException("Không tìm thấy hóa đơn gốc.");

                invoiceNo = reader.GetString(0);
                customerId = reader.IsDBNull(1) ? null : reader.GetString(1);
                var invBranch = reader.GetString(2);

                if (!string.Equals(invBranch, branchId, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("Hóa đơn không thuộc chi nhánh hiện tại.");
            }

            // 2. Kiểm tra số lượng có thể trả của từng mặt hàng
            decimal totalRefund = 0;
            var responseItems = new List<ReturnItemResponse>();

            foreach (var item in request.Items)
            {
                int origQty;
                decimal unitPrice;
                string drugCode;
                string drugName;
                string batchNo;

                await using (var checkCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
                {
                    checkCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                    checkCmd.BindByName = true;
                    checkCmd.CommandText = """
                        SELECT ii.Quantity, ii.UnitPrice, d.DrugCode, d.Name, b.BatchNumber,
                               NVL((SELECT SUM(ri.Quantity)
                                    FROM RETURNS r
                                    JOIN RETURN_ITEMS ri ON r.id = ri.ReturnId
                                    WHERE r.InvoiceId = ii.InvoiceId
                                      AND ri.DrugId = ii.DrugId
                                      AND ri.BatchId = ii.BatchId
                                      AND r.Status = 'COMPLETED'), 0) AS AlreadyReturned
                        FROM INVOICE_ITEMS ii
                        JOIN DRUGS d ON ii.DrugId = d.id
                        JOIN DRUG_BATCHES b ON ii.BatchId = b.id
                        WHERE ii.InvoiceId = :InvoiceId
                          AND ii.DrugId = :DrugId
                          AND ii.BatchId = :BatchId
                        """;
                    checkCmd.Parameters.Add(new OracleParameter("InvoiceId", OracleDbType.Varchar2, request.InvoiceId, ParameterDirection.Input));
                    checkCmd.Parameters.Add(new OracleParameter("DrugId", OracleDbType.Varchar2, item.DrugId, ParameterDirection.Input));
                    checkCmd.Parameters.Add(new OracleParameter("BatchId", OracleDbType.Varchar2, item.BatchId, ParameterDirection.Input));

                    await using var reader = await checkCmd.ExecuteReaderAsync(cancellationToken);
                    if (!await reader.ReadAsync(cancellationToken))
                        throw new InvalidOperationException($"Thuốc '{item.DrugId}' không có trong hóa đơn gốc.");

                    origQty = reader.GetInt32(0);
                    unitPrice = reader.GetDecimal(1);
                    drugCode = reader.GetString(2);
                    drugName = reader.GetString(3);
                    batchNo = reader.GetString(4);
                    var alreadyReturned = Convert.ToInt32(reader.GetValue(5));

                    var available = origQty - alreadyReturned;
                    if (item.Quantity > available)
                    {
                        throw new InvalidOperationException(
                            $"Mặt hàng '{drugName}' (Lô {batchNo}) chỉ còn được trả tối đa {available} sản phẩm (đã trả {alreadyReturned}/{origQty}).");
                    }
                }

                var subTotal = item.Quantity * unitPrice;
                totalRefund += subTotal;

                responseItems.Add(new ReturnItemResponse(
                    item.DrugId,
                    drugCode,
                    drugName,
                    item.BatchId,
                    batchNo,
                    item.Quantity,
                    unitPrice,
                    subTotal,
                    item.ActionType));
            }

            // 3. Tạo phiếu trả hàng (RETURNS)
            var returnId = $"ret-{Guid.NewGuid():N}";
            var returnNo = $"TH{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..24];
            var createdDate = DateTime.UtcNow;

            await using (var insertReturnCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                insertReturnCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                insertReturnCmd.BindByName = true;
                insertReturnCmd.CommandText = """
                    INSERT INTO RETURNS (id, ReturnNo, InvoiceId, BranchId, CashierId, CustomerId, TotalRefundAmount, Reason, Status, CreatedDate)
                    VALUES (:id, :ReturnNo, :InvoiceId, :BranchId, :CashierId, :CustomerId, :TotalRefundAmount, :Reason, 'COMPLETED', :CreatedDate)
                    """;
                insertReturnCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, returnId, ParameterDirection.Input));
                insertReturnCmd.Parameters.Add(new OracleParameter("ReturnNo", OracleDbType.Varchar2, returnNo, ParameterDirection.Input));
                insertReturnCmd.Parameters.Add(new OracleParameter("InvoiceId", OracleDbType.Varchar2, request.InvoiceId, ParameterDirection.Input));
                insertReturnCmd.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));
                insertReturnCmd.Parameters.Add(new OracleParameter("CashierId", OracleDbType.Varchar2, cashierId, ParameterDirection.Input));
                insertReturnCmd.Parameters.Add(new OracleParameter("CustomerId", OracleDbType.Varchar2, (object?)customerId ?? DBNull.Value, ParameterDirection.Input));
                insertReturnCmd.Parameters.Add(new OracleParameter("TotalRefundAmount", OracleDbType.Decimal, totalRefund, ParameterDirection.Input));
                insertReturnCmd.Parameters.Add(new OracleParameter("Reason", OracleDbType.Varchar2, request.Reason.Trim(), ParameterDirection.Input));
                insertReturnCmd.Parameters.Add(new OracleParameter("CreatedDate", OracleDbType.TimeStamp, createdDate, ParameterDirection.Input));

                await insertReturnCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // 4. Lưu từng dòng chi tiết (RETURN_ITEMS) và nhập lại kho nếu RESTOCK
            foreach (var item in responseItems)
            {
                await using (var insertItemCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
                {
                    insertItemCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                    insertItemCmd.BindByName = true;
                    insertItemCmd.CommandText = """
                        INSERT INTO RETURN_ITEMS (ReturnId, DrugId, BatchId, Quantity, RefundPrice, SubTotal, ActionType)
                        VALUES (:ReturnId, :DrugId, :BatchId, :Quantity, :RefundPrice, :SubTotal, :ActionType)
                        """;
                    insertItemCmd.Parameters.Add(new OracleParameter("ReturnId", OracleDbType.Varchar2, returnId, ParameterDirection.Input));
                    insertItemCmd.Parameters.Add(new OracleParameter("DrugId", OracleDbType.Varchar2, item.DrugId, ParameterDirection.Input));
                    insertItemCmd.Parameters.Add(new OracleParameter("BatchId", OracleDbType.Varchar2, item.BatchId, ParameterDirection.Input));
                    insertItemCmd.Parameters.Add(new OracleParameter("Quantity", OracleDbType.Int32, item.Quantity, ParameterDirection.Input));
                    insertItemCmd.Parameters.Add(new OracleParameter("RefundPrice", OracleDbType.Decimal, item.RefundPrice, ParameterDirection.Input));
                    insertItemCmd.Parameters.Add(new OracleParameter("SubTotal", OracleDbType.Decimal, item.SubTotal, ParameterDirection.Input));
                    insertItemCmd.Parameters.Add(new OracleParameter("ActionType", OracleDbType.Varchar2, item.ActionType, ParameterDirection.Input));

                    await insertItemCmd.ExecuteNonQueryAsync(cancellationToken);
                }

                // Nếu chọn nhập lại kho (RESTOCK)
                if (string.Equals(item.ActionType, "RESTOCK", StringComparison.OrdinalIgnoreCase))
                {
                    // Cộng lại tồn kho
                    await using (var updateInvCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
                    {
                        updateInvCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                        updateInvCmd.BindByName = true;
                        updateInvCmd.CommandText = """
                            UPDATE INVENTORIES
                            SET Quantity = Quantity + :Qty
                            WHERE BranchId = :BranchId AND DrugId = :DrugId AND BatchId = :BatchId
                            """;
                        updateInvCmd.Parameters.Add(new OracleParameter("Qty", OracleDbType.Int32, item.Quantity, ParameterDirection.Input));
                        updateInvCmd.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));
                        updateInvCmd.Parameters.Add(new OracleParameter("DrugId", OracleDbType.Varchar2, item.DrugId, ParameterDirection.Input));
                        updateInvCmd.Parameters.Add(new OracleParameter("BatchId", OracleDbType.Varchar2, item.BatchId, ParameterDirection.Input));

                        await updateInvCmd.ExecuteNonQueryAsync(cancellationToken);
                    }

                    // Ghi lịch sử biến động kho loại 'TRA_HANG'
                    await using (var txCmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
                    {
                        txCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                        txCmd.BindByName = true;
                        txCmd.CommandText = """
                            INSERT INTO INVENTORY_TRANSACTIONS (id, BranchId, DrugId, BatchId, TransactionType, QuantityChange, BalanceAfter, ReferenceId, Note, CreatedDate)
                            VALUES (:id, :BranchId, :DrugId, :BatchId, 'TRA_HANG', :QuantityChange,
                                    (SELECT Quantity FROM INVENTORIES WHERE BranchId = :BranchId AND DrugId = :DrugId AND BatchId = :BatchId),
                                    :ReferenceId, :Note, :CreatedDate)
                            """;
                        txCmd.Parameters.Add(new OracleParameter("id", OracleDbType.Varchar2, $"tx-{Guid.NewGuid():N}", ParameterDirection.Input));
                        txCmd.Parameters.Add(new OracleParameter("BranchId", OracleDbType.Varchar2, branchId, ParameterDirection.Input));
                        txCmd.Parameters.Add(new OracleParameter("DrugId", OracleDbType.Varchar2, item.DrugId, ParameterDirection.Input));
                        txCmd.Parameters.Add(new OracleParameter("BatchId", OracleDbType.Varchar2, item.BatchId, ParameterDirection.Input));
                        txCmd.Parameters.Add(new OracleParameter("QuantityChange", OracleDbType.Int32, item.Quantity, ParameterDirection.Input));
                        txCmd.Parameters.Add(new OracleParameter("ReferenceId", OracleDbType.Varchar2, returnId, ParameterDirection.Input));
                        txCmd.Parameters.Add(new OracleParameter("Note", OracleDbType.Varchar2, $"Nhập lại kho từ phiếu đổi trả {returnNo} (HĐ: {invoiceNo})", ParameterDirection.Input));
                        txCmd.Parameters.Add(new OracleParameter("CreatedDate", OracleDbType.TimeStamp, createdDate, ParameterDirection.Input));

                        await txCmd.ExecuteNonQueryAsync(cancellationToken);
                    }
                }
            }

            // 5. Cập nhật trừ chi tiêu và điểm tích lũy của khách hàng nếu có
            if (!string.IsNullOrWhiteSpace(customerId))
            {
                var deductedPoints = (int)(totalRefund / 100000m); // 100k = 1 điểm
                await using var custCmd = (OracleCommand)unitOfWork.Connection.CreateCommand();
                custCmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                custCmd.BindByName = true;
                custCmd.CommandText = """
                    UPDATE CUSTOMERS
                    SET TotalSpent = GREATEST(0, TotalSpent - :refund),
                        Points = GREATEST(0, Points - :deductedPoints)
                    WHERE id = :CustomerId
                    """;
                custCmd.Parameters.Add(new OracleParameter("refund", OracleDbType.Decimal, totalRefund, ParameterDirection.Input));
                custCmd.Parameters.Add(new OracleParameter("deductedPoints", OracleDbType.Int32, deductedPoints, ParameterDirection.Input));
                custCmd.Parameters.Add(new OracleParameter("CustomerId", OracleDbType.Varchar2, customerId, ParameterDirection.Input));

                await custCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            await unitOfWork.CommitAsync(cancellationToken);

            return new ReturnResponse(
                returnId,
                returnNo,
                request.InvoiceId,
                invoiceNo,
                branchId,
                cashierId,
                "Thu ngân",
                customerId,
                null,
                totalRefund,
                request.Reason.Trim(),
                "COMPLETED",
                createdDate,
                responseItems);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
