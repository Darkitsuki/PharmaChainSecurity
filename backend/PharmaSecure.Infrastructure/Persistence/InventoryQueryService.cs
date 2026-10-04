using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Common;
using PharmaSecure.Application.Features.Inventory;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class InventoryQueryService : IInventoryQueryService
{
    private readonly IUnitOfWork unitOfWork;

    public InventoryQueryService(IUnitOfWork unitOfWork)
    {
        this.unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<InventoryResponse>> GetPageAsync(
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
            var items = new List<InventoryResponse>();
            await using var command = CreateCommand("""
                SELECT BranchId, DrugId, BatchId, Quantity
                FROM INVENTORIES
                WHERE BranchId = :branchId
                ORDER BY DrugId, BatchId
                OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
                """);
            command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
            command.Parameters.Add("offset", OracleDbType.Int32).Value = (page - 1) * pageSize;
            command.Parameters.Add("pageSize", OracleDbType.Int32).Value = pageSize;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
                items.Add(new InventoryResponse(reader.GetString(0), reader.GetString(1), reader.GetString(2), reader.GetInt32(3)));

            await unitOfWork.CommitAsync(cancellationToken);
            return new PagedResult<InventoryResponse>(items, page, pageSize, totalCount);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<IReadOnlyCollection<InventoryAlertResponse>> GetExpiringSoonAsync(
        string branchId,
        int days = 90,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var items = new List<InventoryAlertResponse>();
            await using var command = CreateCommand("""
                SELECT i.BranchId, i.DrugId, d.DrugCode, d.Name, i.BatchId, b.BatchNo, b.ExpiryDate, i.Quantity
                FROM INVENTORIES i
                INNER JOIN DRUGS d ON d.id = i.DrugId
                INNER JOIN DRUG_BATCHES b ON b.id = i.BatchId
                WHERE i.BranchId = :branchId
                  AND b.ExpiryDate <= (SYSDATE + :days)
                ORDER BY b.ExpiryDate ASC
                """);
            command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
            command.Parameters.Add("days", OracleDbType.Int32).Value = days;

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(new InventoryAlertResponse(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.GetString(3),
                    reader.GetString(4),
                    reader.GetString(5),
                    reader.GetDateTime(6),
                    reader.GetInt32(7)));
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return items;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<IReadOnlyCollection<InventoryAlertResponse>> GetLowStockAsync(
        string branchId,
        int threshold = 10,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var items = new List<InventoryAlertResponse>();
            await using var command = CreateCommand("""
                SELECT i.BranchId, i.DrugId, d.DrugCode, d.Name, i.BatchId, b.BatchNo, b.ExpiryDate, i.Quantity
                FROM INVENTORIES i
                INNER JOIN DRUGS d ON d.id = i.DrugId
                INNER JOIN DRUG_BATCHES b ON b.id = i.BatchId
                WHERE i.BranchId = :branchId
                  AND i.Quantity <= :threshold
                ORDER BY i.Quantity ASC
                """);
            command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
            command.Parameters.Add("threshold", OracleDbType.Int32).Value = threshold;

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(new InventoryAlertResponse(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.GetString(3),
                    reader.GetString(4),
                    reader.GetString(5),
                    reader.GetDateTime(6),
                    reader.GetInt32(7)));
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return items;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<int> ExecuteCountAsync(string branchId, CancellationToken cancellationToken)
    {
        await using var command = CreateCommand("SELECT COUNT(*) FROM INVENTORIES WHERE BranchId = :branchId");
        command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
    }

    private OracleCommand CreateCommand(string commandText)
    {
        if (unitOfWork.Transaction is not OracleTransaction transaction)
            throw new InvalidOperationException("Inventory queries require an active Oracle transaction.");

        var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
        command.Transaction = transaction;
        command.BindByName = true;
        command.CommandText = commandText;
        return command;
    }
}