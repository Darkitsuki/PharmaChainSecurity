using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PharmaSecure.Application.Common;
using PharmaSecure.Application.Features.Customers;
using PharmaSecure.Application.Features.Invoices;
using PharmaSecure.Application.Features.Sales;
using PharmaSecure.Application.Features.Security;
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
            Status: "CANCELLED",
            CancelledById: TestOwnerId,
            CancelledByName: "Chủ nhà thuốc",
            CancelledDate: DateTime.UtcNow,
            CancelReason: "Xuất nhầm số lượng cho khách"
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

    [Fact]
    public async Task CheckoutAsync_WhenCash_ForwardsExplicitPaidCashRequest()
    {
        var expected = new CheckoutResponse("inv-1", "HD-1", 100000m, "hash");
        checkoutServiceMock.Setup(service => service.CheckoutAsync(
                It.Is<CheckoutRequest>(request => request.PaymentMethod == "CASH" && !request.IsPendingPayment),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<CheckoutResponse>.Success(expected));
        var controller = CreateController();

        var result = await controller.CheckoutAsync(new CheckoutRequestBody(
            [new CheckoutLineBody("drug-1", "batch-1", 1)],
            PaymentMethod: "cash"));

        var created = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status201Created, created.StatusCode);
        Assert.Same(expected, created.Value);
    }

    [Theory]
    [InlineData("BANK_TRANSFER")]
    [InlineData("QR_CODE")]
    public async Task CheckoutAsync_WhenPaymentMethodIsNotSupported_FailsClosed(string paymentMethod)
    {
        var controller = CreateController();

        var result = await controller.CheckoutAsync(new CheckoutRequestBody(
            [new CheckoutLineBody("drug-1", "batch-1", 1)],
            PaymentMethod: paymentMethod));

        var rejected = Assert.IsType<UnprocessableEntityObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(rejected.Value);
        Assert.Equal(StatusCodes.Status422UnprocessableEntity, problem.Status);
        checkoutServiceMock.Verify(service => service.CheckoutAsync(
            It.IsAny<CheckoutRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PatientCheckoutAsync_WhenBankTransferIsNotConfigured_FailsBeforeCustomerOrInventoryWork()
    {
        var customerService = new Mock<ICustomerService>();
        var drugQueryService = new Mock<IDrugQueryService>();
        var controller = CreateController(isAuthenticated: false);
        var request = new PatientCheckoutRequest(
            "0901234567", "Khách hàng", null, null, "BANK_TRANSFER",
            [new CheckoutLineBody("drug-1", "batch-1", 1)]);

        var result = await controller.PatientCheckoutAsync(
            request, customerService.Object, drugQueryService.Object);

        var rejected = Assert.IsType<UnprocessableEntityObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(rejected.Value);
        Assert.Equal(StatusCodes.Status422UnprocessableEntity, problem.Status);
        customerService.VerifyNoOtherCalls();
        drugQueryService.VerifyNoOtherCalls();
        checkoutServiceMock.Verify(service => service.CheckoutAsync(
            It.IsAny<CheckoutRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
