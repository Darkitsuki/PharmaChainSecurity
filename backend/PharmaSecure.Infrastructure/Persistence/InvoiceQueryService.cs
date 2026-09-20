using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Common;
using PharmaSecure.Application.Features.Invoices;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class InvoiceQueryService : IInvoiceQueryService
{
    private readonly IUnitOfWork unitOfWork;

    public InvoiceQueryService(IUnitOfWork unitOfWork)
    {
        this.unitOfWork = unitOfWork;
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