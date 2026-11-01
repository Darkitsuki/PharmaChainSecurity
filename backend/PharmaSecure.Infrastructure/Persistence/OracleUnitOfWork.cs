using System.Data;
using System.Data.Common;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class OracleUnitOfWork : IUnitOfWork
{
    private readonly IOracleConnectionFactory connectionFactory;
    private readonly ILogger<OracleUnitOfWork> logger;
    private OracleConnection? connection;
    private OracleTransaction? transaction;
    private string? branchId;

    public OracleUnitOfWork(
        IOracleConnectionFactory connectionFactory,
        ILogger<OracleUnitOfWork> logger)
    {
        this.connectionFactory = connectionFactory;
        this.logger = logger;
    }

    public DbConnection Connection => connection ?? throw new InvalidOperationException("The unit of work has not been started.");

    public DbTransaction? Transaction => transaction;

    public async Task BeginTransactionAsync(string branchId, CancellationToken cancellationToken = default)
    {
        if (transaction is not null)
            throw new InvalidOperationException("The unit of work has already been started.");

        if (connection is null)
        {
            connection = await connectionFactory.CreateOpenConnectionAsync(branchId, cancellationToken);
            this.branchId = branchId;
        }
        else if (!string.Equals(this.branchId, branchId, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("The unit of work cannot switch branches within the same request.");
        }

        transaction = (OracleTransaction)await connection.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
    }

    public async Task CommitAsync(CancellationToken cancellationToken = default)
    {
        EnsureTransaction();
        await transaction!.CommitAsync(cancellationToken);
        transaction.Dispose();
        transaction = null;
    }

    public async Task RollbackAsync(CancellationToken cancellationToken = default)
    {
        if (transaction is null)
            return;

        await transaction.RollbackAsync(cancellationToken);
        transaction.Dispose();
        transaction = null;
    }

    public async ValueTask DisposeAsync()
    {
        if (transaction is not null)
        {
            try
            {
                await transaction.RollbackAsync();
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "Failed to roll back the Oracle transaction while disposing the unit of work.");
            }

            await transaction.DisposeAsync();
            transaction = null;
        }

        if (connection is not null)
        {
            try
            {
                await connectionFactory.ClearSessionContextAsync(connection);
            }
            finally
            {
                await connection.DisposeAsync();
                connection = null;
                branchId = null;
            }
        }
    }

    private void EnsureTransaction()
    {
        if (transaction is null)
            throw new InvalidOperationException("The unit of work has not been started.");
    }
}
