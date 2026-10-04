using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Users;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize(Roles = "OWNER")]
public sealed class UsersController : ControllerBase
{
    private readonly IUserService userService;
    private readonly ICurrentUserContext currentUserContext;
    private readonly ILogger<UsersController> logger;

    public UsersController(
        IUserService userService,
        ICurrentUserContext currentUserContext,
        ILogger<UsersController> logger)
    {
        this.userService = userService;
        this.currentUserContext = currentUserContext;
        this.logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetBranchUsers(CancellationToken cancellationToken)
    {
        var branchId = currentUserContext.BranchId;
        var users = await userService.GetBranchUsersAsync(branchId, cancellationToken);
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(id))
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid user ID",
                Detail = "User ID is required."
            });

        var branchId = currentUserContext.BranchId;
        var user = await userService.GetByIdAsync(id, branchId, cancellationToken);
        if (user is null)
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "User not found",
                Detail = $"No user exists with ID '{id}' in your branch."
            });

        return Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid request payload",
                Detail = "User data cannot be empty."
            });

        if (string.IsNullOrWhiteSpace(request.Username))
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = "Username is required."
            });

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = "Password must be at least 6 characters long."
            });

        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = "Full name is required."
            });

        if (string.IsNullOrWhiteSpace(request.Role))
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = "Role is required (SALES or WAREHOUSE)."
            });

        try
        {
            var branchId = currentUserContext.BranchId;
            var created = await userService.CreateUserAsync(request, branchId, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, created);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "User creation conflict: {Message}", ex.Message);
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "User conflict",
                Detail = ex.Message
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = ex.Message
            });
        }
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(
        string id,
        [FromBody] UpdateUserStatusRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(id))
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid user ID",
                Detail = "User ID is required."
            });

        if (string.Equals(id, currentUserContext.UserId, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Self lockout prohibited",
                Detail = "You cannot deactivate or lock your own active account."
            });

        var branchId = currentUserContext.BranchId;
        var updated = await userService.UpdateStatusAsync(id, branchId, request.IsActive, cancellationToken);
        if (updated is null)
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "User not found",
                Detail = $"No user exists with ID '{id}' in your branch."
            });

        return Ok(updated);
    }
}
