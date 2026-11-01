using System.Data;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;

namespace PharmaSecure.Infrastructure.Persistence;

/// <summary>
/// Hosted service that automatically applies pending database migrations on application startup.
/// Ensures that any new server or environment is automatically up-to-date with the latest schema.
/// </summary>
public sealed class DatabaseMigrationHostedService : IHostedService
{
    private readonly IConfiguration configuration;
    private readonly ILogger<DatabaseMigrationHostedService> logger;

    public DatabaseMigrationHostedService(
        IConfiguration configuration,
        ILogger<DatabaseMigrationHostedService> logger)
    {
        this.configuration = configuration;
        this.logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var autoMigrate = configuration.GetValue("Database:AutoMigrate", true);
        if (!autoMigrate)
        {
            logger.LogInformation("Database auto-migration is disabled via configuration.");
            return;
        }

        var configuredConnectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(configuredConnectionString))
        {
            logger.LogWarning("Skipping database auto-migration: DefaultConnection is not configured.");
            return;
        }

        string connectionString;
        try
        {
            connectionString = OracleConnectionFactory.ExpandEnvironmentPlaceholders(configuredConnectionString);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Skipping database auto-migration: Connection string has unresolved placeholders.");
            return;
        }

        try
        {
            logger.LogInformation("Starting database schema migration check...");
            await ApplyMigrationsAsync(connectionString, cancellationToken);
            logger.LogInformation("Database schema is up to date.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while applying database migrations. Continuing startup...");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public async Task ApplyMigrationsAsync(string connectionString, CancellationToken cancellationToken = default)
    {
        await using var connection = new OracleConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        // 1. Ensure SCHEMA_VERSION table exists
        await EnsureSchemaVersionTableAsync(connection, cancellationToken);

        // 2. Query applied migrations
        var appliedVersions = await GetAppliedVersionsAsync(connection, cancellationToken);

        // 3. Locate migration scripts directory
        var migrationFiles = DiscoverMigrationFiles();
        if (migrationFiles.Count == 0)
        {
            logger.LogInformation("No database migration files found on disk.");
            return;
        }

        foreach (var filePath in migrationFiles)
        {
            var fileName = Path.GetFileName(filePath);
            var version = Path.GetFileNameWithoutExtension(filePath);

            if (appliedVersions.Contains(version))
            {
                continue;
            }

            logger.LogInformation("Applying migration: {FileName}...", fileName);
            var script = await File.ReadAllTextAsync(filePath, cancellationToken);

            await ExecuteMigrationScriptAsync(connection, script, cancellationToken);
            await RecordMigrationAsync(connection, version, fileName, cancellationToken);

            logger.LogInformation("Successfully applied migration: {FileName}", fileName);
        }
    }

    private static async Task EnsureSchemaVersionTableAsync(OracleConnection connection, CancellationToken cancellationToken)
    {
        await using var cmd = connection.CreateCommand();
        cmd.CommandText = """
            BEGIN
                EXECUTE IMMEDIATE 'CREATE TABLE SCHEMA_VERSION (
                    VersionNumber VARCHAR2(100) PRIMARY KEY,
                    AppliedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    Description   VARCHAR2(255),
                    AppliedBy     VARCHAR2(100) DEFAULT USER NOT NULL
                )';
            EXCEPTION
                WHEN OTHERS THEN
                    IF SQLCODE != -955 THEN RAISE; END IF;
            END;
            """;
        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<HashSet<string>> GetAppliedVersionsAsync(OracleConnection connection, CancellationToken cancellationToken)
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        await using var cmd = connection.CreateCommand();
        cmd.CommandText = "SELECT VersionNumber FROM SCHEMA_VERSION";
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            set.Add(reader.GetString(0));
        }
        return set;
    }

    private static async Task RecordMigrationAsync(
        OracleConnection connection,
        string version,
        string description,
        CancellationToken cancellationToken)
    {
        await using var cmd = connection.CreateCommand();
        cmd.BindByName = true;
        cmd.CommandText = "INSERT INTO SCHEMA_VERSION (VersionNumber, Description) VALUES (:version, :description)";
        cmd.Parameters.Add("version", OracleDbType.Varchar2, 100).Value = version;
        cmd.Parameters.Add("description", OracleDbType.Varchar2, 255).Value = description;
        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task ExecuteMigrationScriptAsync(
        OracleConnection connection,
        string script,
        CancellationToken cancellationToken)
    {
        var blocks = SplitScriptBlocks(script);
        foreach (var block in blocks)
        {
            var trimmed = block.Trim();
            if (string.IsNullOrWhiteSpace(trimmed)) continue;

            // Remove leading SQL line comments to accurately detect statement type
            var codeText = Regex.Replace(trimmed, @"^\s*--.*$", "", RegexOptions.Multiline).Trim();
            if (string.IsNullOrWhiteSpace(codeText)) continue;

            var isPlSql = codeText.StartsWith("BEGIN", StringComparison.OrdinalIgnoreCase) ||
                          codeText.StartsWith("DECLARE", StringComparison.OrdinalIgnoreCase) ||
                          codeText.StartsWith("CREATE OR REPLACE PACKAGE", StringComparison.OrdinalIgnoreCase) ||
                          codeText.StartsWith("CREATE OR REPLACE TRIGGER", StringComparison.OrdinalIgnoreCase) ||
                          codeText.StartsWith("CREATE OR REPLACE FUNCTION", StringComparison.OrdinalIgnoreCase) ||
                          codeText.StartsWith("CREATE OR REPLACE PROCEDURE", StringComparison.OrdinalIgnoreCase);

            // DDL statements executed via ODP.NET must not have trailing semicolon.
            // PL/SQL blocks must preserve the trailing semicolon on END;.
            if (!isPlSql && trimmed.EndsWith(';'))
            {
                trimmed = trimmed[..^1].Trim();
            }

            try
            {
                await using var cmd = connection.CreateCommand();
                cmd.CommandText = trimmed;
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }
            catch (OracleException ex) when (IsIdempotentError(ex.Number))
            {
                logger.LogDebug("Idempotent warning for DDL (code {Code}): {Message}", ex.Number, ex.Message);
            }
        }
    }

    private static bool IsIdempotentError(int errorCode)
    {
        // 1: unique constraint violated (already seeded or inserted)
        // 955: name is already used by an existing object
        // 1408: such column list already indexed
        // 1430: column being added already exists in table
        // 2260: table can have only one primary key
        // 2261: unique/primary key in table already exists
        // 2264: name already used by an existing constraint
        // 2275: such a referential constraint already exists in the table
        // 24344: success with compilation error (warning)
        return errorCode is 1 or 955 or 1408 or 1430 or 2260 or 2261 or 2264 or 2275 or 24344;
    }

    private static List<string> SplitScriptBlocks(string script)
    {
        var blocks = new List<string>();
        var normalized = script.Replace("\r\n", "\n");

        var slashBlocks = Regex.Split(normalized, @"(?m)^\s*/\s*$");
        foreach (var slashBlock in slashBlocks)
        {
            var text = slashBlock.Trim();
            if (string.IsNullOrWhiteSpace(text)) continue;

            // Strip comments to check structure
            var uncommented = Regex.Replace(text, @"^\s*--.*$", "", RegexOptions.Multiline).Trim();
            if (string.IsNullOrWhiteSpace(uncommented)) continue;

            // 1. Check for named PL/SQL or View creation (CREATE OR REPLACE ...)
            var createMatch = Regex.Match(uncommented, @"\bCREATE\s+(?:OR\s+REPLACE\s+)?(PACKAGE|TRIGGER|FUNCTION|PROCEDURE|VIEW)\b", RegexOptions.IgnoreCase);
            if (createMatch.Success)
            {
                if (createMatch.Index > 0)
                {
                    var prefixDdl = uncommented[..createMatch.Index];
                    foreach (var stmt in prefixDdl.Split(';', StringSplitOptions.RemoveEmptyEntries))
                    {
                        var clean = stmt.Trim();
                        if (!string.IsNullOrWhiteSpace(clean))
                            blocks.Add(clean);
                    }
                }

                var plsqlPart = uncommented[createMatch.Index..].Trim();
                if (!string.IsNullOrWhiteSpace(plsqlPart))
                    blocks.Add(plsqlPart);
                continue;
            }

            // 2. Check for anonymous PL/SQL block (DECLARE or BEGIN)
            var anonMatch = Regex.Match(uncommented, @"\b(DECLARE|BEGIN)\b", RegexOptions.IgnoreCase);
            if (anonMatch.Success)
            {
                if (anonMatch.Index > 0)
                {
                    var prefixDdl = uncommented[..anonMatch.Index];
                    foreach (var stmt in prefixDdl.Split(';', StringSplitOptions.RemoveEmptyEntries))
                    {
                        var clean = stmt.Trim();
                        if (!string.IsNullOrWhiteSpace(clean))
                            blocks.Add(clean);
                    }
                }

                var anonPart = uncommented[anonMatch.Index..].Trim();
                if (!string.IsNullOrWhiteSpace(anonPart))
                    blocks.Add(anonPart);
                continue;
            }

            // 3. Pure DDL statements separated by ';'
            var ddlStatements = uncommented.Split(';', StringSplitOptions.RemoveEmptyEntries);
            foreach (var stmt in ddlStatements)
            {
                var cleanStmt = stmt.Trim();
                if (!string.IsNullOrWhiteSpace(cleanStmt))
                {
                    blocks.Add(cleanStmt);
                }
            }
        }

        return blocks;
    }

    private List<string> DiscoverMigrationFiles()
    {
        var candidates = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "database", "migrations"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "database", "migrations"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "database", "migrations"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "database", "migrations"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "database", "migrations"),
        };

        foreach (var dir in candidates)
        {
            var fullPath = Path.GetFullPath(dir);
            if (Directory.Exists(fullPath))
            {
                var files = Directory.GetFiles(fullPath, "V*.sql")
                    .OrderBy(f => Path.GetFileName(f), StringComparer.OrdinalIgnoreCase)
                    .ToList();
                if (files.Count > 0)
                {
                    return files;
                }
            }
        }

        return new List<string>();
    }
}
