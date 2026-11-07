using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Auth;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Application.Features.Security;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService authService;
    private readonly ICurrentUserContext currentUserContext;
    private readonly IAuditAccessService? auditAccess;

    public AuthController(IAuthService authService, ICurrentUserContext currentUserContext, IAuditAccessService? auditAccess = null)
    {
        this.authService = authService;
        this.currentUserContext = currentUserContext;
        this.auditAccess = auditAccess;
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

        if (string.IsNullOrWhiteSpace(currentUserContext.BranchId))
            return Forbid();

        var result = await authService.GetCurrentUserAsync(currentUserContext.UserId, currentUserContext.BranchId, cancellationToken);
        if (result.IsFailure)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: result.Error);

        return Ok(result.Value);
    }

    [HttpPost("switch-branch")]
    [Authorize(Roles = "OWNER")]
    public async Task<ActionResult<LoginResponse>> SwitchBranchAsync(
        [FromBody] SwitchBranchRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.UserId) || string.IsNullOrWhiteSpace(currentUserContext.BranchId))
            return Unauthorized();
        if (request is null || string.IsNullOrWhiteSpace(request.BranchId))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Target branch is required.");

        var result = await authService.SwitchBranchAsync(
            currentUserContext.UserId,
            currentUserContext.BranchId,
            request.BranchId,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            Request.Headers.UserAgent.ToString(),
            cancellationToken);

        if (result.IsFailure)
            return Problem(statusCode: StatusCodes.Status403Forbidden, title: result.Error);

        auditAccess?.RevokeSession();
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

        if (User.IsInRole("OWNER")) auditAccess?.RevokeSession();
        return NoContent();
    }
}
