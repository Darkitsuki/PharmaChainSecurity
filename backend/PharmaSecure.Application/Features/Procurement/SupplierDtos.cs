namespace PharmaSecure.Application.Features.Procurement;

public sealed record SupplierResponse(
    string Id,
    string SupplierCode,
    string SupplierName,
    string? ContactPerson,
    string? PhoneNumber,
    string? Email,
    string? Address,
    string? TaxCode,
    bool IsActive,
    DateTime CreatedDate);

public sealed record CreateSupplierRequest(
    string SupplierCode,
    string SupplierName,
    string? ContactPerson,
    string? PhoneNumber,
    string? Email,
    string? Address,
    string? TaxCode);
