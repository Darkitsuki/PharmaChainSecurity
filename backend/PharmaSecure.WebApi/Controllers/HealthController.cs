using Microsoft.AspNetCore.Mvc;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
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
    /// Readiness probe: verifies readiness for incoming traffic.
    /// </summary>
    [HttpGet("ready")]
    public IActionResult Ready()
    {
        // In foundation phase, the application host is ready.
        // In future phases, critical dependency checks (SQL Server connectivity) will be reported here.
        return Ok(new
        {
            status = "Ready",
            timestamp = DateTime.UtcNow,
            dependencies = new
            {
                database = "Ready"
            }
        });
    }
}
