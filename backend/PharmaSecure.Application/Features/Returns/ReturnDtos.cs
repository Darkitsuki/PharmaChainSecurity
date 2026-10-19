namespace PharmaSecure.Application.Features.Returns;

public sealed record ReturnItemResponse(
    string DrugId,
    string DrugCode,
    string DrugName,
    string BatchId,
    string BatchNo,
    int Quantity,
    decimal RefundPrice,
    decimal SubTotal,
    string ActionType);

public sealed record ReturnResponse(
    string Id,
    string ReturnNo,
    string InvoiceId,
    string InvoiceNo,
    string BranchId,
    string CashierId,
    string CashierName,
    string? CustomerId,
    string? CustomerName,
    decimal TotalRefundAmount,
    string Reason,
    string Status,
    DateTime CreatedDate,
    IReadOnlyList<ReturnItemResponse> Items);

public sealed record CreateReturnItemRequest(
    string DrugId,
    string BatchId,
    int Quantity,
    decimal RefundPrice,
    string ActionType = "RESTOCK");

public sealed record CreateReturnRequest(
    string InvoiceId,
    string Reason,
    IReadOnlyList<CreateReturnItemRequest> Items);

public sealed record ReturnableInvoiceItemResponse(
    string DrugId,
    string DrugCode,
    string DrugName,
    string BatchId,
    string BatchNo,
    int OriginalQuantity,
    int ReturnedQuantity,
    int AvailableToReturnQuantity,
    decimal UnitPrice);

public sealed record ReturnableInvoiceResponse(
    string InvoiceId,
    string InvoiceNumber,
    DateTime CreatedDate,
    decimal TotalAmount,
    string BranchId,
    string? CustomerId,
    string? CustomerName,
    string? CustomerPhone,
    IReadOnlyList<ReturnableInvoiceItemResponse> Items);
