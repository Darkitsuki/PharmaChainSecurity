using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Infrastructure.Persistence;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
    private readonly IOracleConnectionFactory connectionFactory;

    public HealthController(IOracleConnectionFactory connectionFactory)
    {
        this.connectionFactory = connectionFactory;
    }

    /// <summary>
    /// Liveness probe: verifies process availability.
    /// </summary>
    [HttpGet("live")]
    public IActionResult Live()
    {
        return Ok(new
        {
            status = "Healthy",
            timestamp = DateTime.UtcNow,
            service = "PharmaSecure.WebApi"
        });
    }

    /// <summary>
    /// Readiness probe: verifies readiness for incoming traffic and Oracle Database 23ai connectivity.
    /// </summary>
    [HttpGet("ready")]
    public async Task<IActionResult> Ready(CancellationToken cancellationToken = default)
    {
        var isDbHealthy = await connectionFactory.PingAsync(cancellationToken);
        var status = isDbHealthy ? "Ready" : "Unhealthy";

        var payload = new
        {
            status,
            timestamp = DateTime.UtcNow,
            dependencies = new
            {
                database = isDbHealthy ? "Healthy" : "Unhealthy"
            }
        };

        return isDbHealthy ? Ok(payload) : StatusCode(StatusCodes.Status503ServiceUnavailable, payload);
    }
}
