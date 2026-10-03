using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PharmaSecure.Application.Features.Inventory;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Inventory;

public class InventoryControllerTests
{
    private readonly Mock<IInventoryQueryService> queryServiceMock = new();
    private readonly Mock<IInventoryRepository> repositoryMock = new();

    private InventoryController CreateController(string branchId = "branch-01", string userId = "user-01", string role = "WAREHOUSE")
    {
        var controller = new InventoryController(queryServiceMock.Object, repositoryMock.Object);
        var claims = new List<Claim>
        {
            new("BranchId", branchId),
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        return controller;
    }

    [Fact]
    public async Task GetExpiringSoonAsync_WhenCalled_ReturnsOkWithAlerts()
    {
        var expectedAlerts = new List<InventoryAlertResponse>
        {
            new("branch-01", "drug-1", "PARA500", "Paracetamol", "batch-1", "B001", DateTime.UtcNow.AddDays(30), 5)
        };

        queryServiceMock.Setup(service => service.GetExpiringSoonAsync("branch-01", 90, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedAlerts);

        var controller = CreateController();
        var result = await controller.GetExpiringSoonAsync(90);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedAlerts = Assert.IsAssignableFrom<IReadOnlyCollection<InventoryAlertResponse>>(okResult.Value);
        Assert.Single(returnedAlerts);
    }

    [Fact]
    public async Task GetLowStockAsync_WhenCalled_ReturnsOkWithAlerts()
    {
        var expectedAlerts = new List<InventoryAlertResponse>
        {
            new("branch-01", "drug-2", "AMOX500", "Amoxicillin", "batch-2", "B002", DateTime.UtcNow.AddDays(180), 3)
        };

        queryServiceMock.Setup(service => service.GetLowStockAsync("branch-01", 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedAlerts);

        var controller = CreateController();
        var result = await controller.GetLowStockAsync(10);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedAlerts = Assert.IsAssignableFrom<IReadOnlyCollection<InventoryAlertResponse>>(okResult.Value);
        Assert.Single(returnedAlerts);
    }

    [Fact]
    public async Task AdjustStockAsync_WhenValid_PassesUserIdAndReturnsNoContent()
    {
        var controller = CreateController("branch-01", "user-thukho", "WAREHOUSE");
        var request = new StockAdjustmentRequestBody("drug-1", "batch-1", 50, "Kiem ke kho dinh ky");

        var result = await controller.AdjustStockAsync(request);

        Assert.IsType<NoContentResult>(result);
        repositoryMock.Verify(repository => repository.AdjustStockAsync(
            "branch-01",
            "drug-1",
            "batch-1",
            50,
            "Kiem ke kho dinh ky",
            "user-thukho",
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AdjustStockAsync_WhenNegativeQuantity_ReturnsBadRequestProblem()
    {
        var controller = CreateController();
        var request = new StockAdjustmentRequestBody("drug-1", "batch-1", -5, "Sai lech");

        var result = await controller.AdjustStockAsync(request);

        var problemResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, problemResult.StatusCode);
        repositoryMock.Verify(repository => repository.AdjustStockAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
