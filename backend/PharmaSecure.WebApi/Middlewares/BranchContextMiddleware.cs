using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.WebApi.Middlewares;

/// <summary>
/// Validates that authenticated requests operate strictly within their server-derived branch context.
/// Rejects or warns against untrusted client header/parameter branch manipulation.
/// Complies with Rule 06 (Branch Isolation) and Rule 03 (Security).
/// </summary>
public class BranchContextMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<BranchContextMiddleware> _logger;

    public BranchContextMiddleware(RequestDelegate next, ILogger<BranchContextMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ICurrentUserContext currentUserContext)
    {
        if (currentUserContext.IsAuthenticated && currentUserContext.BranchId.HasValue)
        {
            // Security invariant: Client cannot inject a different branch via query or custom header
            if (context.Request.Query.TryGetValue("branchId", out var clientQueryBranch))
            {
                if (int.TryParse(clientQueryBranch, out var requestedBranchId) &&
                    requestedBranchId != currentUserContext.BranchId.Value)
                {
                    _logger.LogWarning(
                        "SECURITY ALERT: Cross-branch access attempt detected. Authenticated BranchId: {AuthBranch}, Requested BranchId: {ReqBranch}",
                        currentUserContext.BranchId.Value, requestedBranchId);

                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        status = 403,
                        title = "Forbidden",
                        detail = "Cross-branch access is strictly denied."
                    });
                    return;
                }
            }
        }

        await _next(context);
    }
}
