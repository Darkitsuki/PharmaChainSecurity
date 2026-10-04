using Moq;
using PharmaSecure.Application.Features.Sales;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Entities;
using Xunit;

namespace PharmaSecure.Tests.Sales;

public class CheckoutServiceTests
{
    [Fact]
    public async Task CheckoutAsync_WhenQuantityExceedsInventory_ReturnsSpecificFailureAndRollsBack()
    {
        var unitOfWork = new Mock<IUnitOfWork>();
        unitOfWork.Setup(work => work.BeginTransactionAsync("branch-1", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        unitOfWork.Setup(work => work.RollbackAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var inventoryRepository = new Mock<IInventoryRepository>();
        inventoryRepository.Setup(repository => repository.LockRowForUpdateAsync(
                "branch-1", "drug-1", "batch-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Inventory("branch-1", "drug-1", "batch-1", 1));

        var invoicePersistence = new Mock<IInvoicePersistence>();
        var digitalSignatureService = new Mock<IDigitalSignatureService>();
        var service = new CheckoutService(
            unitOfWork.Object,
            inventoryRepository.Object,
            invoicePersistence.Object,
            digitalSignatureService.Object);

        var result = await service.CheckoutAsync(new CheckoutRequest(
            "branch-1",
            "cashier-1",
            [new CheckoutLineRequest("drug-1", "batch-1", 2)]));

        Assert.True(result.IsFailure);
        Assert.Equal("Insufficient stock for the selected batch.", result.Error);
        unitOfWork.Verify(work => work.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
        invoicePersistence.Verify(persistence => persistence.GetDrugPriceAsync(
            It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckoutAsync_WhenInvoiceSigningThrows_RollsBackAndPreservesSigningFailure()
    {
        var unitOfWork = new Mock<IUnitOfWork>();
        unitOfWork.Setup(work => work.BeginTransactionAsync("branch-1", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        unitOfWork.Setup(work => work.RollbackAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var inventoryRepository = new Mock<IInventoryRepository>();
        inventoryRepository.Setup(repository => repository.LockRowForUpdateAsync(
                "branch-1", "drug-1", "batch-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Inventory("branch-1", "drug-1", "batch-1", 5));

        var invoicePersistence = new Mock<IInvoicePersistence>();
        invoicePersistence.Setup(persistence => persistence.GetDrugPriceAsync(
                "drug-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(10m);

        var signingError = new InvalidOperationException("Signing configuration is missing.");
        var digitalSignatureService = new Mock<IDigitalSignatureService>();
        digitalSignatureService.Setup(signature => signature.SignInvoice(It.IsAny<Invoice>()))
            .Throws(signingError);

        var service = new CheckoutService(
            unitOfWork.Object,
            inventoryRepository.Object,
            invoicePersistence.Object,
            digitalSignatureService.Object);

        var exception = await Assert.ThrowsAsync<DigitalSignatureException>(() => service.CheckoutAsync(new CheckoutRequest(
            "branch-1",
            "cashier-1",
            [new CheckoutLineRequest("drug-1", "batch-1", 2)])));

        Assert.Same(signingError, exception.InnerException);
        unitOfWork.Verify(work => work.RollbackAsync(CancellationToken.None), Times.Once);
        invoicePersistence.Verify(persistence => persistence.SaveAsync(
            It.IsAny<Invoice>(), It.IsAny<DigitalSignature>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckoutAsync_WithValidCustomer_SucceedsAndAssociatesCustomer()
    {
        var unitOfWork = new Mock<IUnitOfWork>();
        unitOfWork.Setup(work => work.BeginTransactionAsync("branch-1", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        unitOfWork.Setup(work => work.CommitAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var inventoryRepository = new Mock<IInventoryRepository>();
        inventoryRepository.Setup(repository => repository.LockRowForUpdateAsync(
                "branch-1", "drug-1", "batch-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Inventory("branch-1", "drug-1", "batch-1", 5));

        var invoicePersistence = new Mock<IInvoicePersistence>();
        invoicePersistence.Setup(p => p.GetDrugPriceAsync("drug-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(25000m);
        invoicePersistence.Setup(p => p.GetCustomerNameAsync("cus-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync("Nguyen Thi Mai");

        var digitalSignatureService = new Mock<IDigitalSignatureService>();
        digitalSignatureService.Setup(s => s.SignInvoice(It.IsAny<Invoice>()))
            .Returns(new InvoiceSignatureResult("fakehash123", "fakesig", "cert-01", DateTime.UtcNow));

        var service = new CheckoutService(
            unitOfWork.Object,
            inventoryRepository.Object,
            invoicePersistence.Object,
            digitalSignatureService.Object);

        var result = await service.CheckoutAsync(new CheckoutRequest(
            "branch-1",
            "cashier-1",
            [new CheckoutLineRequest("drug-1", "batch-1", 2)],
            "cus-1"));

        Assert.True(result.IsSuccess);
        Assert.Equal("cus-1", result.Value.CustomerId);
        Assert.Equal("Nguyen Thi Mai", result.Value.CustomerName);
        Assert.Equal(50000m, result.Value.TotalAmount);
        unitOfWork.Verify(w => w.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        invoicePersistence.Verify(p => p.SaveAsync(
            It.Is<Invoice>(inv => inv.CustomerId == "cus-1"),
            It.IsAny<DigitalSignature>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CheckoutAsync_WhenCustomerNotFound_FailsAndRollsBack()
    {
        var unitOfWork = new Mock<IUnitOfWork>();
        unitOfWork.Setup(work => work.BeginTransactionAsync("branch-1", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        unitOfWork.Setup(work => work.RollbackAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var inventoryRepository = new Mock<IInventoryRepository>();
        var invoicePersistence = new Mock<IInvoicePersistence>();
        invoicePersistence.Setup(p => p.GetCustomerNameAsync("invalid-cus", It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        var digitalSignatureService = new Mock<IDigitalSignatureService>();

        var service = new CheckoutService(
            unitOfWork.Object,
            inventoryRepository.Object,
            invoicePersistence.Object,
            digitalSignatureService.Object);

        var result = await service.CheckoutAsync(new CheckoutRequest(
            "branch-1",
            "cashier-1",
            [new CheckoutLineRequest("drug-1", "batch-1", 1)],
            "invalid-cus"));

        Assert.True(result.IsFailure);
        Assert.Equal("Customer was not found or is inactive.", result.Error);
        unitOfWork.Verify(w => w.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}