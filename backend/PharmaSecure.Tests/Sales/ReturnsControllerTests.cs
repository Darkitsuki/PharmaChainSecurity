using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PharmaSecure.Application.Features.Returns;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Sales;

public class ReturnsControllerTests
{
    private readonly Mock<IReturnService> returnServiceMock = new();
    private const string TestBranchId = "br-00000000-0000-0000-0000-000000000001";
    private const string TestCashierId = "us-00000000-0000-0000-0000-000000000003";

    private ReturnsController CreateController(bool withUserClaims = true)
    {
        var controller = new ReturnsController(returnServiceMock.Object);
        var httpContext = new DefaultHttpContext();

        if (withUserClaims)
        {
            var claims = new List<Claim>
            {
                new("BranchId", TestBranchId),
                new(ClaimTypes.NameIdentifier, TestCashierId),
                new(ClaimTypes.Role, "SALES")
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
        var result = await controller.CreateAsync(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var response = Assert.IsType<ReturnResponse>(createdResult.Value);
        Assert.Equal("TH001", response.ReturnNo);
        Assert.Equal(100000m, response.TotalRefundAmount);
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
        var result = await controller.CreateAsync(request);

        // Assert
        var badRequest = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status400BadRequest, badRequest.StatusCode);
    }
}
