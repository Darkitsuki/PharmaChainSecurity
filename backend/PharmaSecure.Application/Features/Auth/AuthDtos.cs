namespace PharmaSecure.Application.Features.Auth;

public sealed record LoginRequest(string Username, string Password);

public sealed record SwitchBranchRequest(string BranchId);

public sealed record LoginResponse(
    string AccessToken,
    string TokenType,
    int ExpiresInSeconds,
    UserProfileResponse User);

public sealed record UserProfileResponse(
    string UserId,
    string Username,
    string FullName,
    string Role,
    string HomeBranchId,
    string BranchId,
    string BranchName);
