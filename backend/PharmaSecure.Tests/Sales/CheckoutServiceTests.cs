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
}