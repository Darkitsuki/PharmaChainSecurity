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
    string? ExchangeInvoiceId,
    string? ExchangeInvoiceNo,
    decimal ReplacementTotalAmount,
    decimal BalanceDifference,
    string TransactionType,
    string SettlementStatus,
    string Reason,
    string Status,
    DateTime CreatedDate,
    IReadOnlyList<ReturnItemResponse> Items)
{
    public ReturnResponse(
        string id,
        string returnNo,
        string invoiceId,
        string invoiceNo,
        string branchId,
        string cashierId,
        string cashierName,
        string? customerId,
        string? customerName,
        decimal totalRefundAmount,
        string reason,
        string status,
        DateTime createdDate,
        IReadOnlyList<ReturnItemResponse> items)
        : this(
            id, returnNo, invoiceId, invoiceNo, branchId, cashierId, cashierName,
            customerId, customerName, totalRefundAmount, null, null, 0m,
            -totalRefundAmount, "RETURN", "REFUND_REQUIRED", reason, status,
            createdDate, items)
    {
    }
}

public sealed record CreateReturnItemRequest(
    string DrugId,
    string BatchId,
    int Quantity,
    decimal RefundPrice,
    string ActionType = "DISCARD",
    bool RestockInspectionConfirmed = false);

public sealed record CreateExchangeItemRequest(
    string DrugId,
    string BatchId,
    int Quantity);

public sealed record CreateReturnRequest(
    string InvoiceId,
    string Reason,
    IReadOnlyList<CreateReturnItemRequest> Items,
    string TransactionType = "RETURN",
    IReadOnlyList<CreateExchangeItemRequest>? ReplacementItems = null,
    string PaymentMethod = "CASH",
    bool SettlementConfirmed = false);

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
