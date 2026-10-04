namespace PharmaSecure.Application.Features.Procurement;

public interface IGoodsReceiptService
{
    Task<IReadOnlyList<GoodsReceiptResponse>> GetByBranchAsync(string branchId, CancellationToken cancellationToken = default);
    Task<GoodsReceiptResponse?> GetByIdAsync(string id, string branchId, CancellationToken cancellationToken = default);
    Task<GoodsReceiptResponse> CreateReceiptAsync(string branchId, string warehouseStaffId, CreateGoodsReceiptRequest request, CancellationToken cancellationToken = default);
}
