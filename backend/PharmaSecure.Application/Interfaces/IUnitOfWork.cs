using System.Data.Common;

namespace PharmaSecure.Application.Interfaces;

public interface IUnitOfWork : IAsyncDisposable
{
    DbConnection Connection { get; }

    DbTransaction? Transaction { get; }

    Task BeginTransactionAsync(string branchId, CancellationToken cancellationToken = default);

    Task CommitAsync(CancellationToken cancellationToken = default);

    Task RollbackAsync(CancellationToken cancellationToken = default);
}