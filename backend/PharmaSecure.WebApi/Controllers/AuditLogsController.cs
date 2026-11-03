using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Security;

namespace PharmaSecure.WebApi.Controllers;

[ApiController, Authorize(Policy = "AuditStepUp"), Route("api/v1/security/audit-logs")]
public sealed class AuditLogsController(IAuditLogService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] AuditQuery query, CancellationToken ct) => Ok(await service.GetAsync(query, ct));
    [HttpGet("statistics")]
    public async Task<IActionResult> Statistics([FromQuery] AuditQuery query, CancellationToken ct) => Ok(await service.StatisticsAsync(query, ct));
    [HttpGet("{id}")]
    public async Task<IActionResult> Detail(string id, CancellationToken ct)
    {
        var result = await service.GetByIdAsync(id, ct); return result is null ? NotFound() : Ok(result);
    }
}
[ApiController, Authorize(Roles = "OWNER"), Route("api/v1/security/audit-access")]
public sealed class AuditAccessController(IAuditAccessService service) : ControllerBase
{
    [HttpPost("challenges")]
    public async Task<IActionResult> Start(AuditPasswordRequest request, CancellationToken ct) => Ok(await service.StartAsync(request.Password, ct));
    [HttpPost("verify")]
    public async Task<IActionResult> Verify(AuditOtpRequest request, CancellationToken ct) => Ok(await service.VerifyAsync(request, ct));
    [HttpDelete]
    public IActionResult Revoke() { service.RevokeSession(); return NoContent(); }
}
