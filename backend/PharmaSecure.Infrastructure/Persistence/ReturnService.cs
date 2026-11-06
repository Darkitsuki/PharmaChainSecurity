using System.Data;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Returns;
using PharmaSecure.Application.Features.Sales;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Common;
using PharmaSecure.Domain.Entities;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class ReturnService : IReturnService
{
    private readonly IUnitOfWork unitOfWork;
    private readonly IInventoryRepository inventoryRepository;
    private readonly IInvoicePersistence invoicePersistence;
    private readonly IDigitalSignatureService digitalSignatureService;

    public ReturnService(
        IUnitOfWork unitOfWork,
        IInventoryRepository inventoryRepository,
        IInvoicePersistence invoicePersistence,
        IDigitalSignatureService digitalSignatureService)
    {
        this.unitOfWork = unitOfWork;
        this.inventoryRepository = inventoryRepository;
        this.invoicePersistence = invoicePersistence;
        this.digitalSignatureService = digitalSignatureService;
    }

    public async Task<IReadOnlyList<ReturnResponse>> GetByBranchAsync(
        string branchId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            return Array.Empty<ReturnResponse>();

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var returns = new List<ReturnResponse>();
            await using var command = CreateCommand(ReturnHeaderSql + " ORDER BY r.CreatedDate DESC");
            command.Parameters.Add("BranchId", OracleDbType.Varchar2, 50).Value = branchId;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
                returns.Add(ReadReturn(reader, Array.Empty<ReturnItemResponse>()));

            await unitOfWork.CommitAsync(cancellationToken);
            return returns;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ReturnResponse?> GetByIdAsync(
        string id,
        string branchId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(branchId))
            return null;

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            ReturnResponse? result;
            await using (var command = CreateCommand(ReturnHeaderSql + " AND r.id = :id"))
            {
                command.Parameters.Add("BranchId", OracleDbType.Varchar2, 50).Value = branchId;
                command.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;
                await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
                result = await reader.ReadAsync(cancellationToken)
                    ? ReadReturn(reader, Array.Empty<ReturnItemResponse>())
                    : null;
            }

            if (result is null)
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return null;
            }

            var items = new List<ReturnItemResponse>();
            await using (var command = CreateCommand("""
                SELECT ri.DrugId, d.DrugCode, d.Name, ri.BatchId, b.BatchNo,
                       ri.Quantity, ri.RefundPrice, ri.SubTotal, ri.ActionType
                FROM RETURN_ITEMS ri
                JOIN DRUGS d ON d.id = ri.DrugId
                JOIN DRUG_BATCHES b ON b.id = ri.BatchId
                WHERE ri.ReturnId = :ReturnId
                ORDER BY d.Name, b.BatchNo
                """))
            {
                command.Parameters.Add("ReturnId", OracleDbType.Varchar2, 50).Value = id;
                await using var reader = await command.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    items.Add(new ReturnItemResponse(
                        reader.GetString(0), reader.GetString(1), reader.GetString(2),
                        reader.GetString(3), reader.GetString(4), reader.GetInt32(5),
                        reader.GetDecimal(6), reader.GetDecimal(7), reader.GetString(8)));
                }
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return result with { Items = items };
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ReturnableInvoiceResponse?> LookupInvoiceForReturnAsync(
        string invoiceQuery,
        string branchId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(invoiceQuery) || string.IsNullOrWhiteSpace(branchId))
            return null;

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            ReturnableInvoiceResponse? invoice = null;
            await using (var command = CreateCommand("""
                SELECT i.id, i.InvoiceNo, i.CreatedDate, i.TotalAmount, i.BranchId,
                       i.CustomerId, c.FullName, c.PhoneNumber
                FROM INVOICES i
                LEFT JOIN CUSTOMERS c ON c.id = i.CustomerId
                WHERE (i.id = :q OR UPPER(i.InvoiceNo) = UPPER(:q))
                  AND i.BranchId = :BranchId
                  AND i.Status = 'COMPLETED'
                  AND i.PaymentStatus = 'PAID'
                """))
            {
                command.Parameters.Add("q", OracleDbType.Varchar2, 50).Value = invoiceQuery.Trim();
                command.Parameters.Add("BranchId", OracleDbType.Varchar2, 50).Value = branchId;
                await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    invoice = new ReturnableInvoiceResponse(
                        reader.GetString(0), reader.GetString(1), reader.GetDateTime(2), reader.GetDecimal(3),
                        reader.GetString(4), reader.IsDBNull(5) ? null : reader.GetString(5),
                        reader.IsDBNull(6) ? null : reader.GetString(6),
                        reader.IsDBNull(7) ? null : reader.GetString(7),
                        Array.Empty<ReturnableInvoiceItemResponse>());
                }
            }

            if (invoice is null)
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return null;
            }

            var items = new List<ReturnableInvoiceItemResponse>();
            await using (var command = CreateCommand("""
                SELECT ii.DrugId, d.DrugCode, d.Name, ii.BatchId, b.BatchNo,
                       ii.Quantity,
                       NVL((SELECT SUM(ri.Quantity)
                            FROM RETURNS r
                            JOIN RETURN_ITEMS ri ON ri.ReturnId = r.id
                            WHERE r.InvoiceId = ii.InvoiceId
                              AND ri.DrugId = ii.DrugId
                              AND ri.BatchId = ii.BatchId
                              AND r.Status = 'COMPLETED'), 0),
                       ii.UnitPrice
                FROM INVOICE_ITEMS ii
                JOIN DRUGS d ON d.id = ii.DrugId
                JOIN DRUG_BATCHES b ON b.id = ii.BatchId
                WHERE ii.InvoiceId = :InvoiceId
                ORDER BY d.Name, b.BatchNo
                """))
            {
                command.Parameters.Add("InvoiceId", OracleDbType.Varchar2, 50).Value = invoice.InvoiceId;
                await using var reader = await command.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    var originalQuantity = reader.GetInt32(5);
                    var returnedQuantity = Convert.ToInt32(reader.GetValue(6));
                    items.Add(new ReturnableInvoiceItemResponse(
                        reader.GetString(0), reader.GetString(1), reader.GetString(2),
                        reader.GetString(3), reader.GetString(4), originalQuantity, returnedQuantity,
                        Math.Max(0, originalQuantity - returnedQuantity), reader.GetDecimal(7)));
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
        ValidateRequest(request);
        var transactionType = request.TransactionType.Trim().ToUpperInvariant();
        var isExchange = transactionType == "EXCHANGE";

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var originalInvoice = await LockOriginalInvoiceAsync(request.InvoiceId, branchId, cancellationToken);
            var returnItems = await ValidateReturnItemsAsync(request, cancellationToken);
            var totalRefund = returnItems.Sum(item => item.SubTotal);

            var inventoryKeys = returnItems
                .Where(item => item.ActionType == "RESTOCK")
                .Select(item => (item.DrugId, item.BatchId))
                .Concat((request.ReplacementItems ?? []).Select(item => (item.DrugId, item.BatchId)))
                .Distinct()
                .OrderBy(item => item.DrugId)
                .ThenBy(item => item.BatchId)
                .ToArray();
            var lockedInventory = new Dictionary<(string DrugId, string BatchId), Inventory>();
            foreach (var key in inventoryKeys)
            {
                lockedInventory[key] = await inventoryRepository.LockRowForUpdateAsync(
                    branchId, key.DrugId, key.BatchId, cancellationToken)
                    ?? throw new InvalidOperationException("Không tìm thấy tồn kho của lô thuốc đã chọn.");
            }

            foreach (var item in returnItems.Where(item => item.ActionType == "RESTOCK"))
                lockedInventory[(item.DrugId, item.BatchId)].IncreaseQuantity(item.Quantity);

            var exchange = isExchange
                ? await BuildExchangeInvoiceAsync(request, originalInvoice.CustomerId, branchId, cashierId, lockedInventory, cancellationToken)
                : null;

            var now = DateTime.SpecifyKind(VietnamTimeHelper.Now, DateTimeKind.Unspecified);
            var returnId = $"ret-{Guid.NewGuid():N}";
            var returnNo = $"TH{now:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..24];

            if (exchange is not null)
                await invoicePersistence.SaveAsync(exchange.Invoice, exchange.Signature, cancellationToken);

            await InsertReturnAsync(
                returnId, returnNo, request, branchId, cashierId, originalInvoice.CustomerId,
                exchange?.Invoice.Id, totalRefund, now, cancellationToken);
            await InsertReturnItemsAsync(returnId, returnItems, cancellationToken);

            foreach (var item in returnItems.Where(item => item.ActionType == "RESTOCK"))
            {
                await InsertInventoryTransactionAsync(
                    branchId, item.DrugId, item.BatchId, "TRA_HANG", item.Quantity,
                    lockedInventory[(item.DrugId, item.BatchId)].Quantity, cashierId,
                    $"Nhập lại kho từ phiếu {returnNo} (HĐ: {originalInvoice.InvoiceNo})", now, cancellationToken);
            }

            if (exchange is not null)
            {
                foreach (var item in exchange.Invoice.Items)
                {
                    await InsertInventoryTransactionAsync(
                        branchId, item.DrugId, item.BatchId, "XUAT_BAN", -item.Quantity,
                        lockedInventory[(item.DrugId, item.BatchId)].Quantity, cashierId,
                        $"Xuất kho cho hóa đơn đổi {exchange.Invoice.InvoiceNumber}", now, cancellationToken);
                }
            }

            foreach (var inventory in lockedInventory.Values)
                await inventoryRepository.UpdateQuantityAsync(inventory, cancellationToken);

            await DecreaseCustomerTotalsAsync(originalInvoice.CustomerId, totalRefund, cancellationToken);
            await unitOfWork.CommitAsync(cancellationToken);

            var replacementTotal = exchange?.Invoice.TotalAmount ?? 0;
            var difference = replacementTotal - totalRefund;
            return new ReturnResponse(
                returnId, returnNo, request.InvoiceId, originalInvoice.InvoiceNo, branchId,
                cashierId, "Thu ngân", originalInvoice.CustomerId, null, totalRefund,
                exchange?.Invoice.Id, exchange?.Invoice.InvoiceNumber, replacementTotal, difference,
                transactionType, ResolveSettlementStatus(!isExchange, difference, exchange?.Invoice.PaymentStatus),
                request.Reason.Trim(), "COMPLETED", now, returnItems);
        }
        catch
        {
            await unitOfWork.RollbackAsync(CancellationToken.None);
            throw;
        }
    }

    private async Task<OriginalInvoice> LockOriginalInvoiceAsync(
        string invoiceId,
        string branchId,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand("""
            SELECT InvoiceNo, CustomerId, Status, PaymentStatus
            FROM INVOICES
            WHERE id = :id AND BranchId = :BranchId
            FOR UPDATE
            """);
        command.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = invoiceId;
        command.Parameters.Add("BranchId", OracleDbType.Varchar2, 50).Value = branchId;
        await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
            throw new InvalidOperationException("Không tìm thấy hóa đơn hợp lệ tại chi nhánh.");
        if (!string.Equals(reader.GetString(2), "COMPLETED", StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(reader.GetString(3), "PAID", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Chỉ hóa đơn đã hoàn tất và thanh toán mới được đổi trả.");
        return new OriginalInvoice(reader.GetString(0), reader.IsDBNull(1) ? null : reader.GetString(1));
    }

    private async Task<List<ReturnItemResponse>> ValidateReturnItemsAsync(
        CreateReturnRequest request,
        CancellationToken cancellationToken)
    {
        var result = new List<ReturnItemResponse>();
        foreach (var item in request.Items.OrderBy(item => item.DrugId).ThenBy(item => item.BatchId))
        {
            await using var command = CreateCommand("""
                SELECT ii.Quantity, ii.UnitPrice, d.DrugCode, d.Name, b.BatchNo,
                       NVL((SELECT SUM(ri.Quantity)
                            FROM RETURNS r JOIN RETURN_ITEMS ri ON ri.ReturnId = r.id
                            WHERE r.InvoiceId = ii.InvoiceId
                              AND ri.DrugId = ii.DrugId
                              AND ri.BatchId = ii.BatchId
                              AND r.Status = 'COMPLETED'), 0)
                FROM INVOICE_ITEMS ii
                JOIN DRUGS d ON d.id = ii.DrugId
                JOIN DRUG_BATCHES b ON b.id = ii.BatchId
                WHERE ii.InvoiceId = :InvoiceId AND ii.DrugId = :DrugId AND ii.BatchId = :BatchId
                """);
            command.Parameters.Add("InvoiceId", OracleDbType.Varchar2, 50).Value = request.InvoiceId;
            command.Parameters.Add("DrugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
            command.Parameters.Add("BatchId", OracleDbType.Varchar2, 50).Value = item.BatchId;
            await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                throw new InvalidOperationException("Mặt hàng trả không tồn tại trong hóa đơn gốc.");

            var originalQuantity = reader.GetInt32(0);
            var returnedQuantity = Convert.ToInt32(reader.GetValue(5));
            if (item.Quantity > originalQuantity - returnedQuantity)
                throw new InvalidOperationException("Số lượng trả vượt quá số lượng còn được phép trả.");

            var unitPrice = reader.GetDecimal(1);
            result.Add(new ReturnItemResponse(
                item.DrugId, reader.GetString(2), reader.GetString(3), item.BatchId,
                reader.GetString(4), item.Quantity, unitPrice, item.Quantity * unitPrice,
                item.ActionType.Trim().ToUpperInvariant()));
        }
        return result;
    }

    private async Task<ExchangeInvoice> BuildExchangeInvoiceAsync(
        CreateReturnRequest request,
        string? customerId,
        string branchId,
        string cashierId,
        IReadOnlyDictionary<(string DrugId, string BatchId), Inventory> lockedInventory,
        CancellationToken cancellationToken)
    {
        if (!request.SettlementConfirmed)
            throw new InvalidOperationException("Phải xác nhận phương án thanh toán chênh lệch trước khi hoàn tất.");
        if (!string.Equals(request.PaymentMethod, "CASH", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Chỉ chấp nhận xử lý chênh lệch bằng tiền mặt trong giai đoạn hiện tại.");

        var now = VietnamTimeHelper.Now;
        var invoice = new Invoice(
            $"HD{now:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..24], branchId, cashierId, customerId: customerId);
        foreach (var item in request.ReplacementItems!.OrderBy(item => item.DrugId).ThenBy(item => item.BatchId))
        {
            var inventory = lockedInventory[(item.DrugId, item.BatchId)];
            if (item.Quantity > inventory.Quantity)
                throw new InvalidOperationException("Không đủ tồn kho cho lô thuốc đổi đã chọn.");
            var price = await GetSellableDrugPriceAsync(item.DrugId, item.BatchId, cancellationToken)
                ?? throw new InvalidOperationException("Thuốc hoặc lô thuốc đổi không còn đủ điều kiện bán.");
            inventory.DecreaseQuantity(item.Quantity);
            invoice.AddItem(new InvoiceItem(invoice.Id, item.DrugId, item.BatchId, item.Quantity, price));
        }

        invoice.MarkAsPaid("CASH");
        invoice.LockInvoice();
        InvoiceSignatureResult signed;
        try
        {
            signed = digitalSignatureService.SignInvoice(invoice);
        }
        catch (Exception exception)
        {
            throw new DigitalSignatureException("Invoice signing failed.", exception);
        }

        return new ExchangeInvoice(invoice, new DigitalSignature(
            invoice.Id, signed.HashValueSha256, signed.SignatureData, signed.CertificateSerial, signed.SignedAt));
    }

    private async Task<decimal?> GetSellableDrugPriceAsync(
        string drugId,
        string batchId,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand("""
            SELECT d.Price
            FROM DRUGS d
            JOIN DRUG_BATCHES b ON b.DrugId = d.id
            WHERE d.id = :DrugId AND b.id = :BatchId
              AND NVL(d.IsActive, 1) = 1
              AND b.ExpiryDate >= TRUNC(SYSDATE)
            """);
        command.Parameters.Add("DrugId", OracleDbType.Varchar2, 50).Value = drugId;
        command.Parameters.Add("BatchId", OracleDbType.Varchar2, 50).Value = batchId;
        var value = await command.ExecuteScalarAsync(cancellationToken);
        return value is null or DBNull ? null : Convert.ToDecimal(value);
    }

    private async Task InsertReturnAsync(
        string id,
        string returnNo,
        CreateReturnRequest request,
        string branchId,
        string cashierId,
        string? customerId,
        string? exchangeInvoiceId,
        decimal totalRefund,
        DateTime createdDate,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand("""
            INSERT INTO RETURNS (
                id, ReturnNo, InvoiceId, BranchId, CashierId, CustomerId, ExchangeInvoiceId,
                TotalRefundAmount, Reason, Status, CreatedDate)
            VALUES (
                :id, :ReturnNo, :InvoiceId, :BranchId, :CashierId, :CustomerId, :ExchangeInvoiceId,
                :TotalRefundAmount, :Reason, 'COMPLETED', :CreatedDate)
            """);
        command.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;
        command.Parameters.Add("ReturnNo", OracleDbType.Varchar2, 50).Value = returnNo;
        command.Parameters.Add("InvoiceId", OracleDbType.Varchar2, 50).Value = request.InvoiceId;
        command.Parameters.Add("BranchId", OracleDbType.Varchar2, 50).Value = branchId;
        command.Parameters.Add("CashierId", OracleDbType.Varchar2, 50).Value = cashierId;
        command.Parameters.Add("CustomerId", OracleDbType.Varchar2, 50).Value = (object?)customerId ?? DBNull.Value;
        command.Parameters.Add("ExchangeInvoiceId", OracleDbType.Varchar2, 50).Value = (object?)exchangeInvoiceId ?? DBNull.Value;
        command.Parameters.Add("TotalRefundAmount", OracleDbType.Decimal).Value = totalRefund;
        command.Parameters.Add("Reason", OracleDbType.Varchar2, 500).Value = request.Reason.Trim();
        command.Parameters.Add("CreatedDate", OracleDbType.TimeStamp).Value = createdDate;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task InsertReturnItemsAsync(
        string returnId,
        IEnumerable<ReturnItemResponse> items,
        CancellationToken cancellationToken)
    {
        foreach (var item in items)
        {
            await using var command = CreateCommand("""
                INSERT INTO RETURN_ITEMS (
                    ReturnId, DrugId, BatchId, Quantity, RefundPrice, SubTotal, ActionType)
                VALUES (
                    :ReturnId, :DrugId, :BatchId, :Quantity, :RefundPrice, :SubTotal, :ActionType)
                """);
            command.Parameters.Add("ReturnId", OracleDbType.Varchar2, 50).Value = returnId;
            command.Parameters.Add("DrugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
            command.Parameters.Add("BatchId", OracleDbType.Varchar2, 50).Value = item.BatchId;
            command.Parameters.Add("Quantity", OracleDbType.Int32).Value = item.Quantity;
            command.Parameters.Add("RefundPrice", OracleDbType.Decimal).Value = item.RefundPrice;
            command.Parameters.Add("SubTotal", OracleDbType.Decimal).Value = item.SubTotal;
            command.Parameters.Add("ActionType", OracleDbType.Varchar2, 20).Value = item.ActionType;
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    private async Task InsertInventoryTransactionAsync(
        string branchId,
        string drugId,
        string batchId,
        string transactionType,
        int quantityChange,
        int remainingQuantity,
        string createdBy,
        string note,
        DateTime createdDate,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand("""
            INSERT INTO INVENTORY_TRANSACTIONS (
                id, BranchId, DrugId, BatchId, TransactionType, QuantityChange,
                RemainingQuantity, CreatedBy, Note, CreatedDate)
            VALUES (
                :id, :BranchId, :DrugId, :BatchId, :TransactionType, :QuantityChange,
                :RemainingQuantity, :CreatedBy, :Note, :CreatedDate)
            """);
        command.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = $"tx-{Guid.NewGuid():N}";
        command.Parameters.Add("BranchId", OracleDbType.Varchar2, 50).Value = branchId;
        command.Parameters.Add("DrugId", OracleDbType.Varchar2, 50).Value = drugId;
        command.Parameters.Add("BatchId", OracleDbType.Varchar2, 50).Value = batchId;
        command.Parameters.Add("TransactionType", OracleDbType.Varchar2, 20).Value = transactionType;
        command.Parameters.Add("QuantityChange", OracleDbType.Int32).Value = quantityChange;
        command.Parameters.Add("RemainingQuantity", OracleDbType.Int32).Value = remainingQuantity;
        command.Parameters.Add("CreatedBy", OracleDbType.Varchar2, 50).Value = createdBy;
        command.Parameters.Add("Note", OracleDbType.Varchar2, 500).Value = note;
        command.Parameters.Add("CreatedDate", OracleDbType.TimeStamp).Value = createdDate;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task DecreaseCustomerTotalsAsync(
        string? customerId,
        decimal totalRefund,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(customerId))
            return;

        await using var command = CreateCommand("""
            UPDATE CUSTOMERS
            SET TotalSpent = GREATEST(0, TotalSpent - :Refund),
                Points = GREATEST(0, Points - :Points)
            WHERE id = :CustomerId
            """);
        command.Parameters.Add("Refund", OracleDbType.Decimal).Value = totalRefund;
        command.Parameters.Add("Points", OracleDbType.Int32).Value = (int)(totalRefund / 10000m);
        command.Parameters.Add("CustomerId", OracleDbType.Varchar2, 50).Value = customerId;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static void ValidateRequest(CreateReturnRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.InvoiceId) || string.IsNullOrWhiteSpace(request.Reason))
            throw new ArgumentException("Hóa đơn gốc và lý do là bắt buộc.", nameof(request));
        if (request.Items is null || request.Items.Count == 0 ||
            request.Items.Any(item => item.Quantity <= 0 || string.IsNullOrWhiteSpace(item.DrugId) || string.IsNullOrWhiteSpace(item.BatchId)))
            throw new ArgumentException("Danh sách thuốc trả không hợp lệ.", nameof(request));
        if (request.Items.GroupBy(item => (item.DrugId, item.BatchId)).Any(group => group.Count() > 1))
            throw new ArgumentException("Không được lặp lô thuốc trong danh sách trả.", nameof(request));

        foreach (var item in request.Items)
        {
            var action = item.ActionType.Trim().ToUpperInvariant();
            if (action is not ("RESTOCK" or "DISCARD"))
                throw new ArgumentException("Cách xử lý kho không hợp lệ.", nameof(request));
            if (action == "RESTOCK" && !item.RestockInspectionConfirmed)
                throw new ArgumentException("Phải xác nhận đã kiểm tra hàng trước khi nhập lại kho.", nameof(request));
        }

        var type = request.TransactionType.Trim().ToUpperInvariant();
        if (type is not ("RETURN" or "EXCHANGE"))
            throw new ArgumentException("Loại giao dịch không hợp lệ.", nameof(request));
        if (type == "EXCHANGE" &&
            (request.ReplacementItems is null || request.ReplacementItems.Count == 0 ||
             request.ReplacementItems.Any(item => item.Quantity <= 0 || string.IsNullOrWhiteSpace(item.DrugId) || string.IsNullOrWhiteSpace(item.BatchId))))
            throw new ArgumentException("Danh sách thuốc đổi mới không hợp lệ.", nameof(request));
        if (request.ReplacementItems?.GroupBy(item => (item.DrugId, item.BatchId)).Any(group => group.Count() > 1) == true)
            throw new ArgumentException("Không được lặp lô thuốc trong danh sách đổi mới.", nameof(request));
    }

    private OracleCommand CreateCommand(string sql)
    {
        if (unitOfWork.Transaction is not OracleTransaction transaction)
            throw new InvalidOperationException("Return workflow requires an active Oracle transaction.");
        var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
        command.Transaction = transaction;
        command.BindByName = true;
        command.CommandText = sql;
        return command;
    }

    private static ReturnResponse ReadReturn(OracleDataReader reader, IReadOnlyList<ReturnItemResponse> items)
    {
        var totalRefund = reader.GetDecimal(9);
        var exchangeInvoiceId = reader.IsDBNull(10) ? null : reader.GetString(10);
        var replacementTotal = reader.GetDecimal(12);
        var difference = replacementTotal - totalRefund;
        return new ReturnResponse(
            reader.GetString(0), reader.GetString(1), reader.GetString(2), reader.GetString(3),
            reader.GetString(4), reader.GetString(5), reader.GetString(6),
            reader.IsDBNull(7) ? null : reader.GetString(7),
            reader.IsDBNull(8) ? null : reader.GetString(8), totalRefund,
            exchangeInvoiceId, reader.IsDBNull(11) ? null : reader.GetString(11),
            replacementTotal, difference, exchangeInvoiceId is null ? "RETURN" : "EXCHANGE",
            ResolveSettlementStatus(exchangeInvoiceId is null, difference, reader.IsDBNull(13) ? null : reader.GetString(13)),
            reader.GetString(14), reader.GetString(15), reader.GetDateTime(16), items);
    }

    private static string ResolveSettlementStatus(bool returnOnly, decimal difference, string? paymentStatus)
    {
        if (returnOnly || difference < 0)
            return "REFUND_REQUIRED";
        if (difference == 0)
            return "NO_DIFFERENCE";
        return string.Equals(paymentStatus, "PAID", StringComparison.OrdinalIgnoreCase)
            ? "SETTLED"
            : "PAYMENT_PENDING";
    }

    private const string ReturnHeaderSql = """
        SELECT r.id, r.ReturnNo, r.InvoiceId, i.InvoiceNo, r.BranchId,
               r.CashierId, u.FullName, r.CustomerId, c.FullName,
               r.TotalRefundAmount, r.ExchangeInvoiceId, ei.InvoiceNo,
               NVL(ei.TotalAmount, 0), ei.PaymentStatus,
               r.Reason, r.Status, r.CreatedDate
        FROM RETURNS r
        JOIN INVOICES i ON i.id = r.InvoiceId
        JOIN USERS u ON u.id = r.CashierId
        LEFT JOIN CUSTOMERS c ON c.id = r.CustomerId
        LEFT JOIN INVOICES ei ON ei.id = r.ExchangeInvoiceId
        WHERE r.BranchId = :BranchId
        """;

    private sealed record OriginalInvoice(string InvoiceNo, string? CustomerId);

    private sealed record ExchangeInvoice(Invoice Invoice, DigitalSignature Signature);
}
