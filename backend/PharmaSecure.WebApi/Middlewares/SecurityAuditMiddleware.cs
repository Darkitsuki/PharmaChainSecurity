using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Security;
using PharmaSecure.Infrastructure.Security;
using Oracle.ManagedDataAccess.Client;

namespace PharmaSecure.WebApi.Middlewares;

public sealed class SecurityAuditMiddleware(RequestDelegate next, ILogger<SecurityAuditMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context, SecurityAuditWriter audit)
    {
        try { await next(context); }
        catch (SensitiveAccessException ex) when (!context.Response.HasStarted)
        {
            context.Response.StatusCode = ex.Status;
            await context.Response.WriteAsJsonAsync(new ProblemDetails { Status = ex.Status, Title = ex.Message });
        }
        catch (AuditPersistenceException ex) when (!context.Response.HasStarted)
        {
            context.Response.StatusCode = 503;
            await context.Response.WriteAsJsonAsync(new ProblemDetails { Status = 503, Title = ex.Message });
        }
        catch (OracleException ex) when (!context.Response.HasStarted &&
            (context.Request.Path.StartsWithSegments("/api/v1/account") || context.Request.Path.StartsWithSegments("/api/v1/security")))
        {
            logger.LogError(ex, "Account/security persistence unavailable. Correlation {CorrelationId}", context.TraceIdentifier);
            context.Response.StatusCode = 503;
            await context.Response.WriteAsJsonAsync(new ProblemDetails { Status = 503, Title = "Không truy cập được dữ liệu. Vui lòng thử lại sau." });
        }
        if (context.User.Identity?.IsAuthenticated == true && context.Response.StatusCode == 403)
        {
            try { await audit.RecordAsync(context.Items.ContainsKey("CrossBranchDenied") ? "CROSS_BRANCH_DENIED" : "AUTHORIZATION_DENIED", "Request denied by server authorization", context.RequestAborted); }
            catch (Exception ex) { logger.LogCritical(ex, "Denied request could not be persisted to security audit; access remains denied. Correlation {CorrelationId}", context.TraceIdentifier); }
        }
    }
}
