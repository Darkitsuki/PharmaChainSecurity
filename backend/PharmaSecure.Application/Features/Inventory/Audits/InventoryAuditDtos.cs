namespace PharmaSecure.Application.Features.Inventory.Audits;

public sealed record InventoryAuditItemDto(
    string DrugId,
    string DrugCode,
    string DrugName,
    string? ActiveIngredient,
    string? Unit,
    string BatchId,
    string BatchNumber,
    DateTime ExpiryDate,
    int SystemQuantity,
    int ActualQuantity,
    int DiscrepancyQuantity,
    decimal UnitPrice,
    decimal DiscrepancyValue,
    string? Reason);

public sealed record InventoryAuditResponse(
    string Id,
    string AuditNo,
    string BranchId,
    string CreatedBy,
    string CreatorName,
    string? ApprovedBy,
    string? ApproverName,
    DateTime AuditDate,
    DateTime? ApprovedDate,
    string Status,
    int TotalItemsCount,
    int MatchedCount,
    int DiscrepancyCount,
    decimal TotalDiscrepancyValue,
    string? Notes,
    DateTime CreatedDate);

public sealed record InventoryAuditDetailResponse(
    string Id,
    string AuditNo,
    string BranchId,
    string CreatedBy,
    string CreatorName,
    string? ApprovedBy,
    string? ApproverName,
    DateTime AuditDate,
    DateTime? ApprovedDate,
    string Status,
    int TotalItemsCount,
    int MatchedCount,
    int DiscrepancyCount,
    decimal TotalDiscrepancyValue,
    string? Notes,
    DateTime CreatedDate,
    IReadOnlyList<InventoryAuditItemDto> Items);

public sealed record CreateInventoryAuditRequest(
    string? Notes);

public sealed record CountedItemInput(
    string DrugId,
    string BatchId,
    int ActualQuantity,
    string? Reason);

public sealed record UpdateAuditItemsRequest(
    IReadOnlyList<CountedItemInput> Items);

public sealed record ReconcileAuditRequest(
    string? Notes);
