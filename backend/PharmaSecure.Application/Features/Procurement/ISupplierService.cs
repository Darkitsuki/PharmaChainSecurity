namespace PharmaSecure.Application.Features.Procurement;

public interface ISupplierService
{
    Task<IReadOnlyList<SupplierResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<SupplierResponse?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<SupplierResponse> CreateAsync(CreateSupplierRequest request, CancellationToken cancellationToken = default);
    Task<SupplierResponse?> UpdateAsync(string id, UpdateSupplierRequest request, CancellationToken cancellationToken = default);
    Task<SupplierResponse?> UpdateStatusAsync(string id, bool isActive, CancellationToken cancellationToken = default);
}
