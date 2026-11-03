using System.Data.Common;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Security;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Infrastructure.Persistence;

namespace PharmaSecure.Infrastructure.Security;

public class SecurityAuditWriter(ICurrentUserContext user, IHttpContextAccessor http,
    IOracleConnectionFactory factory, ILogger<SecurityAuditWriter> logger)
{
    public static string? Sanitize(string? value) => value is null ? null : Regex.Replace(value,
        @"(?i)(bearer\s+\S+|(?:password|token|otp|secret|authorization)\s*[:=]\s*\S+|eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|-----BEGIN[^-]*PRIVATE KEY-----[\s\S]*)", "[redacted]");
    public static string? Bounded(string? value, int bytes)
    {
        if (value is null) return null;
        var result = new StringBuilder(); var size = 0;
        foreach (var rune in value.EnumerateRunes())
        {
            if (size + rune.Utf8SequenceLength > bytes) break;
            result.Append(rune.ToString()); size += rune.Utf8SequenceLength;
        }
        return result.ToString();
    }
    public virtual async Task WriteAsync(DbConnection connection, DbTransaction? transaction,
        string eventType, string? reason = null, CancellationToken ct = default)
    {
        try
        {
            using var command = (OracleCommand)connection.CreateCommand();
            command.Transaction = (OracleTransaction?)transaction;
            command.BindByName = true;
            command.CommandText = """
                INSERT INTO AUDIT_LOGS(id,UserId,Username,BranchId,EventType,IpAddress,UserAgent,FailureReason,CreatedDate)
                VALUES(:id,:actor,:username,:branch,:eventType,:ip,:agent,:reason,:occurredAt)
                """;
            foreach (var (name, value) in new (string, string?)[] {
                ("id",Guid.NewGuid().ToString("N")),("actor",user.UserId),("username",Bounded(user.Username ?? "Unknown",100)),
                ("branch",user.BranchId),("eventType",eventType),("ip",http.HttpContext?.Connection.RemoteIpAddress?.ToString()),
                ("agent",Bounded(Sanitize(http.HttpContext?.Request.Headers.UserAgent.ToString()),500)),("reason",Bounded(Sanitize(reason),255)) })
                command.Parameters.Add(name, OracleDbType.Varchar2).Value = (object?)value ?? DBNull.Value;
            command.Parameters.Add("occurredAt", OracleDbType.TimeStamp).Value = DateTime.UtcNow;
            await command.ExecuteNonQueryAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, "Security audit persistence failed for event {EventType}.", eventType);
            throw new AuditPersistenceException();
        }
    }
    public async Task RecordAsync(string eventType, string? reason = null, CancellationToken ct = default)
    {
        try
        {
            await using var connection = await factory.CreateAuthConnectionAsync(ct);
            await WriteAsync(connection, null, eventType, reason, ct);
        }
        catch (Exception ex) when (ex is not AuditPersistenceException)
        {
            logger.LogCritical(ex, "Security audit connection failed for event {EventType}.", eventType);
            throw new AuditPersistenceException();
        }
    }
}
