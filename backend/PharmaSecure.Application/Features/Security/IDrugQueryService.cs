using PharmaSecure.Application.Common;

namespace PharmaSecure.Application.Features.Security;

public sealed record DrugResponse(
    string DrugId,
    string DrugCode,
    string Name,
    string? ActiveIngredient,
    string Unit,
    decimal Price);

public sealed record DrugBatchResponse(
    string BatchId,
    string DrugId,
    string BatchNo,
    DateTime? MfgDate,
    DateTime ExpiryDate,
    int StockQuantity);

public interface IDrugQueryService
{
    Task<PagedResult<DrugResponse>> GetPageAsync(
        string branchId,
        int page,
        int pageSize,
        string? search = null,
        CancellationToken cancellationToken = default);

    Task<DrugResponse?> GetByIdAsync(
        string branchId,
        string id,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<DrugBatchResponse>> GetBatchesAsync(
        string branchId,
        string drugId,
        CancellationToken cancellationToken = default);
}