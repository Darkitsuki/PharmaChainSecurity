using PharmaSecure.Application.Features.Security;
using PharmaSecure.Application.Features.Customers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaSecure.Application.Common;
using PharmaSecure.Application.Features.Invoices;
using PharmaSecure.Application.Features.Sales;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.WebApi.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/invoices")]
public sealed class InvoicesController : ControllerBase
{
    private readonly ICheckoutService checkoutService;
    private readonly IInvoiceQueryService invoiceQueryService;
    private readonly ICurrentUserContext currentUserContext;
    private readonly IIdempotencyService idempotencyService;
    private readonly ILogger<InvoicesController> logger;

    public InvoicesController(
        ICheckoutService checkoutService,
        IInvoiceQueryService invoiceQueryService,
        ICurrentUserContext currentUserContext,
        IIdempotencyService idempotencyService,
        ILogger<InvoicesController> logger)
    {
        this.checkoutService = checkoutService;
        this.invoiceQueryService = invoiceQueryService;
        this.currentUserContext = currentUserContext;
        this.idempotencyService = idempotencyService;
        this.logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> GetPageAsync(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize is < 1 or > 100)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid pagination.");
        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.BranchId))
            return Unauthorized();

        return Ok(await invoiceQueryService.GetPageAsync(
            currentUserContext.BranchId,
            page,
            pageSize,
            cancellationToken));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceDetailResponse>> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invoice ID is required.");
        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.BranchId))
            return Unauthorized();

        var invoice = await invoiceQueryService.GetByIdAsync(currentUserContext.BranchId, id, cancellationToken);
        if (invoice is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Invoice was not found.");

        return Ok(invoice);
    }

    [HttpGet("{id}/items")]
    public async Task<ActionResult<IReadOnlyCollection<InvoiceItemResponse>>> GetItemsAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invoice ID is required.");
        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.BranchId))
            return Unauthorized();

        var items = await invoiceQueryService.GetItemsAsync(currentUserContext.BranchId, id, cancellationToken);
        return Ok(items);
    }

    [HttpPost("{id}/verify-signature")]
    public async Task<ActionResult<InvoiceVerificationResult>> VerifySignatureAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invoice ID is required.");
        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.BranchId))
            return Unauthorized();

        try
        {
            var result = await invoiceQueryService.VerifyInvoiceSignatureAsync(currentUserContext.BranchId, id, currentUserContext.UserId, cancellationToken);
            if (result is null)
                return Problem(statusCode: StatusCodes.Status404NotFound, title: "Invoice was not found.");
            return Ok(result);
        }
        catch (SignatureConfigurationException)
        {
            logger.LogWarning("Invoice verification unavailable: signing key configuration requires operator attention.");
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Signature verification is unavailable.",
                detail: "The verification key is missing or invalid. No successful verification was recorded.");
        }
    }

    [HttpPost]
    [HttpPost("checkout")]
    [HttpPost("~/api/v1/checkout")]
    [Authorize(Roles = "OWNER,SALES")]
    public async Task<ActionResult> CheckoutAsync(
        [FromBody] CheckoutRequestBody request,
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null,
        CancellationToken cancellationToken = default)
    {
        if (request.Lines is null || request.Lines.Count == 0)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "At least one invoice line is required.");
        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.UserId) || string.IsNullOrWhiteSpace(currentUserContext.BranchId))
            return Unauthorized();

        var paymentMethod = request.PaymentMethod?.Trim().ToUpperInvariant() ?? "CASH";
        if (!string.Equals(paymentMethod, "CASH", StringComparison.Ordinal))
        {
            return UnprocessableEntity(new ProblemDetails
            {
                Status = StatusCodes.Status422UnprocessableEntity,
                Title = "The selected payment method is not available.",
                Detail = "Bank transfer requires a configured payment provider and verified payment confirmation."
            });
        }

        var cacheKey = !string.IsNullOrWhiteSpace(idempotencyKey)
            ? $"checkout:{currentUserContext.BranchId}:{idempotencyKey.Trim()}"
            : null;

        if (cacheKey is not null && idempotencyService.TryGet<CheckoutResponse>(cacheKey, out var cachedResponse) && cachedResponse is not null)
        {
            Response.Headers["X-Idempotent-Replayed"] = "true";
            return StatusCode(StatusCodes.Status200OK, cachedResponse);
        }

        Result<CheckoutResponse> result;
        try
        {
            result = await checkoutService.CheckoutAsync(
                new CheckoutRequest(
                    currentUserContext.BranchId,
                    currentUserContext.UserId,
                    request.Lines.Select(line => new CheckoutLineRequest(line.DrugId, line.BatchId, line.Quantity)).ToArray(),
                    request.CustomerId,
                    paymentMethod,
                    IsPendingPayment: false),
                cancellationToken);
        }
        catch (DigitalSignatureException exception)
        {
            logger.LogError(exception, "Invoice signing failed during checkout for branch {BranchId}", currentUserContext.BranchId);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Invoice signing failed.",
                detail: "Checkout was rolled back because the invoice could not be signed.");
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Checkout failed for branch {BranchId}", currentUserContext.BranchId);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Checkout failed.",
                detail: "Checkout could not be completed due to an internal error.");
        }

        if (result.IsFailure)
            return UnprocessableEntity(new ProblemDetails { Title = result.Error, Status = StatusCodes.Status422UnprocessableEntity });

        if (cacheKey is not null)
            idempotencyService.Set(cacheKey, result.Value, TimeSpan.FromHours(24));

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpPost("patient/checkout")]
    [HttpPost("~/api/v1/patient/checkout")]
    [AllowAnonymous]
    public async Task<ActionResult> PatientCheckoutAsync(
        [FromBody] PatientCheckoutRequest request,
        [FromServices] ICustomerService customerService,
        [FromServices] IDrugQueryService drugQueryService,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dữ liệu đặt hàng không được rỗng.");
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Số điện thoại người nhận là bắt buộc.");
        if (request.Lines is null || request.Lines.Count == 0)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Đơn hàng phải có ít nhất một mặt hàng thuốc.");

        var patientPaymentMethod = request.PaymentMethod?.Trim().ToUpperInvariant() ?? "CASH";
        if (!string.Equals(patientPaymentMethod, "CASH", StringComparison.Ordinal))
        {
            return UnprocessableEntity(new ProblemDetails
            {
                Status = StatusCodes.Status422UnprocessableEntity,
                Title = "Phương thức thanh toán chưa khả dụng.",
                Detail = "Chuyển khoản chỉ được kích hoạt khi hệ thống có thể xác minh giao dịch ngân hàng."
            });
        }

        var branchId = !string.IsNullOrWhiteSpace(request.BranchId)
            ? request.BranchId
            : "br-00000000-0000-0000-0000-000000000001";

        var cashierId = branchId == "br-00000000-0000-0000-0000-000000000002"
            ? "us-00000000-0000-0000-0000-000000000005"
            : "us-00000000-0000-0000-0000-000000000003";

        try
        {
            var customer = await customerService.IdentifyAsync(
                new IdentifyCustomerRequest(
                    request.PhoneNumber.Trim(),
                    request.CustomerName?.Trim(),
                    request.DeliveryAddress?.Trim(),
                    branchId),
                cancellationToken);

            // Tự động resolve số lô thực tế theo FEFO nếu client chưa truyền hoặc truyền mã giả lập
            var checkoutLines = new List<CheckoutLineRequest>();
            foreach (var line in request.Lines)
            {
                var batchId = line.BatchId;
                if (string.IsNullOrWhiteSpace(batchId) || batchId.StartsWith("BATCH-", StringComparison.OrdinalIgnoreCase))
                {
                    var availableBatches = await drugQueryService.GetBatchesAsync(branchId, line.DrugId, cancellationToken);
                    var matchingBatch = availableBatches
                        .Where(b => b.StockQuantity >= line.Quantity && b.ExpiryDate > DateTime.UtcNow)
                        .OrderBy(b => b.ExpiryDate)
                        .FirstOrDefault()
                        ?? availableBatches
                            .Where(b => b.StockQuantity > 0)
                            .OrderBy(b => b.ExpiryDate)
                            .FirstOrDefault();

                    if (matchingBatch is null)
                    {
                        return UnprocessableEntity(new ProblemDetails
                        {
                            Title = "Tồn kho không đủ",
                            Detail = $"Mặt hàng thuốc tại chi nhánh tạm thời hết hàng hoặc không có lô khả dụng.",
                            Status = StatusCodes.Status422UnprocessableEntity
                        });
                    }

                    batchId = matchingBatch.BatchId;
                }

                checkoutLines.Add(new CheckoutLineRequest(line.DrugId, batchId, line.Quantity));
            }

            var result = await checkoutService.CheckoutAsync(
                new CheckoutRequest(
                    branchId,
                    cashierId,
                    checkoutLines.ToArray(),
                    customer.Id,
                    patientPaymentMethod,
                    IsPendingPayment: true),
                cancellationToken);

            if (result.IsFailure)
            {
                return UnprocessableEntity(new ProblemDetails
                {
                    Title = result.Error,
                    Status = StatusCodes.Status422UnprocessableEntity
                });
            }

            return StatusCode(StatusCodes.Status201Created, result.Value);
        }
        catch (DigitalSignatureException exception)
        {
            logger.LogError(exception, "Lỗi ký số hóa đơn đặt thuốc online cho chi nhánh {BranchId}", branchId);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Lỗi ký số hóa đơn điện tử.",
                detail: "Đơn hàng bị hoàn tác vì không thể ký số hóa đơn.");
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Lỗi tiếp nhận đơn đặt thuốc online cho chi nhánh {BranchId}", branchId);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Lỗi máy chủ.",
                detail: exception.Message);
        }
    }

    [HttpGet("patient/orders")]
    [HttpGet("~/api/v1/patient/orders")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyCollection<PatientOrderSummaryDto>>> GetPatientOrdersAsync(
        [FromQuery] string phoneNumber,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Số điện thoại là bắt buộc.");
        var cleanPhone = phoneNumber.Trim();
        if (cleanPhone.Length < 9 || cleanPhone.Length > 15)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Số điện thoại không hợp lệ.");

        var orders = await invoiceQueryService.GetPatientOrdersAsync(cleanPhone, cancellationToken);
        return Ok(new { items = orders, totalCount = orders.Count });
    }

    [HttpPost("{id}/confirm-payment")]
    [Authorize(Roles = "SALES,OWNER")]
    public async Task<ActionResult<InvoiceDetailResponse>> ConfirmPaymentAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã hóa đơn không được rỗng.");

        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.BranchId) || string.IsNullOrWhiteSpace(currentUserContext.UserId))
            return Unauthorized();

        try
        {
            var result = await invoiceQueryService.ConfirmPaymentAsync(
                currentUserContext.BranchId,
                id,
                currentUserContext.UserId,
                cancellationToken);

            logger.LogInformation("Nhân viên {CashierId} xác nhận thu tiền hóa đơn {InvoiceId} tại chi nhánh {BranchId}",
                currentUserContext.UserId, id, currentUserContext.BranchId);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }

    [HttpPost("{id}/cancel")]
    [Authorize(Roles = "OWNER")]
    public async Task<ActionResult<InvoiceDetailResponse>> CancelAsync(
        string id,
        [FromBody] CancelInvoiceRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Mã hóa đơn không được rỗng.");

        if (string.IsNullOrWhiteSpace(request?.Reason))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Lý do hủy hóa đơn là bắt buộc.");

        if (!currentUserContext.IsAuthenticated || string.IsNullOrWhiteSpace(currentUserContext.BranchId) || string.IsNullOrWhiteSpace(currentUserContext.UserId))
            return Unauthorized();

        try
        {
            var cancelled = await invoiceQueryService.CancelInvoiceAsync(
                currentUserContext.BranchId,
                id,
                currentUserContext.UserId,
                request,
                cancellationToken);

            return Ok(cancelled);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
        }
    }
}

public sealed record CheckoutRequestBody(
    IReadOnlyCollection<CheckoutLineBody> Lines,
    string? CustomerId = null,
    string PaymentMethod = "CASH");

public sealed record CheckoutLineBody(string DrugId, string BatchId, int Quantity);
public sealed record PatientCheckoutRequest(
    string PhoneNumber,
    string? CustomerName,
    string? BranchId,
    string? DeliveryAddress,
    string? PaymentMethod,
    IReadOnlyCollection<CheckoutLineBody> Lines);
