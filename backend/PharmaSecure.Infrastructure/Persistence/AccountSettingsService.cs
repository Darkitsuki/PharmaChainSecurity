using System.Text;
using System.Text.RegularExpressions;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Security;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Infrastructure.Security;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class AccountSettingsService(IUnitOfWork unit, ICurrentUserContext user,
    IPasswordHasher hasher, SecurityAuditWriter audit, AuditAccessStore attempts) : IAccountSettingsService
{
    private void RequireIdentity()
    {
        if (!user.IsAuthenticated || user.Role is null || string.IsNullOrWhiteSpace(user.UserId) || string.IsNullOrWhiteSpace(user.BranchId))
            throw new SensitiveAccessException(403, "Không có danh tính và chi nhánh hợp lệ.");
    }
    private OracleCommand Command(string sql, params (string Name, object? Value)[] values)
    {
        var cmd = (OracleCommand)unit.Connection.CreateCommand(); cmd.Transaction = (OracleTransaction?)unit.Transaction;
        cmd.BindByName = true; cmd.CommandText = sql;
        cmd.Parameters.Add("actor", OracleDbType.Varchar2).Value = user.UserId;
        cmd.Parameters.Add("branch", OracleDbType.Varchar2).Value = user.BranchId;
        foreach (var (name, value) in values) cmd.Parameters.Add(name, OracleDbType.Varchar2).Value = value ?? DBNull.Value;
        return cmd;
    }
    private async Task<T> Transaction<T>(Func<Task<T>> action, CancellationToken ct)
    {
        RequireIdentity(); await unit.BeginTransactionAsync(user.BranchId!, ct);
        try { var result = await action(); await unit.CommitAsync(ct); return result; }
        catch { await unit.RollbackAsync(ct); throw; }
    }
    private async Task<(AccountProfile Profile, string Hash)> Read(bool locked, CancellationToken ct)
    {
        using var cmd = Command("""
            SELECT u.id,u.Username,u.FullName,u.PhoneNumber,u.Email,u.BranchId,b.BranchName,u.IsActive,u.PasswordHash
            FROM USERS u JOIN BRANCHES b ON b.id=u.BranchId
            WHERE u.id=:actor AND u.BranchId=:branch AND u.IsActive=1
            """ + (locked ? " FOR UPDATE OF u.PasswordHash" : ""));
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) throw new SensitiveAccessException(403, "Tài khoản không còn hoạt động trong chi nhánh.");
        return (new(reader.GetString(0), reader.GetString(1), reader.GetString(2), reader.IsDBNull(3) ? null : reader.GetString(3),
            reader.IsDBNull(4) ? null : reader.GetString(4), user.Role!.Value.ToString(), reader.GetString(5), reader.GetString(6), reader.GetInt32(7) == 1), reader.GetString(8));
    }
    public Task<AccountProfile> GetAsync(CancellationToken ct = default) => Transaction(async () => (await Read(false, ct)).Profile, ct);
    public static void ValidateProfile(UpdateProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Any(char.IsControl) || Encoding.UTF8.GetByteCount(request.FullName.Trim()) > 255)
            throw new SensitiveAccessException(400, "Họ tên không được để trống và tối đa 255 byte.");
        if (!string.IsNullOrWhiteSpace(request.PhoneNumber) && !Regex.IsMatch(request.PhoneNumber.Trim(), @"^[+0-9 ()-]{6,20}$"))
            throw new SensitiveAccessException(400, "Số điện thoại gồm 6–20 ký tự: chữ số, dấu +, khoảng trắng, () hoặc -.");
    }
    public Task<AccountProfile> UpdateAsync(UpdateProfileRequest request, CancellationToken ct = default)
    {
        ValidateProfile(request);
        return Transaction(async () =>
        {
            var current = (await Read(true, ct)).Profile;
            var fullName = request.FullName.Trim(); var phone = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
            if (current.FullName != fullName || current.PhoneNumber != phone)
            {
                using var cmd = Command("UPDATE USERS SET FullName=:fullName,PhoneNumber=:phone WHERE id=:actor AND BranchId=:branch AND IsActive=1", ("fullName", fullName), ("phone", phone));
                await cmd.ExecuteNonQueryAsync(ct);
                await audit.WriteAsync(unit.Connection, unit.Transaction, "PROFILE_UPDATED", ct: ct);
            }
            return current with { FullName = fullName, PhoneNumber = phone };
        }, ct);
    }
    public static void ValidatePassword(ChangePasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || Encoding.UTF8.GetByteCount(request.CurrentPassword) > 72 || string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length is < 12 or > 64 || Encoding.UTF8.GetByteCount(request.NewPassword) > 72)
            throw new SensitiveAccessException(400, "Mật khẩu mới cần 12–64 ký tự, tối đa 72 byte UTF-8.");
        if (request.NewPassword != request.ConfirmPassword) throw new SensitiveAccessException(400, "Xác nhận mật khẩu mới chưa khớp.");
    }
    public async Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken ct = default)
    {
        ValidatePassword(request);
        RequireIdentity(); attempts.Limit("password-change:" + user.UserId);
        var invalidCurrentPassword = false;
        try { await Transaction(async () =>
        {
            var row = await Read(true, ct);
            if (!hasher.VerifyPassword(request.CurrentPassword, row.Hash)) { invalidCurrentPassword = true; throw new SensitiveAccessException(400, "Mật khẩu hiện tại không đúng."); }
            if (hasher.VerifyPassword(request.NewPassword, row.Hash)) throw new SensitiveAccessException(400, "Mật khẩu mới phải khác mật khẩu hiện tại.");
            using var cmd = Command("UPDATE USERS SET PasswordHash=:newHash WHERE id=:actor AND BranchId=:branch AND IsActive=1", ("newHash", hasher.HashPassword(request.NewPassword)));
            await cmd.ExecuteNonQueryAsync(ct);
            await audit.WriteAsync(unit.Connection, unit.Transaction, "PASSWORD_CHANGED", ct: ct);
            return true;
        }, ct); }
        catch (SensitiveAccessException) when (invalidCurrentPassword)
        {
            await audit.RecordAsync("PASSWORD_CHANGE_FAILED", "Current password verification failed", ct); throw;
        }
    }
    public Task<string?> VerifyPasswordAsync(string password, CancellationToken ct = default) => Transaction(async () =>
    {
        var row = await Read(false, ct);
        if (string.IsNullOrWhiteSpace(password) || Encoding.UTF8.GetByteCount(password) > 72 || !hasher.VerifyPassword(password, row.Hash))
            throw new SensitiveAccessException(400, "Mật khẩu xác minh không đúng.");
        return row.Profile.Email;
    }, ct);
}
