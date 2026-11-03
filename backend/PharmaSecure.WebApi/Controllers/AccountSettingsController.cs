using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Security;

namespace PharmaSecure.WebApi.Controllers;

[ApiController, Authorize, Route("api/v1/account")]
public sealed class AccountSettingsController(IAccountSettingsService service) : ControllerBase
{
    [HttpGet("profile")]
    public async Task<IActionResult> Get(CancellationToken ct) => Ok(await service.GetAsync(ct));
    [HttpPut("profile")]
    public async Task<IActionResult> Update(UpdateProfileRequest request, CancellationToken ct) => Ok(await service.UpdateAsync(request, ct));
    [HttpPost("password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct)
    {
        await service.ChangePasswordAsync(request, ct); return NoContent();
    }
}
