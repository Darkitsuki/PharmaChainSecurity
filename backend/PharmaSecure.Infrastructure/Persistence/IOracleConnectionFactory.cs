using Oracle.ManagedDataAccess.Client;

namespace PharmaSecure.Infrastructure.Persistence;

public interface IOracleConnectionFactory
{
    Task<OracleConnection> CreateOpenConnectionAsync(
        string branchId,
        CancellationToken cancellationToken = default);

    Task<bool> PingAsync(CancellationToken cancellationToken = default);

    Task<OracleConnection> CreateAuthConnectionAsync(CancellationToken cancellationToken = default);

    Task ClearSessionContextAsync(
        OracleConnection connection,
        CancellationToken cancellationToken = default);
}