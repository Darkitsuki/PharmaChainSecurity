using System.Text.Json.Serialization;
using PharmaSecure.Application.Common;

namespace PharmaSecure.Application.Features.Procurement;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record CreatePurchaseOrderRequest(string SupplierId, string? Notes,
    DateTime? ExpectedDeliveryDate, IReadOnlyList<CreatePurchaseOrderItem> Items);
public sealed record CreatePurchaseOrderItem(string DrugId, int Quantity, decimal EstimatedUnitPrice, string? Notes = null);
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record PurchaseOrderDecisionRequest(string? Reason);
public sealed record PurchaseOrderItemResponse(string DrugId, string DrugName, int Quantity,
    decimal EstimatedUnitPrice, decimal SubTotal, int ReceivedQuantity, string? Notes);
public sealed record PurchaseOrderReceiptResponse(string Id, string ReceiptNo, DateTime CreatedDate, string Status);
public sealed record PurchaseOrderResponse(string Id, string OrderNo, string BranchId, string SupplierId,
    string SupplierName, string CreatedBy, string CreatorName, string? ApprovedBy, string? ApproverName,
    decimal TotalEstimatedAmount, string Status, DateTime? ApprovedDate, DateTime? ExpectedDeliveryDate,
    string? Notes, DateTime CreatedDate, IReadOnlyList<PurchaseOrderItemResponse> Items,
    IReadOnlyList<PurchaseOrderReceiptResponse> Receipts);

public interface IPurchaseOrderService
{
    Task<PagedResult<PurchaseOrderResponse>> GetAsync(int page, int pageSize, string? status, CancellationToken cancellationToken = default);
    Task<PurchaseOrderResponse> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<PurchaseOrderResponse> CreateAsync(CreatePurchaseOrderRequest request, CancellationToken cancellationToken = default);
    Task<PurchaseOrderResponse> DecideAsync(string id, bool approve, string? reason, CancellationToken cancellationToken = default);
    Task<PurchaseOrderResponse> PlaceAsync(string id, CancellationToken cancellationToken = default);
}
