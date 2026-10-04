using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PharmaSecure.Application.Features.Procurement;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Procurement;

public class GoodsReceiptsControllerTests
{
    private readonly Mock<IGoodsReceiptService> receiptServiceMock = new();

    private GoodsReceiptsController CreateController(string? branchId = "branch-01", string userId = "staff-01")
    {
        var controller = new GoodsReceiptsController(receiptServiceMock.Object);
        var claims = new List<Claim>();
        if (!string.IsNullOrWhiteSpace(branchId))
            claims.Add(new Claim("BranchId", branchId));
        if (!string.IsNullOrWhiteSpace(userId))
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        return controller;
    }

    [Fact]
    public async Task GetByBranchAsync_WhenCalled_UsesUserBranchClaimAndReturnsOk()
    {
        // Arrange
        var receipts = new List<GoodsReceiptResponse>
        {
            new("rc-1", "PN20261004-01", "branch-01", "sup-1", "DHG", "staff-01", "thukho_cn1", 1500000m, "Nhap bo sung", "COMPLETED", DateTime.UtcNow, Array.Empty<GoodsReceiptItemResponse>())
        };
        receiptServiceMock.Setup(s => s.GetByBranchAsync("branch-01", It.IsAny<CancellationToken>()))
            .ReturnsAsync(receipts);

        var controller = CreateController("branch-01");

        // Act
        var result = await controller.GetByBranchAsync();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<GoodsReceiptResponse>>(okResult.Value);
        Assert.Single(returned);
        receiptServiceMock.Verify(s => s.GetByBranchAsync("branch-01", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByBranchAsync_WhenMissingBranchClaim_ReturnsForbid()
    {
        // Arrange
        var controller = CreateController(branchId: null);

        // Act
        var result = await controller.GetByBranchAsync();

        // Assert
        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task GetByIdAsync_WhenExistsInBranch_ReturnsOkWithItems()
    {
        // Arrange
        var items = new List<GoodsReceiptItemResponse>
        {
            new("item-1", "rc-1", "drug-1", "PARA500", "Paracetamol 500mg", "batch-1", "B01", DateTime.UtcNow.AddYears(1), 100, 30000m, 3000000m)
        };
        var receipt = new GoodsReceiptResponse("rc-1", "PN20261004-01", "branch-01", "sup-1", "DHG", "staff-01", "thukho_cn1", 3000000m, null, "COMPLETED", DateTime.UtcNow, items);

        receiptServiceMock.Setup(s => s.GetByIdAsync("rc-1", "branch-01", It.IsAny<CancellationToken>()))
            .ReturnsAsync(receipt);

        var controller = CreateController("branch-01");

        // Act
        var result = await controller.GetByIdAsync("rc-1");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<GoodsReceiptResponse>(okResult.Value);
        Assert.Equal("PN20261004-01", returned.ReceiptNo);
        Assert.Single(returned.Items);
    }

    [Fact]
    public async Task GetByIdAsync_WhenCrossBranchOrNotFound_ReturnsNotFoundProblem()
    {
        // Arrange
        receiptServiceMock.Setup(s => s.GetByIdAsync("rc-other-branch", "branch-01", It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoodsReceiptResponse?)null);

        var controller = CreateController("branch-01");

        // Act
        var result = await controller.GetByIdAsync("rc-other-branch");

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(result.Result);
        var details = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal(StatusCodes.Status404NotFound, details.Status);
    }

    [Fact]
    public async Task CreateAsync_WhenValid_PassesBranchAndStaffIdAndReturnsCreated()
    {
        // Arrange
        var items = new List<CreateGoodsReceiptItemRequest>
        {
            new("drug-1", "BATCH01", DateTime.UtcNow.AddYears(2), DateTime.UtcNow, 50, 25000m)
        };
        var request = new CreateGoodsReceiptRequest("sup-1", "Nhap kho test", items);
        var created = new GoodsReceiptResponse("rc-new", "PN20261004-99", "branch-01", "sup-1", "DHG", "staff-01", null, 1250000m, "Nhap kho test", "COMPLETED", DateTime.UtcNow, Array.Empty<GoodsReceiptItemResponse>());

        receiptServiceMock.Setup(s => s.CreateReceiptAsync("branch-01", "staff-01", request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        var controller = CreateController("branch-01", "staff-01");

        // Act
        var result = await controller.CreateAsync(request);

        // Assert
        var createdAtResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<GoodsReceiptResponse>(createdAtResult.Value);
        Assert.Equal("rc-new", returned.Id);
        receiptServiceMock.Verify(s => s.CreateReceiptAsync("branch-01", "staff-01", request, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WhenItemsEmpty_ReturnsBadRequestProblem()
    {
        // Arrange
        var request = new CreateGoodsReceiptRequest("sup-1", "Khong co san pham", new List<CreateGoodsReceiptItemRequest>());
        var controller = CreateController();

        // Act
        var result = await controller.CreateAsync(request);

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(result.Result);
        var details = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, details.Status);
    }

    [Fact]
    public async Task CreateAsync_WhenBusinessRuleFails_ReturnsUnprocessableEntityProblem()
    {
        // Arrange
        var items = new List<CreateGoodsReceiptItemRequest>
        {
            new("drug-invalid", "BATCH01", DateTime.UtcNow.AddYears(1), null, 10, 50000m)
        };
        var request = new CreateGoodsReceiptRequest("sup-1", null, items);

        receiptServiceMock.Setup(s => s.CreateReceiptAsync("branch-01", "staff-01", request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Thuốc không tồn tại trong hệ thống."));

        var controller = CreateController("branch-01", "staff-01");

        // Act
        var result = await controller.CreateAsync(request);

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(result.Result);
        var details = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal(StatusCodes.Status422UnprocessableEntity, details.Status);
    }
}
