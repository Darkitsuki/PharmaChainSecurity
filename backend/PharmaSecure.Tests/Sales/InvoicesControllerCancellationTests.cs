using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PharmaSecure.Application.Common;
using PharmaSecure.Application.Features.Invoices;
using PharmaSecure.Application.Features.Sales;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Sales;

public class InvoicesControllerCancellationTests
{
    private readonly Mock<ICheckoutService> checkoutServiceMock = new();
    private readonly Mock<IInvoiceQueryService> invoiceQueryServiceMock = new();
    private readonly Mock<ICurrentUserContext> currentUserContextMock = new();
    private readonly Mock<IIdempotencyService> idempotencyServiceMock = new();
    private readonly Mock<ILogger<InvoicesController>> loggerMock = new();

    private const string TestBranchId = "br-00000000-0000-0000-0000-000000000001";
    private const string TestOwnerId = "us-00000000-0000-0000-0000-000000000001";
    private const string TestInvoiceId = "inv-00000000-0000-0000-0000-000000000001";

    private InvoicesController CreateController(bool isAuthenticated = true)
    {
        currentUserContextMock.Setup(c => c.IsAuthenticated).Returns(isAuthenticated);
        currentUserContextMock.Setup(c => c.BranchId).Returns(isAuthenticated ? TestBranchId : string.Empty);
        currentUserContextMock.Setup(c => c.UserId).Returns(isAuthenticated ? TestOwnerId : string.Empty);

        return new InvoicesController(
            checkoutServiceMock.Object,
            invoiceQueryServiceMock.Object,
            currentUserContextMock.Object,
            idempotencyServiceMock.Object,
            loggerMock.Object);
    }

    [Fact]
    public async Task CancelAsync_WhenValid_ReturnsOkWithCancelledDetail()
    {
        // Arrange
        var request = new CancelInvoiceRequest("Xuất nhầm số lượng cho khách");
        var expectedDetail = new InvoiceDetailResponse(
            TestInvoiceId, "HD20261020-001", DateTime.UtcNow, 250000m, TestBranchId, TestOwnerId,
            Array.Empty<InvoiceItemResponse>(), null, null, null, null,
            "CANCELLED", TestOwnerId, "Chủ nhà thuốc", DateTime.UtcNow, "Xuất nhầm số lượng cho khách"
        );

        invoiceQueryServiceMock.Setup(s => s.CancelInvoiceAsync(
                TestBranchId, TestInvoiceId, TestOwnerId, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDetail);

        var controller = CreateController();

        // Act
        var result = await controller.CancelAsync(TestInvoiceId, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<InvoiceDetailResponse>(okResult.Value);
        Assert.Equal("CANCELLED", returned.Status);
        Assert.Equal("Xuất nhầm số lượng cho khách", returned.CancelReason);
    }

    [Fact]
    public async Task CancelAsync_WhenEmptyId_ReturnsProblem400()
    {
        // Arrange
        var controller = CreateController();

        // Act
        var result = await controller.CancelAsync(string.Empty, new CancelInvoiceRequest("Lý do"));

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        var problem = Assert.IsType<ProblemDetails>(objectResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, problem.Status);
    }

    [Fact]
    public async Task CancelAsync_WhenEmptyReason_ReturnsProblem400()
    {
        // Arrange
        var controller = CreateController();

        // Act
        var result = await controller.CancelAsync(TestInvoiceId, new CancelInvoiceRequest("  "));

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        var problem = Assert.IsType<ProblemDetails>(objectResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, problem.Status);
    }

    [Fact]
    public async Task CancelAsync_WhenNotAuthenticated_ReturnsUnauthorized()
    {
        // Arrange
        var controller = CreateController(isAuthenticated: false);

        // Act
        var result = await controller.CancelAsync(TestInvoiceId, new CancelInvoiceRequest("Lý do"));

        // Assert
        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task CancelAsync_WhenAlreadyCancelled_ReturnsProblem400()
    {
        // Arrange
        var request = new CancelInvoiceRequest("Lý do hủy lại");
        invoiceQueryServiceMock.Setup(s => s.CancelInvoiceAsync(
                TestBranchId, TestInvoiceId, TestOwnerId, request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Hóa đơn đã bị hủy từ trước, không thể hủy lại."));

        var controller = CreateController();

        // Act
        var result = await controller.CancelAsync(TestInvoiceId, request);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        var problem = Assert.IsType<ProblemDetails>(objectResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, problem.Status);
        Assert.Equal("Hóa đơn đã bị hủy từ trước, không thể hủy lại.", problem.Title);
    }
}
