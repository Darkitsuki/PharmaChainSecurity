using System.Security.Cryptography;
using System.Text;
using System.Net.Mail;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using PharmaSecure.Application.Features.Security;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Enums;

namespace PharmaSecure.Infrastructure.Security;

public sealed class UnavailableAuditOtpDelivery : IAuditOtpDelivery
{
    public bool IsAvailable => false;
    public Task SendAsync(string email, string code, CancellationToken ct) => throw new SensitiveAccessException(503, "Dịch vụ OTP email chưa được cấu hình. Nhật ký vẫn bị khóa.");
}

// Ephemeral challenges/grants intentionally disappear on restart (fail-closed).
// A multi-instance deployment needs a shared atomic TTL store before enabling OTP.
public sealed class AuditAccessStore(TimeProvider time) : IDisposable
{
    private readonly MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 10000 });
    private readonly object gate = new();
    private sealed record Challenge(string Binding, string RecipientHash, string CodeHash, DateTimeOffset Expires, int Attempts = 0);
    private sealed record Grant(string Binding, DateTimeOffset Expires);
    private sealed record Attempts(int Count, DateTimeOffset Expires);
    private static string Digest(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    private static string MaskEmail(string email)
    {
        var separator = email.IndexOf('@');
        var local = email[..separator];
        var visibleEnd = local.Length > 1 ? local[^1].ToString() : string.Empty;
        return $"{local[0]}{new string('*', Math.Max(3, local.Length - 2))}{visibleEnd}{email[separator..]}";
    }
    private void Set<T>(string key, T value, DateTimeOffset expires) => cache.Set(key, value, new MemoryCacheEntryOptions { AbsoluteExpiration = expires, Size = 1 });
    public void Limit(string binding)
    {
        lock (gate)
        {
            var key = "limit:" + binding; var now = time.GetUtcNow(); var attempt = cache.Get<Attempts>(key);
            if (attempt is null || attempt.Expires <= now) attempt = new(0, now.AddMinutes(5));
            if (attempt.Count >= 5) throw new SensitiveAccessException(429, "Đã thử quá nhiều lần. Vui lòng đợi 5 phút.");
            Set(key, attempt with { Count = attempt.Count + 1 }, attempt.Expires);
        }
    }
    public AuditChallenge Create(string binding, string email, string code)
    {
        var id = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)); var expires = time.GetUtcNow().AddMinutes(5);
        lock (gate) Set("challenge:" + id, new Challenge(binding, Digest(email.ToUpperInvariant()), Digest(id + code), expires), expires);
        return new(id, expires, MaskEmail(email));
    }
    public AuditGrant Verify(string binding, AuditOtpRequest request, DateTimeOffset jwtExpires, string email)
    {
        lock (gate)
        {
            var key = "challenge:" + request.ChallengeId; var entry = cache.Get<Challenge>(key); var now = time.GetUtcNow();
            if (jwtExpires <= now) throw new SensitiveAccessException(403, "Phiên đăng nhập đã hết hạn.");
            if (entry is null || entry.Expires <= now || entry.Binding != binding || entry.Attempts >= 5)
                throw new SensitiveAccessException(403, "Phiên xác minh không hợp lệ hoặc đã hết hạn.");
            if (entry.RecipientHash != Digest(email.ToUpperInvariant()))
            {
                cache.Remove(key);
                throw new SensitiveAccessException(403, "Email tài khoản đã thay đổi. Vui lòng xác minh lại.");
            }
            if (!CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(entry.CodeHash), Encoding.ASCII.GetBytes(Digest(request.ChallengeId + request.Code))))
            {
                Set(key, entry with { Attempts = entry.Attempts + 1 }, entry.Expires);
                throw new SensitiveAccessException(400, "Mã OTP không đúng.");
            }
            cache.Remove(key);
            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var expires = now.AddMinutes(5) < jwtExpires ? now.AddMinutes(5) : jwtExpires;
            Set("grant:" + Digest(token), new Grant(binding, expires), expires);
            return new(token, expires);
        }
    }
    public void RemoveChallenge(string challengeId) => cache.Remove("challenge:" + challengeId);
    public bool HasGrant(string binding, string token)
    {
        var entry = cache.Get<Grant>("grant:" + Digest(token));
        return !IsRevoked(binding) && entry is not null && entry.Binding == binding && entry.Expires > time.GetUtcNow();
    }
    public bool IsRevoked(string binding) => cache.Get<bool>("revoked:" + binding);
    public void RevokeBinding(string binding, DateTimeOffset expires)
    {
        if (expires > time.GetUtcNow()) Set("revoked:" + binding, true, expires);
    }
    public void Revoke(string token) => cache.Remove("grant:" + Digest(token));
    public void Dispose() => cache.Dispose();
}

public sealed class AuditAccessService(ICurrentUserContext user, IHttpContextAccessor http, IAccountSettingsService account,
    IAuditOtpDelivery delivery, AuditAccessStore store, SecurityAuditWriter audit) : IAuditAccessService
{
    private static bool IsValidEmail(string? email) =>
        !string.IsNullOrWhiteSpace(email) && email == email.Trim() &&
        MailAddress.TryCreate(email, out var address) &&
        string.Equals(address.Address, email, StringComparison.OrdinalIgnoreCase);

    private string Binding()
    {
        var session = http.HttpContext?.User.FindFirst("jti")?.Value;
        if (!user.IsAuthenticated || user.Role != UserRole.OWNER || string.IsNullOrEmpty(user.UserId) || string.IsNullOrEmpty(user.BranchId) || string.IsNullOrEmpty(session))
            throw new SensitiveAccessException(403, "Chỉ Chủ nhà thuốc có phiên đăng nhập hợp lệ được xác minh nhật ký.");
        var binding = user.UserId + ":" + user.BranchId + ":" + session;
        if (store.IsRevoked(binding)) throw new SensitiveAccessException(403, "Phiên nhật ký đã bị khóa. Vui lòng đăng nhập lại.");
        return binding;
    }
    public bool HasAccess()
    {
        try { var token = http.HttpContext?.Request.Headers["X-Audit-Access"].ToString(); return token is { Length: 64 } && store.HasGrant(Binding(), token); }
        catch (SensitiveAccessException) { return false; }
    }
    public async Task<AuditChallenge> StartAsync(string password, CancellationToken ct = default)
    {
        var binding = Binding(); store.Limit(user.UserId!);
        string? email;
        try { email = await account.VerifyPasswordAsync(password, ct); }
        catch (SensitiveAccessException) { await audit.RecordAsync("AUDIT_REAUTH_FAILED", "Password verification failed", ct); throw; }
        if (!IsValidEmail(email))
        {
            await audit.RecordAsync("AUDIT_OTP_EMAIL_MISSING", "OWNER account has no valid email address", ct);
            throw new SensitiveAccessException(503, "Không tìm thấy email tài khoản hợp lệ. Chưa cấp quyền đọc nhật ký.");
        }
        var recipientEmail = email!;
        if (!delivery.IsAvailable)
        {
            await audit.RecordAsync("AUDIT_OTP_UNAVAILABLE", "Gmail SMTP delivery is not configured", ct);
            throw new SensitiveAccessException(503, "Dịch vụ Gmail OTP chưa được cấu hình đầy đủ. Chưa cấp quyền đọc nhật ký.");
        }
        var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6", System.Globalization.CultureInfo.InvariantCulture);
        var challenge = store.Create(binding, recipientEmail, code);
        try { await delivery.SendAsync(recipientEmail, code, ct); }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            store.RemoveChallenge(challenge.ChallengeId);
            throw;
        }
        catch
        {
            store.RemoveChallenge(challenge.ChallengeId);
            await audit.RecordAsync("AUDIT_OTP_DELIVERY_FAILED", "OTP delivery failed", ct);
            throw new SensitiveAccessException(503, "Không gửi được mã xác minh. Chưa cấp quyền đọc nhật ký.");
        }
        return challenge;
    }
    public async Task<AuditGrant> VerifyAsync(AuditOtpRequest request, CancellationToken ct = default)
    {
        var binding = Binding();
        if (request.ChallengeId?.Length != 64 || request.Code?.Length != 6 || !request.Code.All(char.IsAsciiDigit))
            throw new SensitiveAccessException(400, "Mã xác minh không hợp lệ.");
        if (!delivery.IsAvailable) throw new SensitiveAccessException(503, "Dịch vụ Gmail OTP chưa được cấu hình đầy đủ. Nhật ký vẫn bị khóa.");
        store.Limit("otp-verify:" + user.UserId);
        var exp = http.HttpContext?.User.FindFirst("exp")?.Value;
        if (!long.TryParse(exp, out var seconds)) throw new SensitiveAccessException(403, "Phiên đăng nhập không hợp lệ.");
        var profile = await account.GetAsync(ct);
        if (!IsValidEmail(profile.Email))
        {
            store.RemoveChallenge(request.ChallengeId);
            await audit.RecordAsync("AUDIT_OTP_EMAIL_MISSING", "OWNER email changed or is no longer valid", ct);
            throw new SensitiveAccessException(503, "Không tìm thấy email tài khoản hợp lệ. Chưa cấp quyền đọc nhật ký.");
        }
        var recipientEmail = profile.Email!;
        AuditGrant grant;
        try { grant = store.Verify(binding, request, DateTimeOffset.FromUnixTimeSeconds(seconds), recipientEmail); }
        catch (SensitiveAccessException) { await audit.RecordAsync("AUDIT_OTP_FAILED", "OTP verification failed", ct); throw; }
        try { await audit.RecordAsync("AUDIT_ACCESS_GRANTED", "Temporary audit read access", ct); }
        catch { store.Revoke(grant.AccessToken); throw; }
        return grant;
    }
    public void RevokeSession()
    {
        var exp = http.HttpContext?.User.FindFirst("exp")?.Value;
        if (long.TryParse(exp, out var seconds))
        {
            string binding;
            try { binding = Binding(); } catch (SensitiveAccessException) { return; }
            store.RevokeBinding(binding, DateTimeOffset.FromUnixTimeSeconds(seconds));
        }
    }
}
