using System.Data;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Entities;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class InventoryRepository : IInventoryRepository
{
    private readonly IUnitOfWork unitOfWork;

    public InventoryRepository(IUnitOfWork unitOfWork)
    {
        this.unitOfWork = unitOfWork;
    }

    public async Task<Inventory?> LockRowForUpdateAsync(
        string branchId,
        string drugId,
        string batchId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));
        if (string.IsNullOrWhiteSpace(drugId))
            throw new ArgumentException("Drug ID is required.", nameof(drugId));
        if (string.IsNullOrWhiteSpace(batchId))
            throw new ArgumentException("Batch ID is required.", nameof(batchId));
        if (unitOfWork.Transaction is not OracleTransaction transaction)
            throw new InvalidOperationException("Inventory row locking requires an active Oracle transaction.");

        await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
        command.Transaction = transaction;
        command.BindByName = true;
        command.CommandText = """
            SELECT BranchId, DrugId, BatchId, Quantity
            FROM INVENTORIES
            WHERE BranchId = :branchId
              AND DrugId = :drugId
              AND BatchId = :batchId
            FOR UPDATE
            """;
        command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
        command.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = drugId;
        command.Parameters.Add("batchId", OracleDbType.Varchar2, 50).Value = batchId;

        await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
            return null;

        return new Inventory(
            reader.GetString(0),
            reader.GetString(1),
            reader.GetString(2),
            reader.GetInt32(3));
    }

    public async Task UpdateQuantityAsync(
        Inventory inventory,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(inventory);
        if (unitOfWork.Transaction is not OracleTransaction transaction)
            throw new InvalidOperationException("Inventory updates require an active Oracle transaction.");

        await using var command = (OracleCommand)unitOfWork.Connection.CreateCommand();
        command.Transaction = transaction;
        command.BindByName = true;
        command.CommandText = """
            UPDATE INVENTORIES
            SET Quantity = :quantity
            WHERE BranchId = :branchId
              AND DrugId = :drugId
              AND BatchId = :batchId
            """;
        command.Parameters.Add("quantity", OracleDbType.Int32).Value = inventory.Quantity;
        command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = inventory.BranchId;
        command.Parameters.Add("drugId", OracleDbType.Varchar2, 50).Value = inventory.DrugId;
        command.Parameters.Add("batchId", OracleDbType.Varchar2, 50).Value = inventory.BatchId;

        if (await command.ExecuteNonQueryAsync(cancellationToken) != 1)
            throw new InvalidOperationException("Inventory row was not updated.");
    }
}