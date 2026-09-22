namespace PharmaSecure.Application.Features.Auth;

public sealed record LoginRequest(string Username, string Password);

public sealed record LoginResponse(
    string AccessToken,
    string TokenType,
    int ExpiresInSeconds,
    UserProfileResponse User);

public sealed record UserProfileResponse(
    string UserId,
    string Username,
    string Role,
    string BranchId);
