using System.Text.Json.Serialization;
using PharmaSecure.Application.Common;

namespace PharmaSecure.Application.Features.Security;

public sealed record AccountProfile(string UserId, string Username, string FullName, string? PhoneNumber,
    string? Email, string Role, string BranchId, string BranchName, bool IsActive);
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record UpdateProfileRequest(string FullName, string? PhoneNumber);
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword, string ConfirmPassword);
public interface IAccountSettingsService
{
    Task<AccountProfile> GetAsync(CancellationToken ct = default);
    Task<AccountProfile> UpdateAsync(UpdateProfileRequest request, CancellationToken ct = default);
    Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken ct = default);
    Task<string?> VerifyPasswordAsync(string password, CancellationToken ct = default);
}
public sealed record AuditEntry(string Id, string? UserId, string Username, string BranchId, string EventType,
    string? IpAddress, string? UserAgent, string? FailureReason, DateTime CreatedDate, string Outcome);
public sealed record AuditStatistics(int LoginSuccess, int LoginFailure, int AccessDenied, int ImportantActions, int TotalCount);
public sealed record AuditQuery
{
    public DateTimeOffset? StartDate { get; init; }
    public DateTimeOffset? EndDate { get; init; }
    public string? Username { get; init; }
    public string? EventType { get; init; }
    public string? Outcome { get; init; }
    public string? Search { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
public interface IAuditLogService
{
    Task<PagedResult<AuditEntry>> GetAsync(AuditQuery query, CancellationToken ct = default);
    Task<AuditEntry?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<AuditStatistics> StatisticsAsync(AuditQuery query, CancellationToken ct = default);
}
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record AuditPasswordRequest(string Password);
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record AuditOtpRequest(string ChallengeId, string Code);
public sealed record AuditChallenge(string ChallengeId, DateTimeOffset ExpiresAt, string MaskedEmail);
public sealed record AuditGrant(string AccessToken, DateTimeOffset ExpiresAt);
public interface IAuditAccessService
{
    bool HasAccess();
    Task<AuditChallenge> StartAsync(string password, CancellationToken ct = default);
    Task<AuditGrant> VerifyAsync(AuditOtpRequest request, CancellationToken ct = default);
    void RevokeSession();
}
// Production delivery remains fail-closed unless SMTP is configured.
public interface IAuditOtpDelivery
{
    bool IsAvailable { get; }
    Task SendAsync(string email, string code, CancellationToken ct);
}
public sealed class SensitiveAccessException(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}
public sealed class AuditPersistenceException : Exception
{
    public AuditPersistenceException() : base("Không lưu được nhật ký bảo mật. Thao tác chưa được xác nhận.") { }
}
