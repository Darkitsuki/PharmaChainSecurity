using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PharmaSecure.Application.Features.Inventory.Transfers;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Inventory;

public class StockTransfersControllerTests
{
    private readonly Mock<IStockTransferService> transferServiceMock = new();
    private const string TestBranchId = "br-00000000-0000-0000-0000-000000000001";
    private const string TargetBranchId = "br-00000000-0000-0000-0000-000000000002";
    private const string TestUserId = "us-00000000-0000-0000-0000-000000000002";

    private StockTransfersController CreateController(bool withUserClaims = true, string role = "WAREHOUSE")
    {
        var controller = new StockTransfersController(transferServiceMock.Object);
        var httpContext = new DefaultHttpContext();

        if (withUserClaims)
        {
            var claims = new List<Claim>
            {
                new("BranchId", TestBranchId),
                new(ClaimTypes.NameIdentifier, TestUserId),
                new(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            httpContext.User = new ClaimsPrincipal(identity);
        }

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return controller;
    }

    [Fact]
    public async Task GetTransfers_WhenCalled_ReturnsOkWithList()
    {
        // Arrange
        var list = new List<StockTransferResponse>
        {
            new("st-1", "DC20261019-001", TestBranchId, "Chi nhánh 1", TargetBranchId, "Chi nhánh 2",
                TestUserId, "Thủ kho", null, null, null, null, "PENDING", 2, 50, null, null, "Ghi chú", DateTime.UtcNow)
        };
        transferServiceMock.Setup(s => s.GetTransfersAsync(TestBranchId, It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(list);

        var controller = CreateController();

        // Act
        var result = await controller.GetTransfersAsync(null);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<StockTransferResponse>>(okResult.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task GetTransfers_WhenNoBranchClaim_ReturnsForbid()
    {
        // Arrange
        var controller = CreateController(withUserClaims: false);

        // Act
        var result = await controller.GetTransfersAsync(null);

        // Assert
        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsProblem404()
    {
        // Arrange
        transferServiceMock.Setup(s => s.GetByIdAsync("st-notfound", TestBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((StockTransferDetailResponse?)null);

        var controller = CreateController();

        // Act
        var result = await controller.GetByIdAsync("st-notfound");

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        var problem = Assert.IsType<ProblemDetails>(objectResult.Value);
        Assert.Equal(StatusCodes.Status404NotFound, problem.Status);
    }

    [Fact]
    public async Task GetById_WhenExists_ReturnsOk()
    {
        // Arrange
        var detail = new StockTransferDetailResponse(
            "st-1", "DC20261019-001", TestBranchId, "Chi nhánh 1", TargetBranchId, "Chi nhánh 2",
            TestUserId, "Thủ kho", null, null, null, null, "PENDING", 1, 10, null, null, "Ghi chú",
            DateTime.UtcNow, Array.Empty<StockTransferItemDto>()
        );
        transferServiceMock.Setup(s => s.GetByIdAsync("st-1", TestBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        var controller = CreateController();

        // Act
        var result = await controller.GetByIdAsync("st-1");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<StockTransferDetailResponse>(okResult.Value);
        Assert.Equal("DC20261019-001", returned.TransferNo);
    }

    [Fact]
    public async Task CreateTransfer_WhenValid_ReturnsCreated()
    {
        // Arrange
        var request = new CreateStockTransferRequest(TargetBranchId, "Điều chuyển thuốc", new List<CreateStockTransferItemRequest>
        {
            new("dr-1", "bat-1", 10, "Ghi chú mặt hàng")
        });
        var detail = new StockTransferDetailResponse(
            "st-new", "DC20261019-002", TestBranchId, "Chi nhánh 1", TargetBranchId, "Chi nhánh 2",
            TestUserId, "Thủ kho", null, null, null, null, "PENDING", 1, 10, null, null, "Điều chuyển thuốc",
            DateTime.UtcNow, Array.Empty<StockTransferItemDto>()
        );
        transferServiceMock.Setup(s => s.CreateTransferAsync(request, TestBranchId, TestUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        var controller = CreateController();

        // Act
        var result = await controller.CreateTransferAsync(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<StockTransferDetailResponse>(createdResult.Value);
        Assert.Equal("st-new", returned.Id);
    }

    [Fact]
    public async Task ShipTransfer_WhenValid_ReturnsOk()
    {
        // Arrange
        var detail = new StockTransferDetailResponse(
            "st-1", "DC20261019-001", TestBranchId, "Chi nhánh 1", TargetBranchId, "Chi nhánh 2",
            TestUserId, "Thủ kho", TestUserId, "Thủ kho", null, null, "IN_TRANSIT", 1, 10, DateTime.UtcNow, null, "Ghi chú",
            DateTime.UtcNow, Array.Empty<StockTransferItemDto>()
        );
        transferServiceMock.Setup(s => s.ShipTransferAsync("st-1", TestBranchId, TestUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        var controller = CreateController();

        // Act
        var result = await controller.ShipTransferAsync("st-1");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<StockTransferDetailResponse>(okResult.Value);
        Assert.Equal("IN_TRANSIT", returned.Status);
    }

    [Fact]
    public async Task ReceiveTransfer_WhenValid_ReturnsOk()
    {
        // Arrange
        var detail = new StockTransferDetailResponse(
            "st-1", "DC20261019-001", TargetBranchId, "Chi nhánh 2", TestBranchId, "Chi nhánh 1",
            "us-other", "Thủ kho gửi", "us-other", "Thủ kho gửi", TestUserId, "Thủ kho nhận", "COMPLETED", 1, 10,
            DateTime.UtcNow, DateTime.UtcNow, "Ghi chú", DateTime.UtcNow, Array.Empty<StockTransferItemDto>()
        );
        transferServiceMock.Setup(s => s.ReceiveTransferAsync("st-1", TestBranchId, TestUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        var controller = CreateController();

        // Act
        var result = await controller.ReceiveTransferAsync("st-1");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<StockTransferDetailResponse>(okResult.Value);
        Assert.Equal("COMPLETED", returned.Status);
    }

    [Fact]
    public async Task CancelTransfer_WhenValid_ReturnsOk()
    {
        // Arrange
        var detail = new StockTransferDetailResponse(
            "st-1", "DC20261019-001", TestBranchId, "Chi nhánh 1", TargetBranchId, "Chi nhánh 2",
            TestUserId, "Thủ kho", null, null, null, null, "CANCELLED", 1, 10, null, null, "Ghi chú",
            DateTime.UtcNow, Array.Empty<StockTransferItemDto>()
        );
        transferServiceMock.Setup(s => s.CancelTransferAsync("st-1", TestBranchId, TestUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        var controller = CreateController();

        // Act
        var result = await controller.CancelTransferAsync("st-1");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<StockTransferDetailResponse>(okResult.Value);
        Assert.Equal("CANCELLED", returned.Status);
    }
}
