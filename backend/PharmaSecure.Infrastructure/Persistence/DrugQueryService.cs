using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Common;
using PharmaSecure.Application.Features.Security;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class DrugQueryService : IDrugQueryService
{
    private readonly IUnitOfWork unitOfWork;

    public DrugQueryService(IUnitOfWork unitOfWork)
    {
        this.unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<DrugResponse>> GetPageAsync(
        string branchId,
        int page,
        int pageSize,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        ValidatePage(page, pageSize);
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var hasSearch = !string.IsNullOrWhiteSpace(search);
            var searchPattern = hasSearch ? $"%{search!.Trim().ToUpperInvariant()}%" : string.Empty;
            var whereClause = hasSearch ? "WHERE (UPPER(Name) LIKE :search OR UPPER(DrugCode) LIKE :search OR UPPER(ActiveIngredient) LIKE :search)" : string.Empty;

            var totalCount = await ExecuteCountAsync(whereClause, hasSearch ? searchPattern : null, cancellationToken);
            var items = new List<DrugResponse>();
            await using var command = CreateCommand($"""
                SELECT id, DrugCode, Name, ActiveIngredient, Unit, Price
                FROM DRUGS
                {whereClause}
                ORDER BY DrugCode
                OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
                """);

            if (hasSearch)
                command.Parameters.Add("search", OracleDbType.Varchar2).Value = searchPattern;

            command.Parameters.Add("offset", OracleDbType.Int32).Value = (page - 1) * pageSize;
            command.Parameters.Add("pageSize", OracleDbType.Int32).Value = pageSize;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(new DrugResponse(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.IsDBNull(3) ? null : reader.GetString(3),
                    reader.GetString(4),
                    reader.GetDecimal(5)));
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return new PagedResult<DrugResponse>(items, page, pageSize, totalCount);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<DrugResponse?> GetByIdAsync(
        string branchId,
        string id,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            await using var command = CreateCommand("""
                SELECT id, DrugCode, Name, ActiveIngredient, Unit, Price
                FROM DRUGS
                WHERE id = :id
                """);
            command.Parameters.Add("id", OracleDbType.Varchar2, 50).Value = id;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                await unitOfWork.CommitAsync(cancellationToken);
                return null;
            }

            var result = new DrugResponse(
                reader.GetString(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.IsDBNull(3) ? null : reader.GetString(3),
                reader.GetString(4),
                reader.GetDecimal(5));

            await unitOfWork.CommitAsync(cancellationToken);
            return result;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<IReadOnlyCollection<DrugBatchResponse>> GetBatchesAsync(
        string branchId,
        string drugId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(drugId);
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var batches = new List<DrugBatchResponse>();
            await using var command = CreateCommand("""
                SELECT b.id, b.DrugId, b.BatchNo, b.MfgDate, b.ExpiryDate, NVL(inv.Quantity, 0)
                FROM DRUG_BATCHES b
                LEFT JOIN INVENTORIES inv ON b.id = inv.BatchId AND inv.BranchId = :branchId
                WHERE b.DrugId = :drugId
                ORDER BY b.ExpiryDate ASC
                """);
            command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
            command.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = drugId;

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                batches.Add(new DrugBatchResponse(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                    reader.GetDateTime(4),
                    reader.GetInt32(5)));
            }

            await unitOfWork.CommitAsync(cancellationToken);
            return batches;
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<int> ExecuteCountAsync(string whereClause, string? searchPattern, CancellationToken cancellationToken)
    {
        await using var command = CreateCommand($"SELECT COUNT(*) FROM DRUGS {whereClause}");
        if (!string.IsNullOrWhiteSpace(searchPattern))
            command.Parameters.Add("search", OracleDbType.Varchar2).Value = searchPattern;

        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
    }

    private OracleCommand CreateCommand(string commandText)
    {
        if (unitOfWork.Transaction is not OracleTransaction transaction)
            throw new InvalidOperationException("Drug queries require an active Oracle transaction.");

        var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
        command.Transaction = transaction;
        command.BindByName = true;
        command.CommandText = commandText;
        return command;
    }

    private static void ValidatePage(int page, int pageSize)
    {
        if (page < 1 || pageSize is < 1 or > 100)
            throw new ArgumentOutOfRangeException(nameof(pageSize));
    }
}