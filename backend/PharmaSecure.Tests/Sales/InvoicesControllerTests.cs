using System.Reflection;
using Microsoft.AspNetCore.Authorization;
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

public class InvoicesControllerTests
{
    private readonly Mock<ICheckoutService> checkoutServiceMock = new();
    private readonly Mock<IInvoiceQueryService> invoiceQueryServiceMock = new();
    private readonly Mock<ICurrentUserContext> currentUserContextMock = new();
    private readonly Mock<IIdempotencyService> idempotencyServiceMock = new();
    private readonly Mock<ILogger<InvoicesController>> loggerMock = new();

    private const string TestBranchId = "br-00000000-0000-0000-0000-000000000001";
    private const string TestUserId = "us-00000000-0000-0000-0000-000000000001";

    private InvoicesController CreateController(bool isAuthenticated = true)
    {
        currentUserContextMock.Setup(c => c.IsAuthenticated).Returns(isAuthenticated);
        currentUserContextMock.Setup(c => c.BranchId).Returns(isAuthenticated ? TestBranchId : string.Empty);
        currentUserContextMock.Setup(c => c.UserId).Returns(isAuthenticated ? TestUserId : string.Empty);

        return new InvoicesController(
            checkoutServiceMock.Object,
            invoiceQueryServiceMock.Object,
            currentUserContextMock.Object,
            idempotencyServiceMock.Object,
            loggerMock.Object);
    }

    [Theory]
    [InlineData(nameof(InvoicesController.GetPageAsync))]
    [InlineData(nameof(InvoicesController.GetByIdAsync))]
    [InlineData(nameof(InvoicesController.GetItemsAsync))]
    [InlineData(nameof(InvoicesController.VerifySignatureAsync))]
    public void ReadEndpoints_MustHaveAuthorizeRolesOwnerAndSales(string actionName)
    {
        // Arrange
        var method = typeof(InvoicesController).GetMethod(actionName);
        Assert.NotNull(method);

        // Act
        var authAttr = method.GetCustomAttribute<AuthorizeAttribute>();

        // Assert: Thẩm định phân quyền bắt buộc có [Authorize(Roles = "OWNER,SALES")]
        Assert.NotNull(authAttr);
        Assert.Equal("OWNER,SALES", authAttr.Roles);
    }

    [Fact]
    public async Task GetPatientOrdersAsync_WhenBranchIdProvided_PassesBranchIdToService()
    {
        // Arrange
        const string phone = "0901234567";
        const string targetBranchId = "br-00000000-0000-0000-0000-000000000002";
        invoiceQueryServiceMock.Setup(s => s.GetPatientOrdersAsync(phone, targetBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<PatientOrderSummaryDto>());

        var controller = CreateController();

        // Act
        var result = await controller.GetPatientOrdersAsync(phone, targetBranchId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        invoiceQueryServiceMock.Verify(s => s.GetPatientOrdersAsync(phone, targetBranchId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetPatientOrdersAsync_WhenBranchIdNull_PassesNullBranchIdToService()
    {
        // Arrange
        const string phone = "0901234567";
        invoiceQueryServiceMock.Setup(s => s.GetPatientOrdersAsync(phone, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<PatientOrderSummaryDto>());

        var controller = CreateController();

        // Act
        var result = await controller.GetPatientOrdersAsync(phone, null);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        invoiceQueryServiceMock.Verify(s => s.GetPatientOrdersAsync(phone, null, It.IsAny<CancellationToken>()), Times.Once);
    }
}

