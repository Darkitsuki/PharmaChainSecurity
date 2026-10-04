namespace PharmaSecure.Application.Features.Customers;

public sealed record CustomerResponse(
    string Id,
    string CustomerCode,
    string FullName,
    string PhoneNumber,
    string? Email,
    string? Address,
    string? BranchId,
    decimal TotalSpent,
    int Points,
    bool IsActive,
    DateTime CreatedDate);

public sealed record CreateCustomerRequest(
    string FullName,
    string PhoneNumber,
    string? CustomerCode = null,
    string? Email = null,
    string? Address = null);

public sealed record UpdateCustomerRequest(
    string FullName,
    string PhoneNumber,
    string? Email = null,
    string? Address = null,
    bool? IsActive = null);
