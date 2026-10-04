using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Procurement;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/suppliers")]
[Authorize(Roles = "OWNER,WAREHOUSE")]
public sealed class SuppliersController : ControllerBase
{
    private readonly ISupplierService supplierService;

    public SuppliersController(ISupplierService supplierService)
    {
        this.supplierService = supplierService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SupplierResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var suppliers = await supplierService.GetAllAsync(cancellationToken);
        return Ok(suppliers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SupplierResponse>> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Supplier ID is required.");

        var supplier = await supplierService.GetByIdAsync(id, cancellationToken);
        if (supplier is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Supplier was not found.");

        return Ok(supplier);
    }

    [HttpPost]
    public async Task<ActionResult<SupplierResponse>> CreateAsync(
        [FromBody] CreateSupplierRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Request body cannot be null.");
        if (string.IsNullOrWhiteSpace(request.SupplierCode) || string.IsNullOrWhiteSpace(request.SupplierName))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "SupplierCode and SupplierName are required.");

        try
        {
            var created = await supplierService.CreateAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetByIdAsync), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, title: ex.Message);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }
}
