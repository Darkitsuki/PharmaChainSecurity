namespace PharmaSecure.Application.Features.Customers;

public interface ICustomerService
{
    Task<IReadOnlyList<CustomerResponse>> GetCustomersAsync(string? search = null, string? phone = null, CancellationToken cancellationToken = default);
    Task<CustomerResponse?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<CustomerResponse?> GetByPhoneAsync(string phone, CancellationToken cancellationToken = default);
    Task<CustomerResponse> CreateAsync(CreateCustomerRequest request, string branchId, CancellationToken cancellationToken = default);
    Task<CustomerResponse?> UpdateAsync(string id, UpdateCustomerRequest request, CancellationToken cancellationToken = default);
}
