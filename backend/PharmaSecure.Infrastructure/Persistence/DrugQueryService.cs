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
        CancellationToken cancellationToken = default)
    {
        ValidatePage(page, pageSize);
        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            var totalCount = await ExecuteCountAsync(cancellationToken);
            var items = new List<DrugResponse>();
            await using var command = CreateCommand("""
                SELECT id, DrugCode, Name, ActiveIngredient, Unit, Price
                FROM DRUGS
                ORDER BY DrugCode
                OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
                """);
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

    private async Task<int> ExecuteCountAsync(CancellationToken cancellationToken)
    {
        await using var command = CreateCommand("SELECT COUNT(*) FROM DRUGS");
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