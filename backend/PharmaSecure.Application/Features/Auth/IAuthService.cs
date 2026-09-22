using PharmaSecure.Application.Common;

namespace PharmaSecure.Application.Features.Auth;

public interface IAuthService
{
    Task<Result<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<Result<UserProfileResponse>> GetCurrentUserAsync(string userId, CancellationToken cancellationToken = default);
}
