using PharmaSecure.Application.Common;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Entities;
using DomainInventory = PharmaSecure.Domain.Entities.Inventory;

namespace PharmaSecure.Application.Features.Sales;

public sealed class CheckoutService : ICheckoutService
{
    private readonly IUnitOfWork unitOfWork;
    private readonly IInventoryRepository inventoryRepository;
    private readonly IInvoicePersistence invoicePersistence;
    private readonly IDigitalSignatureService digitalSignatureService;

    public CheckoutService(
        IUnitOfWork unitOfWork,
        IInventoryRepository inventoryRepository,
        IInvoicePersistence invoicePersistence,
        IDigitalSignatureService digitalSignatureService)
    {
        this.unitOfWork = unitOfWork;
        this.inventoryRepository = inventoryRepository;
        this.invoicePersistence = invoicePersistence;
        this.digitalSignatureService = digitalSignatureService;
    }

    public async Task<Result<CheckoutResponse>> CheckoutAsync(
        CheckoutRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.BranchId) || string.IsNullOrWhiteSpace(request.CashierId))
            return Result<CheckoutResponse>.Failure("Branch and cashier are required.");
        if (request.Lines is null || request.Lines.Count == 0)
            return Result<CheckoutResponse>.Failure("At least one invoice line is required.");
        if (request.Lines.Any(line => string.IsNullOrWhiteSpace(line.DrugId) || string.IsNullOrWhiteSpace(line.BatchId) || line.Quantity <= 0))
            return Result<CheckoutResponse>.Failure("Invoice lines are invalid.");
        if (request.Lines.GroupBy(line => $"{line.DrugId}\u001f{line.BatchId}").Any(group => group.Count() > 1))
            return Result<CheckoutResponse>.Failure("Duplicate inventory lines are not allowed.");

        try
        {
            await unitOfWork.BeginTransactionAsync(request.BranchId, cancellationToken);

            var invoice = new Invoice(
                invoiceNumber: $"HD{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..24],
                branchId: request.BranchId,
                cashierId: request.CashierId);
            var lockedInventory = new List<DomainInventory>();

            foreach (var line in request.Lines.OrderBy(line => line.DrugId).ThenBy(line => line.BatchId))
            {
                var inventory = await inventoryRepository.LockRowForUpdateAsync(
                    request.BranchId,
                    line.DrugId,
                    line.BatchId,
                    cancellationToken);
                if (inventory is null)
                    return await RollbackAsync<CheckoutResponse>("Inventory row was not found.", cancellationToken);

                var unitPrice = await invoicePersistence.GetDrugPriceAsync(line.DrugId, cancellationToken);
                if (unitPrice is null)
                    return await RollbackAsync<CheckoutResponse>("Drug was not found.", cancellationToken);

                inventory.DecreaseQuantity(line.Quantity);
                lockedInventory.Add(inventory);
                invoice.AddItem(new InvoiceItem(invoice.Id, line.DrugId, line.BatchId, line.Quantity, unitPrice.Value));
            }

            invoice.MarkAsPaid();
            invoice.LockInvoice();
            var signatureResult = digitalSignatureService.SignInvoice(invoice);
            var digitalSignature = new DigitalSignature(
                invoice.Id,
                signatureResult.HashValueSha256,
                signatureResult.SignatureData,
                signatureResult.CertificateSerial,
                signatureResult.SignedAt);

            foreach (var inventory in lockedInventory)
                await inventoryRepository.UpdateQuantityAsync(inventory, cancellationToken);

            await invoicePersistence.SaveAsync(invoice, digitalSignature, cancellationToken);
            await unitOfWork.CommitAsync(cancellationToken);

            return Result<CheckoutResponse>.Success(new CheckoutResponse(
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.TotalAmount,
                signatureResult.HashValueSha256));
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            return Result<CheckoutResponse>.Failure("Checkout failed and was rolled back.");
        }
    }

    private async Task<Result<T>> RollbackAsync<T>(string error, CancellationToken cancellationToken)
    {
        await unitOfWork.RollbackAsync(cancellationToken);
        return Result<T>.Failure(error);
    }
}