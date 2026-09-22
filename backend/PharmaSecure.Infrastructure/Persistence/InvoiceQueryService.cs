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

    public InvoiceQueryService(
        IUnitOfWork unitOfWork,
        IDigitalSignatureService digitalSignatureService)
    {
        this.unitOfWork = unitOfWork;
        this.digitalSignatureService = digitalSignatureService;
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
                SELECT id, InvoiceNo, CreatedDate, TotalAmount, BranchId, CashierId
                FROM INVOICES
                WHERE BranchId = :branchId
                ORDER BY CreatedDate DESC, id DESC
                OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
                """);
            command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
            command.Parameters.Add("offset", OracleDbType.Int32).Value = (page - 1) * pageSize;
            command.Parameters.Add("pageSize", OracleDbType.Int32).Value = pageSize;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
                items.Add(new InvoiceResponse(reader.GetString(0), reader.GetString(1), reader.GetDateTime(2), reader.GetDecimal(3), reader.GetString(4), reader.GetString(5)));

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
            await using var headerCommand = CreateCommand("""
                SELECT id, InvoiceNo, CreatedDate, TotalAmount, BranchId, CashierId
                FROM INVOICES
                WHERE id = :id AND BranchId = :branchId
                """);
            headerCommand.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;
            headerCommand.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

            await using var headerReader = await headerCommand.ExecuteReaderAsync(cancellationToken);
            if (!await headerReader.ReadAsync(cancellationToken))
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return null;
            }

            var invoiceId = headerReader.GetString(0);
            var invoiceNo = headerReader.GetString(1);
            var createdDate = headerReader.GetDateTime(2);
            var totalAmount = headerReader.GetDecimal(3);
            var bId = headerReader.GetString(4);
            var cashierId = headerReader.GetString(5);
            await headerReader.CloseAsync();

            var items = await QueryItemsInternalAsync(invoiceId, cancellationToken);
            var signature = await QuerySignatureInternalAsync(invoiceId, cancellationToken);

            await unitOfWork.CommitAsync(cancellationToken);
            return new InvoiceDetailResponse(
                invoiceId,
                invoiceNo,
                createdDate,
                totalAmount,
                bId,
                cashierId,
                items,
                signature);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
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
                SELECT id, InvoiceNo, CreatedDate, TotalAmount, BranchId, CashierId
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
            var createdDate = headerReader.GetDateTime(2);
            var bId = headerReader.GetString(4);
            var cashierId = headerReader.GetString(5);
            await headerReader.CloseAsync();

            var invoice = new Invoice(invNo, bId, cashierId, createdDate, invId);

            await using var itemsCommand = CreateCommand("""
                SELECT DrugId, BatchId, Quantity, UnitPrice
                FROM INVOICE_ITEMS
                WHERE InvoiceId = :invoiceId
                """);
            itemsCommand.Parameters.Add("invoiceId", OracleDbType.Varchar2, 50).Value = invoiceId;
            await using var itemsReader = await itemsCommand.ExecuteReaderAsync(cancellationToken);
            while (await itemsReader.ReadAsync(cancellationToken))
            {
                var drugId = itemsReader.GetString(0);
                var batchId = itemsReader.GetString(1);
                var quantity = itemsReader.GetInt32(2);
                var unitPrice = itemsReader.GetDecimal(3);
                invoice.AddItem(new InvoiceItem(invId, drugId, batchId, quantity, unitPrice));
            }
            await itemsReader.CloseAsync();

            invoice.MarkAsPaid();
            invoice.LockInvoice();

            await using var sigCommand = CreateCommand("""
                SELECT HashValue_SHA256, SignatureData, CertSerial, SignedAt
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
                    "No digital signature record found for this invoice.");
            }

            var storedHash = sigReader.GetString(0);
            var signatureData = sigReader.GetString(1);
            var certSerial = sigReader.GetString(2);
            var signedAt = sigReader.GetDateTime(3);
            await sigReader.CloseAsync();

            var digitalSignature = new DigitalSignature(invId, storedHash, signatureData, certSerial, signedAt);
            var isValid = digitalSignatureService.VerifyIntegrity(invoice, digitalSignature);

            await unitOfWork.CommitAsync(cancellationToken);
            return new InvoiceVerificationResult(
                invId,
                invNo,
                isValid,
                isValid ? storedHash : "Hash mismatch detected upon verification",
                storedHash,
                certSerial,
                signedAt,
                isValid ? "Digital signature is valid and untampered." : "Invoice data has been tampered with or signature is invalid.");
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
            SELECT ii.DrugId, d.DrugCode, d.Name, ii.BatchId, ii.Quantity, ii.UnitPrice, ii.SubTotal
            FROM INVOICE_ITEMS ii
            INNER JOIN DRUGS d ON ii.DrugId = d.id
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
                reader.GetDecimal(6)));
        }

        return items;
    }

    private async Task<InvoiceSignatureResponse?> QuerySignatureInternalAsync(string invoiceId, CancellationToken cancellationToken)
    {
        await using var command = CreateCommand("""
            SELECT HashValue_SHA256, SignatureData, CertSerial, SignedAt
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
            reader.GetDateTime(3));
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
}