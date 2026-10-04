using PharmaSecure.Application.Common;

namespace PharmaSecure.Application.Features.Security;

public sealed record DrugResponse(
    string DrugId,
    string DrugCode,
    string Name,
    string? ActiveIngredient,
    string Unit,
    decimal Price,
    bool IsActive = true);

public sealed record DrugBatchResponse(
    string BatchId,
    string DrugId,
    string BatchNo,
    DateTime? MfgDate,
    DateTime ExpiryDate,
    int StockQuantity);

public sealed record CreateDrugRequest(
    string DrugCode,
    string Name,
    string? ActiveIngredient,
    string Unit,
    decimal Price);

public sealed record UpdateDrugRequest(
    string Name,
    string? ActiveIngredient,
    string Unit,
    decimal Price,
    bool IsActive);

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

    Task<DrugResponse> CreateDrugAsync(
        string branchId,
        CreateDrugRequest request,
        CancellationToken cancellationToken = default);

    Task<DrugResponse?> UpdateDrugAsync(
        string branchId,
        string drugId,
        UpdateDrugRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DeactivateDrugAsync(
        string branchId,
        string drugId,
        CancellationToken cancellationToken = default);
}