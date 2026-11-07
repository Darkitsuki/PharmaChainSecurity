using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PharmaSecure.Application.Features.Procurement;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Enums;
using PharmaSecure.Infrastructure.Persistence;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Procurement;

public sealed class PurchaseOrderTests
{
    private static CreatePurchaseOrderRequest Request(int quantity = 2, decimal price = 145500m)
        => new("supplier", null, null, new[] { new CreatePurchaseOrderItem("drug", quantity, price) });

    [Fact]
    public void Validate_WhenValid_CalculatesServerTotal()
    {
        var request = Request();
        var total = PurchaseOrderService.Validate(request);
        Assert.Equal(291000m, total);
    }
    [Theory]
    [InlineData(0, 1000)]
    [InlineData(-1, 1000)]
    [InlineData(1, 0)]
    [InlineData(1, -1)]
    [InlineData(1, 999)]
    [InlineData(1, 145500.5)]
    [InlineData(1, 10000000000000)]
    public void Validate_WhenQuantityOrPriceInvalid_RejectsInput(int qty, double price)
    {
        var request = Request(qty, (decimal)price);
        var error = Assert.Throws<ArgumentException>(() => PurchaseOrderService.Validate(request));
        Assert.NotEmpty(error.Message);
    }
    [Fact]
    public void Validate_WhenDrugRepeated_RejectsCompositeKeyCollision()
    {
        var request = Request() with { Items = new[] { new CreatePurchaseOrderItem("drug", 1, 1000), new CreatePurchaseOrderItem("drug", 2, 1000) } };
        Assert.Throws<ArgumentException>(() => PurchaseOrderService.Validate(request));
    }
    [Fact]
    public void Validate_WhenUnicodeNoteExceedsOracleByteLimit_RejectsBeforeTransaction()
    {
        var request = Request() with { Notes = new string('ệ', 200) };
        Assert.Throws<ArgumentException>(() => PurchaseOrderService.Validate(request));
    }
    [Theory]
    [InlineData(UserRole.WAREHOUSE)]
    [InlineData(UserRole.SALES)]
    public async Task Decide_WhenNotOwner_RejectsBeforeDatabase(UserRole role)
    {
        var unit = new Mock<IUnitOfWork>(MockBehavior.Strict);
        var context = new Mock<ICurrentUserContext>();
        context.SetupGet(x => x.IsAuthenticated).Returns(true);
        context.SetupGet(x => x.BranchId).Returns("branch");
        context.SetupGet(x => x.UserId).Returns("user");
        context.SetupGet(x => x.Role).Returns(role);
        var service = new PurchaseOrderService(unit.Object, context.Object);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.DecideAsync("order", true, null));
        unit.VerifyNoOtherCalls();
    }
    [Fact]
    public async Task Get_WhenBranchMissing_FailsClosedBeforeDatabase()
    {
        var unit = new Mock<IUnitOfWork>(MockBehavior.Strict);
        var context = new Mock<ICurrentUserContext>();
        context.SetupGet(x => x.IsAuthenticated).Returns(true);
        var service = new PurchaseOrderService(unit.Object, context.Object);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.GetByIdAsync("order"));
        unit.VerifyNoOtherCalls();
    }
    [Fact]
    public async Task Create_WhenMvcExecutesResult_Returns201AndLocation()
    {
        var request = Request();
        var service = new Mock<IPurchaseOrderService>();
        var response = new PurchaseOrderResponse("po-test", "PO-TEST", "branch", "supplier", "Supplier", "user", "Creator", null, null,
            25, "PENDING", null, null, null, new DateTime(2026, 11, 2), Array.Empty<PurchaseOrderItemResponse>(), Array.Empty<PurchaseOrderReceiptResponse>());
        service.Setup(x => x.CreateAsync(request, It.IsAny<CancellationToken>())).ReturnsAsync(response);
        var controller = new PurchaseOrdersController(service.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await controller.Create(request);
        await MvcResultTestHelper.ExecuteCreatedResultAsync(controller, result, "Create", "/api/v1/purchase-orders", "https://localhost/api/v1/purchase-orders/po-test");
        service.Verify(x => x.CreateAsync(request, It.IsAny<CancellationToken>()), Times.Once);
    }
}
