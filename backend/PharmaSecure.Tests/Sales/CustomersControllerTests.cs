using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PharmaSecure.Application.Features.Customers;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Sales;

public class CustomersControllerTests
{
    private readonly Mock<ICustomerService> customerServiceMock = new();
    private readonly Mock<ICurrentUserContext> userContextMock = new();
    private readonly Mock<ILogger<CustomersController>> loggerMock = new();

    private CustomersController CreateController()
    {
        userContextMock.Setup(u => u.BranchId).Returns("br-00000000-0000-0000-0000-000000000001");
        userContextMock.Setup(u => u.UserId).Returns("us-00000000-0000-0000-0000-000000000003");

        var controller = new CustomersController(
            customerServiceMock.Object,
            userContextMock.Object,
            loggerMock.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        return controller;
    }

    [Fact]
    public async Task GetCustomers_WhenCalled_ReturnsOkWithList()
    {
        // Arrange
        var list = new List<CustomerResponse>
        {
            new("cus-1", "KH001", "Nguyen Thi Mai", "0901234567", "mai@gmail.com", "TP.HCM", "br-1", 150000m, 15, true, DateTime.UtcNow),
            new("cus-2", "KH002", "Tran Van Hung", "0912345678", null, "TP.HCM", "br-1", 0m, 0, true, DateTime.UtcNow)
        };
        customerServiceMock.Setup(s => s.GetCustomersAsync("Mai", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(list);

        var controller = CreateController();

        // Act
        var result = await controller.GetCustomers("Mai", null, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<CustomerResponse>>(okResult.Value);
        Assert.Equal(2, returned.Count);
    }

    [Fact]
    public async Task GetById_WhenExists_ReturnsOkWithCustomer()
    {
        // Arrange
        var customer = new CustomerResponse("cus-1", "KH001", "Nguyen Thi Mai", "0901234567", null, null, "br-1", 100000m, 10, true, DateTime.UtcNow);
        customerServiceMock.Setup(s => s.GetByIdAsync("cus-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(customer);

        var controller = CreateController();

        // Act
        var result = await controller.GetById("cus-1", CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<CustomerResponse>(okResult.Value);
        Assert.Equal("KH001", returned.CustomerCode);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        customerServiceMock.Setup(s => s.GetByIdAsync("not-found", It.IsAny<CancellationToken>()))
            .ReturnsAsync((CustomerResponse?)null);

        var controller = CreateController();

        // Act
        var result = await controller.GetById("not-found", CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFoundResult.Value);
        Assert.Equal(StatusCodes.Status404NotFound, problem.Status);
    }

    [Fact]
    public async Task Create_WithValidData_ReturnsCreatedResult()
    {
        // Arrange
        var request = new CreateCustomerRequest("Le Van An", "0933333333", "KH004", "an@test.com", "District 1");
        var created = new CustomerResponse("cus-4", "KH004", "Le Van An", "0933333333", "an@test.com", "District 1", "br-00000000-0000-0000-0000-000000000001", 0m, 0, true, DateTime.UtcNow);

        customerServiceMock.Setup(s => s.CreateAsync(request, "br-00000000-0000-0000-0000-000000000001", It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        var controller = CreateController();

        // Act
        var result = await controller.Create(request, CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status201Created, objectResult.StatusCode);
        var returned = Assert.IsType<CustomerResponse>(objectResult.Value);
        Assert.Equal("0933333333", returned.PhoneNumber);
    }

    [Fact]
    public async Task Create_WhenDuplicatePhoneOrCode_ReturnsConflict()
    {
        // Arrange
        var request = new CreateCustomerRequest("Nguyen Thi Mai", "0901234567");
        customerServiceMock.Setup(s => s.CreateAsync(request, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("A customer with phone number '0901234567' already exists."));

        var controller = CreateController();

        // Act
        var result = await controller.Create(request, CancellationToken.None);

        // Assert
        var conflictResult = Assert.IsType<ConflictObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(conflictResult.Value);
        Assert.Equal(StatusCodes.Status409Conflict, problem.Status);
    }

    [Theory]
    [InlineData("", "0901234567")]
    [InlineData("Valid Name", "")]
    public async Task Create_WhenMissingNameOrPhone_ReturnsBadRequest(string name, string phone)
    {
        // Arrange
        var request = new CreateCustomerRequest(name, phone);
        var controller = CreateController();

        // Act
        var result = await controller.Create(request, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(badRequestResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, problem.Status);
    }

    [Fact]
    public async Task Update_WithValidData_ReturnsOkResult()
    {
        // Arrange
        var request = new UpdateCustomerRequest("Nguyen Thi Mai Updated", "0901234567", "newemail@gmail.com", "HCMC", true);
        var updated = new CustomerResponse("cus-1", "KH001", "Nguyen Thi Mai Updated", "0901234567", "newemail@gmail.com", "HCMC", "br-1", 100000m, 10, true, DateTime.UtcNow);

        customerServiceMock.Setup(s => s.UpdateAsync("cus-1", request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        var controller = CreateController();

        // Act
        var result = await controller.Update("cus-1", request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<CustomerResponse>(okResult.Value);
        Assert.Equal("Nguyen Thi Mai Updated", returned.FullName);
    }

    [Fact]
    public async Task Update_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        var request = new UpdateCustomerRequest("Name", "0901234567");
        customerServiceMock.Setup(s => s.UpdateAsync("not-found", request, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CustomerResponse?)null);

        var controller = CreateController();

        // Act
        var result = await controller.Update("not-found", request, CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFoundResult.Value);
        Assert.Equal(StatusCodes.Status404NotFound, problem.Status);
    }

    [Fact]
    public async Task Update_WhenDuplicatePhone_ReturnsConflict()
    {
        // Arrange
        var request = new UpdateCustomerRequest("Name", "0901234567");
        customerServiceMock.Setup(s => s.UpdateAsync("cus-1", request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Phone number '0901234567' is already used by another customer."));

        var controller = CreateController();

        // Act
        var result = await controller.Update("cus-1", request, CancellationToken.None);

        // Assert
        var conflictResult = Assert.IsType<ConflictObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(conflictResult.Value);
        Assert.Equal(StatusCodes.Status409Conflict, problem.Status);
    }
}
