using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class OracleConnectionFactory : IOracleConnectionFactory
{
    private static readonly Regex EnvironmentPlaceholder = new(@"\$\{(?<name>[A-Za-z_][A-Za-z0-9_]*)\}", RegexOptions.Compiled);
    private readonly string connectionString;
    private readonly IBranchContextAccessor branchContextAccessor;
    private readonly ICurrentUserContext currentUserContext;

    public OracleConnectionFactory(
        IConfiguration configuration,
        IBranchContextAccessor branchContextAccessor,
        ICurrentUserContext currentUserContext)
    {
        this.branchContextAccessor = branchContextAccessor;
        this.currentUserContext = currentUserContext;
        var configuredConnectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(configuredConnectionString))
            throw new InvalidOperationException("ConnectionStrings:DefaultConnection must be configured.");

        connectionString = ExpandEnvironmentPlaceholders(configuredConnectionString);
    }

    public async Task<OracleConnection> CreateOpenConnectionAsync(
        string branchId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required to initialize the Oracle session context.", nameof(branchId));
        if (branchContextAccessor.BranchId is not null &&
            !string.Equals(branchContextAccessor.BranchId, branchId, StringComparison.Ordinal))
            throw new InvalidOperationException("The requested database branch does not match the authenticated branch context.");

        var sessionContext = GetAuthenticatedSessionContext(branchId);

        var connection = new OracleConnection(connectionString);
        try
        {
            await connection.OpenAsync(cancellationToken);
            await SetSessionContextAsync(connection, sessionContext, cancellationToken);
            return connection;
        }
        catch
        {
            OracleConnection.ClearPool(connection);
            await connection.DisposeAsync();
            throw;
        }
    }

    public async Task<bool> PingAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new OracleConnection(connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT 1 FROM DUAL";
            var result = await command.ExecuteScalarAsync(cancellationToken);
            return result is not null;
        }
        catch
        {
            return false;
        }
    }

    public async Task<OracleConnection> CreateAuthConnectionAsync(CancellationToken cancellationToken = default)
    {
        var connection = new OracleConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        return connection;
    }

    public async Task ClearSessionContextAsync(
        OracleConnection connection,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(connection);
        try
        {
            await using var command = CreateClearSessionContextCommand(connection);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch
        {
            OracleConnection.ClearPool(connection);
            throw;
        }
    }

    private AuthenticatedOracleSessionContext GetAuthenticatedSessionContext(string requestedBranchId)
    {
        if (!currentUserContext.IsAuthenticated)
            throw new InvalidOperationException("An authenticated user is required to initialize the Oracle session context.");

        var userId = currentUserContext.UserId?.Trim();
        var role = currentUserContext.Role?.ToString();
        var authenticatedBranchId = currentUserContext.BranchId?.Trim();

        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(role) || string.IsNullOrWhiteSpace(authenticatedBranchId))
            throw new InvalidOperationException("The authenticated user, role, and branch are required to initialize the Oracle session context.");
        if (!string.Equals(authenticatedBranchId, requestedBranchId, StringComparison.Ordinal))
            throw new InvalidOperationException("The requested database branch does not match the authenticated user branch.");

        return new AuthenticatedOracleSessionContext(userId, role, authenticatedBranchId);
    }

    private static async Task SetSessionContextAsync(
        OracleConnection connection,
        AuthenticatedOracleSessionContext context,
        CancellationToken cancellationToken)
    {
        await using var command = CreateSetSessionContextCommand(connection, context.UserId, context.RoleCode, context.BranchId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    internal static OracleCommand CreateSetSessionContextCommand(
        OracleConnection connection,
        string userId,
        string roleCode,
        string branchId)
    {
        ArgumentNullException.ThrowIfNull(connection);
        var command = connection.CreateCommand();
        command.BindByName = true;
        command.CommandText = """
            BEGIN
                PKG_PHARMA_SECURITY.SET_USER_CONTEXT(:userId, :roleCode, :branchId);
                DBMS_SESSION.SET_IDENTIFIER(:branchId);
            END;
            """;
        command.Parameters.Add("userId", OracleDbType.Varchar2, 50).Value = userId;
        command.Parameters.Add("roleCode", OracleDbType.Varchar2, 100).Value = roleCode;
        command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
        return command;
    }

    internal static OracleCommand CreateClearSessionContextCommand(OracleConnection connection)
    {
        ArgumentNullException.ThrowIfNull(connection);
        var command = connection.CreateCommand();
        command.CommandText = """
            BEGIN
                PKG_PHARMA_SECURITY.CLEAR_USER_CONTEXT;
                DBMS_SESSION.CLEAR_IDENTIFIER;
            END;
            """;
        return command;
    }

    private static string ExpandEnvironmentPlaceholders(string value)
    {
        return EnvironmentPlaceholder.Replace(value, match =>
        {
            var environmentValue = Environment.GetEnvironmentVariable(match.Groups["name"].Value);
            if (string.IsNullOrWhiteSpace(environmentValue))
                throw new InvalidOperationException($"Environment variable '{match.Groups["name"].Value}' is required by the Oracle connection string.");

            return environmentValue;
        });
    }

    private sealed record AuthenticatedOracleSessionContext(string UserId, string RoleCode, string BranchId);
}

internal sealed class OracleSessionContextScope(
    IOracleConnectionFactory connectionFactory,
    OracleConnection connection) : IAsyncDisposable
{
    private bool disposed;

    public async ValueTask DisposeAsync()
    {
        if (disposed)
            return;

        disposed = true;
        await connectionFactory.ClearSessionContextAsync(connection);
    }
}
