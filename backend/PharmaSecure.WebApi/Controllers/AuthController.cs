using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Auth;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService authService;
    private readonly ICurrentUserContext currentUserContext;

    public AuthController(IAuthService authService, ICurrentUserContext currentUserContext)
    {
        this.authService = authService;
        this.currentUserContext = currentUserContext;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> LoginAsync(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Username and password are required.");

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var result = await authService.LoginAsync(request, ipAddress, userAgent, cancellationToken);
        if (result.IsFailure)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: result.Error);

        return Ok(result.Value);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserProfileResponse>> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.UserId))
            return Unauthorized();

        var result = await authService.GetCurrentUserAsync(currentUserContext.UserId, cancellationToken);
        if (result.IsFailure)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: result.Error);

        return Ok(result.Value);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> LogoutAsync(CancellationToken cancellationToken = default)
    {
        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.UserId))
            return Unauthorized();

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var result = await authService.LogoutAsync(currentUserContext.UserId, ipAddress, userAgent, cancellationToken);
        if (result.IsFailure)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: result.Error);

        return NoContent();
    }
}
