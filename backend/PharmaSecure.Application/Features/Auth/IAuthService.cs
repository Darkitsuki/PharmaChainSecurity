using PharmaSecure.Application.Common;

namespace PharmaSecure.Application.Features.Auth;

public interface IAuthService
{
    Task<Result<LoginResponse>> LoginAsync(LoginRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default);
    Task<Result<UserProfileResponse>> GetCurrentUserAsync(string userId, CancellationToken cancellationToken = default);
    Task<Result> LogoutAsync(string userId, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default);
}
