using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Features.Customers;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Route("api/v1/customers")]
[Authorize(Roles = "SALES,OWNER")]
public sealed class CustomersController : ControllerBase
{
    private readonly ICustomerService customerService;
    private readonly ICurrentUserContext currentUserContext;
    private readonly ILogger<CustomersController> logger;

    public CustomersController(
        ICustomerService customerService,
        ICurrentUserContext currentUserContext,
        ILogger<CustomersController> logger)
    {
        this.customerService = customerService;
        this.currentUserContext = currentUserContext;
        this.logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] string? search,
        [FromQuery] string? phone,
        CancellationToken cancellationToken)
    {
        var customers = await customerService.GetCustomersAsync(search, phone, cancellationToken);
        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(
        string id,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(id))
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid customer ID",
                Detail = "Customer ID is required."
            });

        var customer = await customerService.GetByIdAsync(id, cancellationToken);
        if (customer is null)
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Customer not found",
                Detail = $"No customer exists with ID '{id}'."
            });

        return Ok(customer);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateCustomerRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid request payload",
                Detail = "Customer data cannot be empty."
            });

        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = "Customer full name is required."
            });

        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = "Customer phone number is required."
            });

        try
        {
            var branchId = currentUserContext.BranchId;
            var created = await customerService.CreateAsync(request, branchId, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, created);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Customer creation conflict: {Message}", ex.Message);
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Customer conflict",
                Detail = ex.Message
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        string id,
        [FromBody] UpdateCustomerRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(id))
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid customer ID",
                Detail = "Customer ID is required."
            });

        if (request is null)
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid request payload",
                Detail = "Customer update data cannot be empty."
            });

        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = "Customer full name is required."
            });

        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = "Customer phone number is required."
            });

        try
        {
            var updated = await customerService.UpdateAsync(id, request, cancellationToken);
            if (updated is null)
                return NotFound(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Customer not found",
                    Detail = $"No customer exists with ID '{id}'."
                });

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Customer update conflict: {Message}", ex.Message);
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Customer conflict",
                Detail = ex.Message
            });
        }
    }
}
