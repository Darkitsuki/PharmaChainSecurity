using PharmaSecure.Application.Common;

namespace PharmaSecure.Application.Features.Invoices;

public sealed record CancelInvoiceRequest(string Reason);

public sealed record InvoiceResponse(
    string InvoiceId,
    string InvoiceNumber,
    DateTime CreatedDate,
    decimal TotalAmount,
    string BranchId,
    string CashierId,
    string Status = "COMPLETED",
    string PaymentMethod = "CASH",
    string PaymentStatus = "PAID",
    decimal PaidAmount = 0,
    DateTime? PaidAt = null,
    string? CancelledById = null,
    string? CancelledByName = null,
    DateTime? CancelledDate = null,
    string? CancelReason = null,
    DateTime? LastVerifiedAt = null,
    string? VerifiedById = null,
    string? VerifiedByName = null);

public sealed record InvoiceItemResponse(
    string DrugId,
    string DrugCode,
    string DrugName,
    string BatchId,
    int Quantity,
    decimal UnitPrice,
    decimal SubTotal);

public sealed record InvoiceSignatureResponse(
    string HashValueSha256,
    string SignatureData,
    string CertificateSerial,
    DateTime SignedAt,
    string Status = "VALID",
    DateTime? RevokedAt = null,
    string? RevokedReason = null);

public sealed record InvoiceDetailResponse(
    string InvoiceId,
    string InvoiceNumber,
    DateTime CreatedDate,
    decimal TotalAmount,
    string BranchId,
    string CashierId,
    IReadOnlyCollection<InvoiceItemResponse> Items,
    InvoiceSignatureResponse? Signature,
    string? CustomerId = null,
    string? CustomerName = null,
    string? CustomerPhone = null,
    string Status = "COMPLETED",
    string PaymentMethod = "CASH",
    string PaymentStatus = "PAID",
    decimal PaidAmount = 0,
    DateTime? PaidAt = null,
    string? CancelledById = null,
    string? CancelledByName = null,
    DateTime? CancelledDate = null,
    string? CancelReason = null,
    DateTime? LastVerifiedAt = null,
    string? VerifiedById = null,
    string? VerifiedByName = null);

public sealed record InvoiceVerificationResult(
    string InvoiceId,
    string InvoiceNumber,
    bool IsValid,
    string CalculatedHashSha256,
    string StoredHashSha256,
    string CertificateSerial,
    DateTime SignedAt,
    string Message,
    DateTime? LastVerifiedAt = null,
    string? VerifiedByName = null);

public sealed record PatientOrderItemDto(
    string DrugId,
    string DrugCode,
    string DrugName,
    string BatchId,
    int Quantity,
    decimal UnitPrice,
    decimal SubTotal);

public sealed record PatientOrderSummaryDto(
    string InvoiceId,
    string InvoiceNumber,
    DateTime CreatedDate,
    decimal TotalAmount,
    string BranchId,
    string BranchName,
    string Status,
    string PaymentMethod,
    string PaymentStatus,
    decimal PaidAmount,
    DateTime? PaidAt,
    string? CancelReason,
    DateTime? CancelledDate,
    string? HashValueSha256,
    string? CustomerName,
    string? PhoneNumber,
    string? DeliveryAddress,
    IReadOnlyCollection<PatientOrderItemDto> Items);

public interface IInvoiceQueryService
{
    Task<PagedResult<InvoiceResponse>> GetPageAsync(
        string branchId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<InvoiceDetailResponse?> GetByIdAsync(
        string branchId,
        string id,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<InvoiceItemResponse>> GetItemsAsync(
        string branchId,
        string invoiceId,
        CancellationToken cancellationToken = default);

    Task<InvoiceVerificationResult?> VerifyInvoiceSignatureAsync(
        string branchId,
        string invoiceId,
        string? verifiedById = null,
        CancellationToken cancellationToken = default);

    Task<InvoiceDetailResponse> CancelInvoiceAsync(
        string branchId,
        string invoiceId,
        string ownerId,
        CancelInvoiceRequest request,
        CancellationToken cancellationToken = default);

    Task<InvoiceDetailResponse> ConfirmPaymentAsync(
        string branchId,
        string invoiceId,
        string cashierId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<PatientOrderSummaryDto>> GetPatientOrdersAsync(
        string phoneNumber,
        CancellationToken cancellationToken = default);
}
