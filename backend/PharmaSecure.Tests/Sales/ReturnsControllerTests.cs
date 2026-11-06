using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PharmaSecure.Application.Features.Returns;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Sales;

public class ReturnsControllerTests
{
    private readonly Mock<IReturnService> returnServiceMock = new();
    private readonly Mock<IIdempotencyService> idempotencyServiceMock = new();
    private const string TestBranchId = "br-00000000-0000-0000-0000-000000000001";
    private const string TestCashierId = "us-00000000-0000-0000-0000-000000000003";

    private ReturnsController CreateController(bool withUserClaims = true, bool withUserId = true)
    {
        var controller = new ReturnsController(returnServiceMock.Object, idempotencyServiceMock.Object);
        var httpContext = new DefaultHttpContext();

        if (withUserClaims)
        {
            var claims = new List<Claim>
            {
                new("BranchId", TestBranchId),
                new(ClaimTypes.Role, "SALES")
            };
            if (withUserId)
                claims.Add(new Claim(ClaimTypes.NameIdentifier, TestCashierId));
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
        var list = new List<ReturnResponse>
        {
            new("ret-1", "TH001", "inv-1", "HD001", TestBranchId, TestCashierId, "Dược sĩ", null, null, 150000m, "Hàng lỗi", "COMPLETED", DateTime.UtcNow, Array.Empty<ReturnItemResponse>())
        };
        returnServiceMock.Setup(s => s.GetByBranchAsync(TestBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(list);

        var controller = CreateController();

        // Act
        var result = await controller.GetByBranchAsync();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<ReturnResponse>>(okResult.Value);
        Assert.Single(returned);
        Assert.Equal("TH001", returned[0].ReturnNo);
    }

    [Fact]
    public async Task GetById_WhenExists_ReturnsOkWithReturn()
    {
        // Arrange
        var ret = new ReturnResponse(
            "ret-1", "TH001", "inv-1", "HD001", TestBranchId, TestCashierId, "Dược sĩ",
            null, null, 150000m, "Hàng lỗi", "COMPLETED", DateTime.UtcNow,
            new List<ReturnItemResponse>
            {
                new("drug-1", "TH01", "Paracetamol", "batch-1", "LOT01", 1, 150000m, 150000m, "RESTOCK")
            });

        returnServiceMock.Setup(s => s.GetByIdAsync("ret-1", TestBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ret);

        var controller = CreateController();

        // Act
        var result = await controller.GetByIdAsync("ret-1");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<ReturnResponse>(okResult.Value);
        Assert.Equal("TH001", returned.ReturnNo);
        Assert.Single(returned.Items);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        returnServiceMock.Setup(s => s.GetByIdAsync("ret-999", TestBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ReturnResponse?)null);

        var controller = CreateController();

        // Act
        var result = await controller.GetByIdAsync("ret-999");

        // Assert
        var notFound = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status404NotFound, notFound.StatusCode);
    }

    [Fact]
    public async Task LookupInvoice_WhenFound_ReturnsOk()
    {
        // Arrange
        var invoice = new ReturnableInvoiceResponse(
            "inv-1", "HD001", DateTime.UtcNow, 200000m, TestBranchId, "cus-1", "Khách hàng A", "0901234567",
            new List<ReturnableInvoiceItemResponse>
            {
                new("drug-1", "TH01", "Paracetamol", "batch-1", "LOT01", 2, 0, 2, 100000m)
            });

        returnServiceMock.Setup(s => s.LookupInvoiceForReturnAsync("HD001", TestBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(invoice);

        var controller = CreateController();

        // Act
        var result = await controller.LookupInvoiceAsync("HD001");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<ReturnableInvoiceResponse>(okResult.Value);
        Assert.Equal("HD001", returned.InvoiceNumber);
        Assert.Equal(2, returned.Items[0].AvailableToReturnQuantity);
    }

    [Fact]
    public async Task LookupInvoice_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        returnServiceMock.Setup(s => s.LookupInvoiceForReturnAsync("HD999", TestBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ReturnableInvoiceResponse?)null);

        var controller = CreateController();

        // Act
        var result = await controller.LookupInvoiceAsync("HD999");

        // Assert
        var notFound = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status404NotFound, notFound.StatusCode);
    }

    [Fact]
    public async Task Create_WithValidRequest_ReturnsCreatedAtAction()
    {
        // Arrange
        var request = new CreateReturnRequest(
            "inv-1",
            "Thuốc bị rách vỏ hộp",
            new List<CreateReturnItemRequest>
            {
                new("drug-1", "batch-1", 1, 100000m, "RESTOCK")
            });

        var created = new ReturnResponse(
            "ret-1", "TH001", "inv-1", "HD001", TestBranchId, TestCashierId, "Dược sĩ",
            null, null, 100000m, "Thuốc bị rách vỏ hộp", "COMPLETED", DateTime.UtcNow,
            new List<ReturnItemResponse>
            {
                new("drug-1", "TH01", "Paracetamol", "batch-1", "LOT01", 1, 100000m, 100000m, "RESTOCK")
            });

        returnServiceMock.Setup(s => s.CreateReturnAsync(request, TestBranchId, TestCashierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        var controller = CreateController();

        // Act
        var result = await controller.CreateAsync(request, "return-test-1");

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var response = Assert.IsType<ReturnResponse>(createdResult.Value);
        Assert.Equal("TH001", response.ReturnNo);
        Assert.Equal(100000m, response.TotalRefundAmount);
        await MvcResultTestHelper.ExecuteCreatedResultAsync(
            controller, createdResult, "Create", "/api/v1/returns", "https://localhost/api/v1/returns/ret-1");
    }

    [Fact]
    public async Task Create_WhenServiceThrowsInvalidOperation_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateReturnRequest(
            "inv-1",
            "Lỗi",
            new List<CreateReturnItemRequest>
            {
                new("drug-1", "batch-1", 99, 100000m, "RESTOCK")
            });

        returnServiceMock.Setup(s => s.CreateReturnAsync(request, TestBranchId, TestCashierId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Vượt quá số lượng có thể trả."));

        var controller = CreateController();

        // Act
        var result = await controller.CreateAsync(request, "return-test-2");

        // Assert
        var badRequest = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status422UnprocessableEntity, badRequest.StatusCode);
    }

    [Fact]
    public async Task Create_WhenUserIdClaimIsMissing_ReturnsForbidWithoutCallingService()
    {
        var request = new CreateReturnRequest(
            "inv-1",
            "Lỗi sản phẩm",
            new List<CreateReturnItemRequest> { new("drug-1", "batch-1", 1, 100000m) });
        var controller = CreateController(withUserId: false);

        var result = await controller.CreateAsync(request, "return-test-3");

        Assert.IsType<ForbidResult>(result.Result);
        returnServiceMock.Verify(service => service.CreateReturnAsync(
            It.IsAny<CreateReturnRequest>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Create_WhenIdempotencyKeyIsMissing_ReturnsBadRequestWithoutCallingService()
    {
        var request = new CreateReturnRequest(
            "inv-1",
            "Damaged item",
            new List<CreateReturnItemRequest> { new("drug-1", "batch-1", 1, 100000m) });
        var controller = CreateController();

        var result = await controller.CreateAsync(request);

        var badRequest = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status400BadRequest, badRequest.StatusCode);
        returnServiceMock.Verify(service => service.CreateReturnAsync(
            It.IsAny<CreateReturnRequest>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Create_WhenIdempotencyResponseExists_ReplaysWithoutCallingService()
    {
        var request = new CreateReturnRequest(
            "inv-1",
            "Damaged item",
            new List<CreateReturnItemRequest> { new("drug-1", "batch-1", 1, 100000m) });
        var cached = new ReturnResponse(
            "ret-1", "TH001", "inv-1", "HD001", TestBranchId, TestCashierId, "Cashier",
            null, null, 100000m, "Damaged item", "COMPLETED", DateTime.UtcNow,
            Array.Empty<ReturnItemResponse>());
        var cacheKey = $"return:{TestBranchId}:duplicate-key";
        idempotencyServiceMock
            .Setup(service => service.TryGet<ReturnResponse>(cacheKey, out cached))
            .Returns(true);
        var controller = CreateController();

        var result = await controller.CreateAsync(request, "duplicate-key");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(cached, ok.Value);
        Assert.Equal("true", controller.Response.Headers["X-Idempotent-Replayed"]);
        returnServiceMock.Verify(service => service.CreateReturnAsync(
            It.IsAny<CreateReturnRequest>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }
}
