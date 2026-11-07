using System.Text;
using System.Text.RegularExpressions;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Common;
using PharmaSecure.Application.Features.Security;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Common;
using PharmaSecure.Domain.Enums;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class AuditLogService(IUnitOfWork unit, ICurrentUserContext user, IAuditAccessService access) : IAuditLogService
{
    private const string OutcomeSql = """
        CASE WHEN EventType IN ('AUTHORIZATION_DENIED','CROSS_BRANCH_DENIED','BRANCH_SWITCH_DENIED') THEN 'DENIED'
          WHEN EventType LIKE '%FAILED%' OR EventType LIKE '%FAILURE%' OR EventType LIKE '%UNAVAILABLE%' THEN 'FAILURE'
          WHEN EventType IN ('LOGIN_SUCCESS','AUTH_LOGIN_SUCCESS','LOGOUT','AUTH_LOGOUT','PROFILE_UPDATED','PASSWORD_CHANGED',
            'USER_CREATED','USER_ACTIVATED','USER_DEACTIVATED','AUDIT_ACCESS_GRANTED','PURCHASE_ORDER_CREATED',
            'PURCHASE_ORDER_APPROVED','PURCHASE_ORDER_REJECTED','PURCHASE_ORDER_ORDERED','BRANCH_SWITCH_SUCCESS') THEN 'SUCCESS'
          ELSE 'RECORDED' END
        """;
    private const string Scope = "BranchId=:branch AND BranchId=SYS_CONTEXT('PHARMA_CTX','BRANCH_ID')";
    public static (DateTime Start, DateTime End) Validate(AuditQuery q, DateTimeOffset now)
    {
        var start = (q.StartDate ?? new DateTimeOffset(now.UtcDateTime.Date.AddDays(-6), TimeSpan.Zero)).UtcDateTime;
        var end = (q.EndDate ?? new DateTimeOffset(now.UtcDateTime.Date.AddDays(1), TimeSpan.Zero)).UtcDateTime;
        if (start >= end || (end - start).TotalDays > 93 || end > now.UtcDateTime.Date.AddDays(1))
            throw new SensitiveAccessException(400, "Khoảng thời gian phải hợp lệ, tối đa 93 ngày, không vượt ngày hiện tại.");
        if (q.Page < 1 || q.PageSize is < 1 or > 100 || (long)(q.Page - 1) * q.PageSize > int.MaxValue)
            throw new SensitiveAccessException(400, "Phân trang không hợp lệ; tối đa 100 bản ghi mỗi trang.");
        foreach (var value in new[] { q.Username, q.Search })
            if (value is not null && (Encoding.UTF8.GetByteCount(value) > 100 || value.Any(char.IsControl)))
                throw new SensitiveAccessException(400, "Bộ lọc tài khoản/tìm kiếm tối đa 100 byte.");
        if (q.EventType is not null && !Regex.IsMatch(q.EventType, "^[A-Z0-9_]{1,50}$")) throw new SensitiveAccessException(400, "Loại sự kiện không hợp lệ.");
        if (q.Outcome is not null && !new[] { "SUCCESS", "FAILURE", "DENIED", "RECORDED" }.Contains(q.Outcome)) throw new SensitiveAccessException(400, "Kết quả lọc không hợp lệ.");
        return (start, end);
    }
    private void Require()
    {
        if (!user.IsAuthenticated || user.Role != UserRole.OWNER || string.IsNullOrWhiteSpace(user.UserId) || string.IsNullOrWhiteSpace(user.BranchId) || !access.HasAccess())
            throw new SensitiveAccessException(403, "Cần xác minh lại mật khẩu và OTP để đọc nhật ký chi nhánh.");
    }
    private OracleCommand Command(string sql, params (string Name, object Value)[] values)
    {
        var cmd = (OracleCommand)unit.Connection.CreateCommand(); cmd.Transaction = (OracleTransaction?)unit.Transaction;
        cmd.BindByName = true; cmd.CommandText = sql; cmd.CommandTimeout = 15;
        cmd.Parameters.Add("branch", OracleDbType.Varchar2).Value = user.BranchId;
        foreach (var (name, value) in values)
            cmd.Parameters.Add(name, value is DateTime ? OracleDbType.TimeStamp : value is int ? OracleDbType.Int32 : OracleDbType.Varchar2).Value = value;
        return cmd;
    }
    private async Task<T> Read<T>(Func<Task<T>> action, CancellationToken ct)
    {
        Require(); await unit.BeginTransactionAsync(user.BranchId!, ct);
        try { var result = await action(); await unit.CommitAsync(ct); return result; }
        catch { await unit.RollbackAsync(ct); throw; }
    }
    private static string Escape(string text) => text.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
    private static (string Filter, (string Name, object Value)[] Values) Filter(AuditQuery q)
    {
        var nowVn = VietnamTimeHelper.Now;
        var (start, end) = Validate(q, new DateTimeOffset(nowVn, VietnamTimeHelper.VietnamTz.GetUtcOffset(nowVn)));
        var sql = Scope + " AND CreatedDate>=:startAt AND CreatedDate<:endAt";
        var values = new List<(string, object)> { ("startAt", start), ("endAt", end) };
        if (!string.IsNullOrWhiteSpace(q.Username)) { sql += " AND LOWER(Username) LIKE :username ESCAPE '\\'"; values.Add(("username", "%" + Escape(q.Username.Trim().ToLowerInvariant()) + "%")); }
        if (!string.IsNullOrWhiteSpace(q.EventType)) { sql += " AND EventType=:eventType"; values.Add(("eventType", q.EventType)); }
        if (q.Outcome is not null) { sql += " AND (" + OutcomeSql + ")=:outcome"; values.Add(("outcome", q.Outcome)); }
        if (!string.IsNullOrWhiteSpace(q.Search)) { sql += " AND (LOWER(Username) LIKE :searchTerm ESCAPE '\\' OR LOWER(EventType) LIKE :searchTerm ESCAPE '\\')"; values.Add(("searchTerm", "%" + Escape(q.Search.Trim().ToLowerInvariant()) + "%")); }
        return (sql, values.ToArray());
    }
    private const string Columns = "id,UserId,Username,BranchId,EventType,IpAddress,UserAgent,FailureReason,CreatedDate," + OutcomeSql;
    private static string? SafeText(string? value)
    {
        if (value is null) return null;
        return PharmaSecure.Infrastructure.Security.SecurityAuditWriter.Sanitize(value);
    }
    private static AuditEntry Map(OracleDataReader r) => new(r.GetString(0), r.IsDBNull(1) ? null : r.GetString(1), r.GetString(2),
        r.GetString(3), r.GetString(4), r.IsDBNull(5) ? null : r.GetString(5), SafeText(r.IsDBNull(6) ? null : r.GetString(6)),
        SafeText(r.IsDBNull(7) ? null : r.GetString(7)), DateTime.SpecifyKind(r.GetDateTime(8), DateTimeKind.Utc), r.GetString(9));
    public Task<PagedResult<AuditEntry>> GetAsync(AuditQuery query, CancellationToken ct = default)
    {
        Require(); var (filter, values) = Filter(query);
        return Read(async () =>
        {
            using var count = Command("SELECT COUNT(*) FROM AUDIT_LOGS WHERE " + filter, values);
            var total = Convert.ToInt32(await count.ExecuteScalarAsync(ct));
            using var cmd = Command("SELECT " + Columns + " FROM AUDIT_LOGS WHERE " + filter + " ORDER BY CreatedDate DESC,id DESC OFFSET :skip ROWS FETCH NEXT :take ROWS ONLY", values.Concat(new (string, object)[] { ("skip", (query.Page - 1) * query.PageSize), ("take", query.PageSize) }).ToArray());
            var items = new List<AuditEntry>(); await using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct)) items.Add(Map(reader));
            return new PagedResult<AuditEntry>(items, query.Page, query.PageSize, total);
        }, ct);
    }
    public Task<AuditEntry?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        Require(); if (id.Length > 50) throw new SensitiveAccessException(400, "Mã sự kiện không hợp lệ.");
        return Read<AuditEntry?>(async () =>
        {
            using var cmd = Command("SELECT " + Columns + " FROM AUDIT_LOGS WHERE " + Scope + " AND id=:eventId", ("eventId", id));
            await using var reader = await cmd.ExecuteReaderAsync(ct); return await reader.ReadAsync(ct) ? Map(reader) : null;
        }, ct);
    }
    public Task<AuditStatistics> StatisticsAsync(AuditQuery query, CancellationToken ct = default)
    {
        Require(); var (filter, values) = Filter(query);
        return Read(async () =>
        {
            using var cmd = Command("""
                SELECT COUNT(CASE WHEN EventType IN ('LOGIN_SUCCESS','AUTH_LOGIN_SUCCESS') THEN 1 END),
                  COUNT(CASE WHEN EventType IN ('LOGIN_FAILED','AUTH_LOGIN_FAILED','AUTH_LOGIN_FAILURE') THEN 1 END),
                  COUNT(CASE WHEN EventType IN ('AUTHORIZATION_DENIED','CROSS_BRANCH_DENIED','BRANCH_SWITCH_DENIED') THEN 1 END),
                  COUNT(CASE WHEN EventType IN ('PROFILE_UPDATED','PASSWORD_CHANGED','USER_CREATED','USER_ACTIVATED','USER_DEACTIVATED')
                    OR EventType LIKE 'PURCHASE_ORDER_%' OR EventType LIKE 'BRANCH_SWITCH_%' THEN 1 END), COUNT(*)
                FROM AUDIT_LOGS WHERE
                """ + " " + filter, values);
            await using var reader = await cmd.ExecuteReaderAsync(ct); await reader.ReadAsync(ct);
            return new AuditStatistics(reader.GetInt32(0), reader.GetInt32(1), reader.GetInt32(2), reader.GetInt32(3), reader.GetInt32(4));
        }, ct);
    }
}
