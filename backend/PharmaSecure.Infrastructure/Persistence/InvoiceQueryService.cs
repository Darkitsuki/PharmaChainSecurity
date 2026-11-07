using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Common;
using PharmaSecure.Application.Features.Invoices;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Entities;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class InvoiceQueryService : IInvoiceQueryService
{
    private readonly IUnitOfWork unitOfWork;
    private readonly IDigitalSignatureService digitalSignatureService;
    private readonly ILogger<InvoiceQueryService> logger;

    public InvoiceQueryService(
        IUnitOfWork unitOfWork,
        IDigitalSignatureService digitalSignatureService,
        ILogger<InvoiceQueryService> logger)
    {
        this.unitOfWork = unitOfWork;
        this.digitalSignatureService = digitalSignatureService;
        this.logger = logger;
    }

    public async Task<PagedResult<InvoiceResponse>> GetPageAsync(
        string branchId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));
        if (page < 1 || pageSize is < 1 or > 100)
            throw new ArgumentOutOfRangeException(nameof(pageSize));

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var totalCount = await ExecuteCountAsync(branchId, cancellationToken);
            var items = new List<InvoiceResponse>();
            await using var command = CreateCommand("""
                SELECT i.id, i.InvoiceNo, i.CreatedDate, i.TotalAmount, i.BranchId, i.CashierId,
                       NVL(i.Status, 'COMPLETED'),
                       NVL(i.PaymentMethod, 'CASH'), NVL(i.PaymentStatus, 'PAID'), NVL(i.PaidAmount, 0), i.PaidAt,
                       i.CancelledBy, u.FullName AS CancelledByName,
                       i.CancelledDate, i.CancelReason,
                       i.LastVerifiedAt, i.VerifiedBy, uv.FullName AS VerifiedByName, COALESCE(TRIM(cashier.FullName), cashier.Username) AS CashierName,
                       (SELECT NVL(ds.Status, 'VALID') FROM DIGITAL_SIGNATURES ds WHERE ds.InvoiceId = i.id) AS SignatureStatus
                FROM INVOICES i
                LEFT JOIN USERS u ON i.CancelledBy = u.id
                LEFT JOIN USERS uv ON i.VerifiedBy = uv.id
                LEFT JOIN USERS cashier ON i.CashierId = cashier.id
                WHERE i.BranchId = :branchId
                ORDER BY i.CreatedDate DESC, i.id DESC
                OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
                """);
            command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
            command.Parameters.Add("offset", OracleDbType.Int32).Value = (page - 1) * pageSize;
            command.Parameters.Add("pageSize", OracleDbType.Int32).Value = pageSize;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(new InvoiceResponse(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetDateTime(2),
                    reader.GetDecimal(3),
                    reader.GetString(4),
                    reader.GetString(5),
                    reader.IsDBNull(6) ? "COMPLETED" : reader.GetString(6),
                    reader.IsDBNull(7) ? "CASH" : reader.GetString(7),
                    reader.IsDBNull(8) ? "PAID" : reader.GetString(8),
                    reader.IsDBNull(9) ? 0 : reader.GetDecimal(9),
                    reader.IsDBNull(10) ? null : (DateTime?)reader.GetDateTime(10),
                    reader.IsDBNull(11) ? null : reader.GetString(11),
                    reader.IsDBNull(12) ? null : reader.GetString(12),
                    reader.IsDBNull(13) ? null : (DateTime?)reader.GetDateTime(13),
                    reader.IsDBNull(14) ? null : reader.GetString(14),
                    reader.IsDBNull(15) ? null : (DateTime?)reader.GetDateTime(15),
                    reader.IsDBNull(16) ? null : reader.GetString(16),
                    reader.IsDBNull(17) ? null : reader.GetString(17),
                    reader.IsDBNull(18) ? null : reader.GetString(18),
                    reader.IsDBNull(19) ? "MISSING" : reader.GetString(19)
                ));
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return new PagedResult<InvoiceResponse>(items, page, pageSize, totalCount);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<InvoiceDetailResponse?> GetByIdAsync(
        string branchId,
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("Invoice ID is required.", nameof(id));

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var result = await GetByIdInternalAsync(branchId, id, cancellationToken);
            await unitOfWork.CommitAsync(cancellationToken);
            return result;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<InvoiceDetailResponse?> GetByIdInternalAsync(
        string branchId,
        string id,
        CancellationToken cancellationToken)
    {
        await using var headerCommand = CreateCommand("""
            SELECT i.id, i.InvoiceNo, i.CreatedDate, i.TotalAmount, i.BranchId, i.CashierId,
                   i.CustomerId, c.FullName, c.PhoneNumber,
                   NVL(i.Status, 'COMPLETED'),
                   NVL(i.PaymentMethod, 'CASH'), NVL(i.PaymentStatus, 'PAID'), NVL(i.PaidAmount, 0), i.PaidAt,
                   i.CancelledBy, uc.FullName AS CancelledByName,
                   i.CancelledDate, i.CancelReason,
                   i.LastVerifiedAt, i.VerifiedBy, uv.FullName AS VerifiedByName, COALESCE(TRIM(cashier.FullName), cashier.Username) AS CashierName
            FROM INVOICES i
            LEFT JOIN CUSTOMERS c ON i.CustomerId = c.id
            LEFT JOIN USERS uc ON i.CancelledBy = uc.id
            LEFT JOIN USERS uv ON i.VerifiedBy = uv.id
            LEFT JOIN USERS cashier ON i.CashierId = cashier.id
            WHERE i.id = :id AND i.BranchId = :branchId
            """);
        headerCommand.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;
        headerCommand.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

        await using var headerReader = await headerCommand.ExecuteReaderAsync(cancellationToken);
        if (!await headerReader.ReadAsync(cancellationToken))
        {
            return null;
        }

        var invoiceId = headerReader.GetString(0);
        var invoiceNo = headerReader.GetString(1);
        var createdDate = headerReader.GetDateTime(2);
        var totalAmount = headerReader.GetDecimal(3);
        var bId = headerReader.GetString(4);
        var cashierId = headerReader.GetString(5);
        var custId = headerReader.IsDBNull(6) ? null : headerReader.GetString(6);
        var custName = headerReader.IsDBNull(7) ? null : headerReader.GetString(7);
        var custPhone = headerReader.IsDBNull(8) ? null : headerReader.GetString(8);
        var status = headerReader.IsDBNull(9) ? "COMPLETED" : headerReader.GetString(9);
        var paymentMethod = headerReader.IsDBNull(10) ? "CASH" : headerReader.GetString(10);
        var paymentStatus = headerReader.IsDBNull(11) ? "PAID" : headerReader.GetString(11);
        var paidAmount = headerReader.IsDBNull(12) ? 0 : headerReader.GetDecimal(12);
        var paidAt = headerReader.IsDBNull(13) ? null : (DateTime?)headerReader.GetDateTime(13);
        var cancelledById = headerReader.IsDBNull(14) ? null : headerReader.GetString(14);
        var cancelledByName = headerReader.IsDBNull(15) ? null : headerReader.GetString(15);
        var cancelledDate = headerReader.IsDBNull(16) ? null : (DateTime?)headerReader.GetDateTime(16);
        var cancelReason = headerReader.IsDBNull(17) ? null : headerReader.GetString(17);
        var lastVerifiedAt = headerReader.IsDBNull(18) ? null : (DateTime?)headerReader.GetDateTime(18);
        var verifiedById = headerReader.IsDBNull(19) ? null : headerReader.GetString(19);
        var verifiedByName = headerReader.IsDBNull(20) ? null : headerReader.GetString(20);
        var cashierName = headerReader.IsDBNull(21) ? null : headerReader.GetString(21);
        await headerReader.CloseAsync();

        var items = await QueryItemsInternalAsync(invoiceId, cancellationToken);
        var signature = await QuerySignatureInternalAsync(invoiceId, cancellationToken);

        return new InvoiceDetailResponse(
            invoiceId,
            invoiceNo,
            createdDate,
            totalAmount,
            bId,
            cashierId,
            items,
            signature,
            custId,
            custName,
            custPhone,
            status,
            paymentMethod,
            paymentStatus,
            paidAmount,
            paidAt,
            cancelledById,
            cancelledByName,
            cancelledDate,
            cancelReason,
            lastVerifiedAt,
            verifiedById,
            verifiedByName,
            cashierName);
    }

    public async Task<IReadOnlyCollection<InvoiceItemResponse>> GetItemsAsync(
        string branchId,
        string invoiceId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));
        if (string.IsNullOrWhiteSpace(invoiceId))
            throw new ArgumentException("Invoice ID is required.", nameof(invoiceId));

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            await using var checkCommand = CreateCommand("""
                SELECT COUNT(*) FROM INVOICES WHERE id = :invoiceId AND BranchId = :branchId
                """);
            checkCommand.Parameters.Add("invoiceId", OracleDbType.Varchar2, 50).Value = invoiceId;
            checkCommand.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

            var exists = Convert.ToInt32(await checkCommand.ExecuteScalarAsync(cancellationToken));
            if (exists == 0)
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return Array.Empty<InvoiceItemResponse>();
            }

            var items = await QueryItemsInternalAsync(invoiceId, cancellationToken);
            await unitOfWork.CommitAsync(cancellationToken);
            return items;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<InvoiceVerificationResult?> VerifyInvoiceSignatureAsync(
        string branchId,
        string invoiceId,
        string? verifiedById = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));
        if (string.IsNullOrWhiteSpace(invoiceId))
            throw new ArgumentException("Invoice ID is required.", nameof(invoiceId));

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            await using var headerCommand = CreateCommand("""
                SELECT id, InvoiceNo, CreatedDate, TotalAmount, BranchId, CashierId, NVL(Status, 'COMPLETED')
                FROM INVOICES
                WHERE id = :id AND BranchId = :branchId
                """);
            headerCommand.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = invoiceId;
            headerCommand.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

            await using var headerReader = await headerCommand.ExecuteReaderAsync(cancellationToken);
            if (!await headerReader.ReadAsync(cancellationToken))
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return null;
            }

            var invId = headerReader.GetString(0);
            var invNo = headerReader.GetString(1);
            var createdDate = DateTime.SpecifyKind(headerReader.GetDateTime(2), DateTimeKind.Unspecified);
            var storedTotalAmount = headerReader.GetDecimal(3);
            var bId = headerReader.GetString(4);
            var cashierId = headerReader.GetString(5);
            var invStatus = headerReader.GetString(6);
            await headerReader.CloseAsync();

            var invoice = new Invoice(invNo, bId, cashierId, createdDate, invId);

            await using var itemsCommand = CreateCommand("""
                SELECT DrugId, BatchId, Quantity, UnitPrice, SubTotal
                FROM INVOICE_ITEMS
                WHERE InvoiceId = :invoiceId
                """);
            itemsCommand.Parameters.Add("invoiceId", OracleDbType.Varchar2, 50).Value = invoiceId;
            await using var itemsReader = await itemsCommand.ExecuteReaderAsync(cancellationToken);
            var lineTotalsMatch = true;
            while (await itemsReader.ReadAsync(cancellationToken))
            {
                var drugId = itemsReader.GetString(0);
                var batchId = itemsReader.GetString(1);
                var quantity = itemsReader.GetInt32(2);
                var unitPrice = itemsReader.GetDecimal(3);
                lineTotalsMatch &= itemsReader.GetDecimal(4) == quantity * unitPrice;
                invoice.AddItem(new InvoiceItem(invId, drugId, batchId, quantity, unitPrice));
            }
            await itemsReader.CloseAsync();

            invoice.MarkAsPaid();
            invoice.LockInvoice();

            await using var sigCommand = CreateCommand("""
                SELECT HashValue_SHA256, SignatureData, CertSerial, SignedAt, NVL(Status, 'VALID'), RevokedAt, RevokedReason
                FROM DIGITAL_SIGNATURES
                WHERE InvoiceId = :invoiceId
                """);
            sigCommand.Parameters.Add("invoiceId", OracleDbType.Varchar2, 50).Value = invoiceId;
            await using var sigReader = await sigCommand.ExecuteReaderAsync(cancellationToken);
            if (!await sigReader.ReadAsync(cancellationToken))
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return new InvoiceVerificationResult(
                    invId,
                    invNo,
                    false,
                    string.Empty,
                    string.Empty,
                    string.Empty,
                    DateTime.MinValue,
                    "No digital signature record found for this invoice.", VerificationStatus: "MISSING");
            }

            var storedHash = sigReader.GetString(0);
            var signatureData = sigReader.GetString(1);
            var certSerial = sigReader.GetString(2);
            var signedAt = sigReader.GetDateTime(3);
            var sigStatus = sigReader.GetString(4);
            var revokedAt = sigReader.IsDBNull(5) ? (DateTime?)null : sigReader.GetDateTime(5);
            var revokedReason = sigReader.IsDBNull(6) ? null : sigReader.GetString(6);
            await sigReader.CloseAsync();

            if (string.Equals(sigStatus, "REVOKED", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(invStatus, "CANCELLED", StringComparison.OrdinalIgnoreCase))
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return new InvoiceVerificationResult(
                    invId,
                    invNo,
                    false,
                    storedHash,
                    storedHash,
                    certSerial,
                    signedAt,
                    $"CẢNH BÁO: Hóa đơn đã bị HỦY và Chữ ký số đã bị THU HỒI vào {revokedAt:dd/MM/yyyy HH:mm}. Lý do: {revokedReason ?? "Không có"}", VerificationStatus: "REVOKED");
            }

            var digitalSignature = new DigitalSignature(invId, storedHash, signatureData, certSerial, signedAt);
            var isValid = lineTotalsMatch && invoice.TotalAmount == storedTotalAmount &&
                digitalSignatureService.VerifyIntegrity(invoice, digitalSignature);

            DateTime? lastVerifiedAt = null;
            string? verifiedByName = null;
            if (isValid && !string.IsNullOrWhiteSpace(verifiedById))
            {
                await using var updateVerifiedCmd = CreateCommand("""
                    UPDATE INVOICES
                    SET LastVerifiedAt = CURRENT_TIMESTAMP,
                        VerifiedBy = :verifiedBy
                    WHERE id = :id AND BranchId = :branchId
                    """);
                updateVerifiedCmd.Parameters.Add("verifiedBy", OracleDbType.Varchar2, 50).Value = verifiedById;
                updateVerifiedCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = invoiceId;
                updateVerifiedCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                await updateVerifiedCmd.ExecuteNonQueryAsync(cancellationToken);

                await using var userCmd = CreateCommand("""
                    SELECT i.LastVerifiedAt, u.FullName FROM INVOICES i
                    LEFT JOIN USERS u ON i.VerifiedBy = u.id
                    WHERE i.id = :id AND i.BranchId = :branchId
                    """);
                userCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = invoiceId;
                userCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                await using var userReader = await userCmd.ExecuteReaderAsync(cancellationToken);
                if (await userReader.ReadAsync(cancellationToken))
                {
                    lastVerifiedAt = userReader.IsDBNull(0) ? null : userReader.GetDateTime(0);
                    verifiedByName = userReader.IsDBNull(1) ? null : userReader.GetString(1);
                }
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return new InvoiceVerificationResult(
                invId,
                invNo,
                isValid,
                Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(
                    System.Text.Encoding.UTF8.GetBytes(invoice.GetCanonicalPayload()))).ToLowerInvariant(),
                storedHash,
                certSerial,
                signedAt,
                isValid ? "Digital signature is valid and untampered." : "The invoice data or signature does not match the configured verification key. This result alone cannot identify which has changed.",
                lastVerifiedAt,
                verifiedByName,
                isValid ? "VALID" : "INVALID");
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<InvoiceDetailResponse> CancelInvoiceAsync(
        string branchId,
        string invoiceId,
        string ownerId,
        CancelInvoiceRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));
        if (string.IsNullOrWhiteSpace(invoiceId))
            throw new ArgumentException("Invoice ID is required.", nameof(invoiceId));
        if (string.IsNullOrWhiteSpace(request?.Reason))
            throw new InvalidOperationException("Lý do hủy hóa đơn là bắt buộc.");

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            // 1. Lock invoice and verify status
            await using var lockCommand = CreateCommand("""
                SELECT InvoiceNo, Status
                FROM INVOICES
                WHERE id = :id AND BranchId = :branchId
                FOR UPDATE
                """);
            lockCommand.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = invoiceId;
            lockCommand.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

            string invoiceNo;
            string status;
            await using (var reader = await lockCommand.ExecuteReaderAsync(cancellationToken))
            {
                if (!await reader.ReadAsync(cancellationToken))
                    throw new InvalidOperationException("Không tìm thấy hóa đơn tại chi nhánh.");

                invoiceNo = reader.GetString(0);
                status = reader.IsDBNull(1) ? "COMPLETED" : reader.GetString(1);
            }

            if (string.Equals(status, "CANCELLED", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Hóa đơn {invoiceNo} đã bị hủy từ trước, không thể hủy lại.");

            // 2. Update INVOICES status to CANCELLED
            await using var updateInvCommand = CreateCommand("""
                UPDATE INVOICES
                SET Status = 'CANCELLED',
                    CancelledBy = :cancelledBy,
                    CancelledDate = CURRENT_TIMESTAMP,
                    CancelReason = :cancelReason
                WHERE id = :id AND BranchId = :branchId
                """);
            updateInvCommand.Parameters.Add("cancelledBy", OracleDbType.Varchar2, 50).Value = ownerId;
            updateInvCommand.Parameters.Add("cancelReason", OracleDbType.Varchar2, 500).Value = request.Reason.Trim();
            updateInvCommand.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = invoiceId;
            updateInvCommand.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
            await updateInvCommand.ExecuteNonQueryAsync(cancellationToken);

            // 3. Restore Stock for each invoice item & record INVENTORY_TRANSACTIONS
            await using var itemsCommand = CreateCommand("""
                SELECT DrugId, BatchId, Quantity
                FROM INVOICE_ITEMS
                WHERE InvoiceId = :invoiceId
                """);
            itemsCommand.Parameters.Add("invoiceId", OracleDbType.Varchar2, 50).Value = invoiceId;

            var itemsToRestore = new List<(string DrugId, string BatchId, int Quantity)>();
            await using (var reader = await itemsCommand.ExecuteReaderAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    itemsToRestore.Add((reader.GetString(0), reader.GetString(1), reader.GetInt32(2)));
                }
            }

            foreach (var item in itemsToRestore)
            {
                // Increase stock in INVENTORIES
                await using var restoreStockCmd = CreateCommand("""
                    UPDATE INVENTORIES
                    SET Quantity = Quantity + :quantity
                    WHERE BranchId = :branchId AND DrugId = :drugId AND BatchId = :batchId
                    """);
                restoreStockCmd.Parameters.Add("quantity", OracleDbType.Int32).Value = item.Quantity;
                restoreStockCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                restoreStockCmd.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
                restoreStockCmd.Parameters.Add("batchId", OracleDbType.Varchar2, 50).Value = item.BatchId;
                await restoreStockCmd.ExecuteNonQueryAsync(cancellationToken);

                // Fetch new remaining balance
                await using var checkStockCmd = CreateCommand("""
                    SELECT Quantity
                    FROM INVENTORIES
                    WHERE BranchId = :branchId AND DrugId = :drugId AND BatchId = :batchId
                    """);
                checkStockCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                checkStockCmd.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
                checkStockCmd.Parameters.Add("batchId", OracleDbType.Varchar2, 50).Value = item.BatchId;
                var remainingQuantity = Convert.ToInt32(await checkStockCmd.ExecuteScalarAsync(cancellationToken));

                // Insert into INVENTORY_TRANSACTIONS
                await using var txCmd = CreateCommand("""
                    INSERT INTO INVENTORY_TRANSACTIONS (
                        id, BranchId, DrugId, BatchId, TransactionType,
                        QuantityChange, RemainingQuantity, CreatedBy, CreatedDate, Note
                    ) VALUES (
                        :id, :branchId, :drugId, :batchId, 'HOAN_HUY',
                        :quantityChange, :remainingQuantity, :createdBy, CURRENT_TIMESTAMP, :note
                    )
                    """);
                txCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = $"tx-{Guid.NewGuid():N}";
                txCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                txCmd.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = item.DrugId;
                txCmd.Parameters.Add("batchId", OracleDbType.Varchar2, 50).Value = item.BatchId;
                txCmd.Parameters.Add("quantityChange", OracleDbType.Int32).Value = item.Quantity;
                txCmd.Parameters.Add("remainingQuantity", OracleDbType.Int32).Value = remainingQuantity;
                txCmd.Parameters.Add("createdBy", OracleDbType.Varchar2, 50).Value = ownerId;
                txCmd.Parameters.Add("note", OracleDbType.Varchar2, 500).Value = $"Hoàn tồn do hủy hóa đơn {invoiceNo}: {request.Reason.Trim()}";
                await txCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // 4. Revoke Digital Signature
            await using var revokeSigCmd = CreateCommand("""
                UPDATE DIGITAL_SIGNATURES
                SET Status = 'REVOKED',
                    RevokedAt = CURRENT_TIMESTAMP,
                    RevokedReason = :revokedReason
                WHERE InvoiceId = :invoiceId
                """);
            revokeSigCmd.Parameters.Add("revokedReason", OracleDbType.Varchar2, 500).Value = request.Reason.Trim();
            revokeSigCmd.Parameters.Add("invoiceId", OracleDbType.Varchar2, 50).Value = invoiceId;
            await revokeSigCmd.ExecuteNonQueryAsync(cancellationToken);

            var updatedDetail = (await GetByIdInternalAsync(branchId, invoiceId, cancellationToken))!;

            await unitOfWork.CommitAsync(cancellationToken);
            logger.LogInformation("Invoice {InvoiceNo} ({InvoiceId}) successfully cancelled by owner {OwnerId}. Stock restored and signature revoked.",
                invoiceNo, invoiceId, ownerId);
            return updatedDetail;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<List<InvoiceItemResponse>> QueryItemsInternalAsync(string invoiceId, CancellationToken cancellationToken)
    {
        var items = new List<InvoiceItemResponse>();
        await using var command = CreateCommand("""
            SELECT ii.DrugId, d.DrugCode, d.Name, ii.BatchId, ii.Quantity, ii.UnitPrice, ii.SubTotal, b.BatchNo
            FROM INVOICE_ITEMS ii
            INNER JOIN DRUGS d ON ii.DrugId = d.id
            LEFT JOIN DRUG_BATCHES b ON ii.BatchId = b.id
            WHERE ii.InvoiceId = :invoiceId
            ORDER BY d.DrugCode
            """);
        command.Parameters.Add("invoiceId", OracleDbType.Varchar2, 50).Value = invoiceId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new InvoiceItemResponse(
                reader.GetString(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.GetInt32(4),
                reader.GetDecimal(5),
                reader.GetDecimal(6),
                reader.IsDBNull(7) ? null : reader.GetString(7)));
        }

        return items;
    }

    private async Task<InvoiceSignatureResponse?> QuerySignatureInternalAsync(string invoiceId, CancellationToken cancellationToken)
    {
        await using var command = CreateCommand("""
            SELECT HashValue_SHA256, SignatureData, CertSerial, SignedAt, NVL(Status, 'VALID'), RevokedAt, RevokedReason
            FROM DIGITAL_SIGNATURES
            WHERE InvoiceId = :invoiceId
            """);
        command.Parameters.Add("invoiceId", OracleDbType.Varchar2, 50).Value = invoiceId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
            return null;

        return new InvoiceSignatureResponse(
            reader.GetString(0),
            reader.GetString(1),
            reader.GetString(2),
            reader.GetDateTime(3),
            reader.IsDBNull(4) ? "VALID" : reader.GetString(4),
            reader.IsDBNull(5) ? null : (DateTime?)reader.GetDateTime(5),
            reader.IsDBNull(6) ? null : reader.GetString(6));
    }

    private async Task<int> ExecuteCountAsync(string branchId, CancellationToken cancellationToken)
    {
        await using var command = CreateCommand("SELECT COUNT(*) FROM INVOICES WHERE BranchId = :branchId");
        command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
    }

    private OracleCommand CreateCommand(string commandText)
    {
        if (unitOfWork.Transaction is not OracleTransaction transaction)
            throw new InvalidOperationException("Invoice queries require an active Oracle transaction.");

        var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
        command.Transaction = transaction;
        command.BindByName = true;
        command.CommandText = commandText;
        return command;
    }

    public async Task<InvoiceDetailResponse> ConfirmPaymentAsync(
        string branchId,
        string invoiceId,
        string cashierId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));
        if (string.IsNullOrWhiteSpace(invoiceId))
            throw new ArgumentException("Invoice ID is required.", nameof(invoiceId));

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            await using var lockCommand = CreateCommand("""
                SELECT InvoiceNo, Status, NVL(PaymentStatus, 'PAID'), TotalAmount, NVL(PaymentMethod, 'CASH')
                FROM INVOICES
                WHERE id = :id AND BranchId = :branchId
                FOR UPDATE
                """);
            lockCommand.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = invoiceId;
            lockCommand.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

            string invoiceNo;
            string status;
            string paymentStatus;
            string paymentMethod;
            decimal totalAmount;
            await using (var reader = await lockCommand.ExecuteReaderAsync(cancellationToken))
            {
                if (!await reader.ReadAsync(cancellationToken))
                    throw new InvalidOperationException("Không tìm thấy hóa đơn tại chi nhánh.");

                invoiceNo = reader.GetString(0);
                status = reader.IsDBNull(1) ? "COMPLETED" : reader.GetString(1);
                paymentStatus = reader.GetString(2);
                totalAmount = reader.GetDecimal(3);
                paymentMethod = reader.GetString(4);
            }

            if (string.Equals(status, "CANCELLED", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Hóa đơn {invoiceNo} đã bị hủy, không thể thu tiền.");

            if (string.Equals(paymentStatus, "PAID", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Hóa đơn {invoiceNo} đã được thanh toán từ trước.");

            if (!string.Equals(paymentMethod, "CASH", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Chuyển khoản chỉ được xác nhận qua kênh đối soát ngân hàng đã cấu hình.");

            await using var updateCmd = CreateCommand("""
                UPDATE INVOICES
                SET PaymentStatus = 'PAID',
                    PaidAmount = TotalAmount,
                    PaidAt = CURRENT_TIMESTAMP
                WHERE id = :id AND BranchId = :branchId
                """);
            updateCmd.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = invoiceId;
            updateCmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
            await updateCmd.ExecuteNonQueryAsync(cancellationToken);

            var result = await GetByIdInternalAsync(branchId, invoiceId, cancellationToken);
            await unitOfWork.CommitAsync(cancellationToken);
            return result!;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }


    public async Task<IReadOnlyCollection<PatientOrderSummaryDto>> GetPatientOrdersAsync(
        string phoneNumber,
        string? branchId = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return Array.Empty<PatientOrderSummaryDto>();

        var cleanPhone = phoneNumber.Trim();
        var resolvedBranchId = !string.IsNullOrWhiteSpace(branchId)
            ? branchId.Trim()
            : "br-00000000-0000-0000-0000-000000000001";

        await unitOfWork.BeginTransactionAsync(resolvedBranchId, cancellationToken);
        try
        {
            var orders = new List<PatientOrderSummaryDto>();
            await using var command = CreateCommand("""
                SELECT i.id, i.InvoiceNo, i.CreatedDate, i.TotalAmount, i.BranchId, b.Name AS BranchName,
                       NVL(i.Status, 'COMPLETED'),
                       NVL(i.PaymentMethod, 'CASH'), NVL(i.PaymentStatus, 'PAID'), NVL(i.PaidAmount, 0), i.PaidAt,
                       i.CancelReason, i.CancelledDate,
                       ds.HashValue_SHA256,
                       c.FullName AS CustomerName,
                       c.PhoneNumber,
                       c.Address AS DeliveryAddress
                FROM INVOICES i
                JOIN BRANCHES b ON i.BranchId = b.id
                JOIN CUSTOMERS c ON i.CustomerId = c.id
                LEFT JOIN DIGITAL_SIGNATURES ds ON ds.InvoiceId = i.id
                WHERE c.PhoneNumber = :phone
                ORDER BY i.CreatedDate DESC
                """);
            command.Parameters.Add("phone", OracleDbType.Varchar2, 20).Value = cleanPhone;

            await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    orders.Add(new PatientOrderSummaryDto(
                        reader.GetString(0),
                        reader.GetString(1),
                        reader.GetDateTime(2),
                        reader.GetDecimal(3),
                        reader.GetString(4),
                        reader.GetString(5),
                        reader.GetString(6),
                        reader.GetString(7),
                        reader.GetString(8),
                        reader.GetDecimal(9),
                        reader.IsDBNull(10) ? null : (DateTime?)reader.GetDateTime(10),
                        reader.IsDBNull(11) ? null : reader.GetString(11),
                        reader.IsDBNull(12) ? null : (DateTime?)reader.GetDateTime(12),
                        reader.IsDBNull(13) ? null : reader.GetString(13),
                        reader.IsDBNull(14) ? null : reader.GetString(14),
                        reader.IsDBNull(15) ? null : reader.GetString(15),
                        reader.IsDBNull(16) ? null : reader.GetString(16),
                        Array.Empty<PatientOrderItemDto>()
                    ));
                }
            }

            if (orders.Count > 0)
            {
                var ordersWithItems = new List<PatientOrderSummaryDto>();
                foreach (var order in orders)
                {
                    await using var itemsCmd = CreateCommand("""
                        SELECT ii.DrugId, d.DrugCode, d.Name, ii.BatchId, ii.Quantity, ii.UnitPrice, ii.SubTotal
                        FROM INVOICE_ITEMS ii
                        JOIN DRUGS d ON ii.DrugId = d.id
                        WHERE ii.InvoiceId = :invoiceId
                        ORDER BY d.Name
                        """);
                    itemsCmd.Parameters.Add("invoiceId", OracleDbType.Varchar2, 50).Value = order.InvoiceId;

                    var items = new List<PatientOrderItemDto>();
                    await using (var itemReader = await itemsCmd.ExecuteReaderAsync(cancellationToken))
                    {
                        while (await itemReader.ReadAsync(cancellationToken))
                        {
                            items.Add(new PatientOrderItemDto(
                                itemReader.GetString(0),
                                itemReader.GetString(1),
                                itemReader.GetString(2),
                                itemReader.GetString(3),
                                itemReader.GetInt32(4),
                                itemReader.GetDecimal(5),
                                itemReader.GetDecimal(6)
                            ));
                        }
                    }

                    ordersWithItems.Add(order with { Items = items });
                }
                orders = ordersWithItems;
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return orders;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

}
