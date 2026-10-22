using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PharmaSecure.Application.Features.Inventory.Audits;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Inventory;

public class InventoryAuditsControllerTests
{
    private readonly Mock<IInventoryAuditService> auditServiceMock = new();
    private const string TestBranchId = "br-00000000-0000-0000-0000-000000000001";
    private const string TestUserId = "us-00000000-0000-0000-0000-000000000002";

    private InventoryAuditsController CreateController(bool withUserClaims = true, string role = "WAREHOUSE")
    {
        var controller = new InventoryAuditsController(auditServiceMock.Object);
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
    public async Task GetByBranch_WhenCalled_ReturnsOkWithList()
    {
        // Arrange
        var list = new List<InventoryAuditResponse>
        {
            new("ia-1", "KK001", TestBranchId, TestUserId, "Thủ kho", null, null,
                DateTime.UtcNow, DateTime.UtcNow, "CAN_BANG", 10, 8, 2, 0m, "Kiểm kê định kỳ", DateTime.UtcNow)
        };
        auditServiceMock.Setup(s => s.GetByBranchAsync(TestBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(list);

        var controller = CreateController();

        // Act
        var result = await controller.GetByBranchAsync();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<InventoryAuditResponse>>(okResult.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task GetByBranch_WhenNoBranchClaim_ReturnsForbid()
    {
        // Arrange
        var controller = CreateController(withUserClaims: false);

        // Act
        var result = await controller.GetByBranchAsync();

        // Assert
        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsProblem404()
    {
        // Arrange
        auditServiceMock.Setup(s => s.GetByIdAsync("ia-notfound", TestBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((InventoryAuditDetailResponse?)null);

        var controller = CreateController();

        // Act
        var result = await controller.GetByIdAsync("ia-notfound");

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        var problem = Assert.IsType<ProblemDetails>(objectResult.Value);
        Assert.Equal(StatusCodes.Status404NotFound, problem.Status);
    }

    [Fact]
    public async Task GetById_WhenExists_ReturnsOk()
    {
        // Arrange
        var detail = new InventoryAuditDetailResponse(
            "ia-1", "KK001", TestBranchId, TestUserId, "Thủ kho", null, null,
            DateTime.UtcNow, null, "DANG_KIEM", 5, 5, 0, 0m, "Ghi chú", DateTime.UtcNow, Array.Empty<InventoryAuditItemDto>()
        );
        auditServiceMock.Setup(s => s.GetByIdAsync("ia-1", TestBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        var controller = CreateController();

        // Act
        var result = await controller.GetByIdAsync("ia-1");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<InventoryAuditDetailResponse>(okResult.Value);
        Assert.Equal("KK001", returned.AuditNo);
    }

    [Fact]
    public async Task CreateAudit_WhenValid_ReturnsCreated()
    {
        // Arrange
        var request = new CreateInventoryAuditRequest("Kiểm kê tháng 10");
        var detail = new InventoryAuditDetailResponse(
            "ia-new", "KK002", TestBranchId, TestUserId, "Thủ kho", null, null,
            DateTime.UtcNow, null, "DANG_KIEM", 10, 10, 0, 0m, "Kiểm kê tháng 10", DateTime.UtcNow, Array.Empty<InventoryAuditItemDto>()
        );
        auditServiceMock.Setup(s => s.CreateAuditAsync(request, TestBranchId, TestUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        var controller = CreateController();

        // Act
        var result = await controller.CreateAuditAsync(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<InventoryAuditDetailResponse>(createdResult.Value);
        Assert.Equal("ia-new", returned.Id);
    }

    [Fact]
    public async Task UpdateCountedItems_WhenValid_ReturnsOk()
    {
        // Arrange
        var request = new UpdateAuditItemsRequest(new List<CountedItemInput>
        {
            new("drug-1", "batch-1", 15, "Đếm lại thừa 2")
        });
        var detail = new InventoryAuditDetailResponse(
            "ia-1", "KK001", TestBranchId, TestUserId, "Thủ kho", null, null,
            DateTime.UtcNow, null, "DANG_KIEM", 1, 0, 1, 0m, "Ghi chú", DateTime.UtcNow, Array.Empty<InventoryAuditItemDto>()
        );
        auditServiceMock.Setup(s => s.UpdateCountedItemsAsync("ia-1", request, TestBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        var controller = CreateController();

        // Act
        var result = await controller.UpdateCountedItemsAsync("ia-1", request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<InventoryAuditDetailResponse>(okResult.Value);
        Assert.Equal("KK001", returned.AuditNo);
    }

    [Fact]
    public async Task Reconcile_WhenValid_ReturnsOk()
    {
        // Arrange
        var request = new ReconcileAuditRequest("Duyệt cân đối chênh lệch");
        var detail = new InventoryAuditDetailResponse(
            "ia-1", "KK001", TestBranchId, TestUserId, "Thủ kho", TestUserId, "Chủ nhà thuốc",
            DateTime.UtcNow, DateTime.UtcNow, "CAN_BANG", 1, 0, 1, 0m, "Ghi chú", DateTime.UtcNow, Array.Empty<InventoryAuditItemDto>()
        );
        auditServiceMock.Setup(s => s.ReconcileAsync("ia-1", TestBranchId, TestUserId, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        var controller = CreateController(role: "OWNER");

        // Act
        var result = await controller.ReconcileAsync("ia-1", request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<InventoryAuditDetailResponse>(okResult.Value);
        Assert.Equal("CAN_BANG", returned.Status);
    }

    [Fact]
    public async Task Cancel_WhenValid_ReturnsOk()
    {
        // Arrange
        var detail = new InventoryAuditDetailResponse(
            "ia-1", "KK001", TestBranchId, TestUserId, "Thủ kho", null, null,
            DateTime.UtcNow, null, "DA_HUY", 1, 1, 0, 0m, "Ghi chú", DateTime.UtcNow, Array.Empty<InventoryAuditItemDto>()
        );
        auditServiceMock.Setup(s => s.CancelAuditAsync("ia-1", TestBranchId, TestUserId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        auditServiceMock.Setup(s => s.GetByIdAsync("ia-1", TestBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        var controller = CreateController();

        // Act
        var result = await controller.CancelAsync("ia-1");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<InventoryAuditDetailResponse>(okResult.Value);
        Assert.Equal("DA_HUY", returned.Status);
        auditServiceMock.Verify(s => s.CancelAuditAsync("ia-1", TestBranchId, TestUserId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
