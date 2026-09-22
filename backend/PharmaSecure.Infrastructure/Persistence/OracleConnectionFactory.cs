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

    public OracleConnectionFactory(
        IConfiguration configuration,
        IBranchContextAccessor branchContextAccessor)
    {
        this.branchContextAccessor = branchContextAccessor;
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

        var connection = new OracleConnection(connectionString);
        try
        {
            await connection.OpenAsync(cancellationToken);
            await SetSessionIdentifierAsync(connection, branchId, cancellationToken);
            return connection;
        }
        catch
        {
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

    public async Task ClearSessionContextAsync(
        OracleConnection connection,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(connection);
        await SetSessionIdentifierAsync(connection, string.Empty, cancellationToken);
    }

    private static async Task SetSessionIdentifierAsync(
        OracleConnection connection,
        string branchId,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "BEGIN DBMS_SESSION.SET_IDENTIFIER(:branchId); END;";
        command.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
        await command.ExecuteNonQueryAsync(cancellationToken);
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
}