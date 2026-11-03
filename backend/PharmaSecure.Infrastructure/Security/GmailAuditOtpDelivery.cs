using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PharmaSecure.Application.Features.Security;

namespace PharmaSecure.Infrastructure.Security;

public sealed class AuditOtpSmtpOptions
{
    public bool Enabled { get; set; }
    public string? Sender { get; set; }
    public string? Username { get; set; }
    public string? AppPassword { get; set; }
}

public sealed class GmailAuditOtpDelivery : IAuditOtpDelivery
{
    private static readonly TimeSpan SendTimeout = TimeSpan.FromSeconds(15);
    private readonly AuditOtpSmtpOptions options;
    private readonly ILogger<GmailAuditOtpDelivery> logger;

    public GmailAuditOtpDelivery(IOptions<AuditOtpSmtpOptions> options, ILogger<GmailAuditOtpDelivery> logger)
    {
        this.options = options.Value;
        this.logger = logger;
    }

    public bool IsAvailable => IsConfigurationValid(options);

    public static bool IsConfigurationValid(AuditOtpSmtpOptions options) =>
        options.Enabled &&
        IsValidAddress(options.Sender) &&
        IsValidAddress(options.Username) &&
        !string.IsNullOrWhiteSpace(options.AppPassword) &&
        options.AppPassword == options.AppPassword.Trim();

    private static bool IsValidAddress(string? email) =>
        !string.IsNullOrWhiteSpace(email) &&
        email == email.Trim() &&
        MailAddress.TryCreate(email, out var address) &&
        string.Equals(address.Address, email, StringComparison.OrdinalIgnoreCase);

    public async Task SendAsync(string email, string code, CancellationToken ct)
    {
        if (!IsAvailable) throw new SensitiveAccessException(503, "Gmail OTP chưa được cấu hình đầy đủ.");
        if (!IsValidAddress(email)) throw new SensitiveAccessException(503, "Không tìm thấy email tài khoản hợp lệ.");

        try
        {
            using var message = new MailMessage(new MailAddress(options.Sender!), new MailAddress(email))
            {
                Subject = "PharmaSecure - Mã OTP Audit Log",
                SubjectEncoding = System.Text.Encoding.UTF8,
                BodyEncoding = System.Text.Encoding.UTF8,
                IsBodyHtml = false,
                Body = $"Mã xác minh Audit Log của bạn là {code}. Mã có hiệu lực trong 5 phút và chỉ sử dụng một lần. Không chia sẻ mã này với bất kỳ ai."
            };
            using var client = new SmtpClient("smtp.gmail.com", 587)
            {
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(options.Username, options.AppPassword),
                Timeout = (int)SendTimeout.TotalMilliseconds
            };
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(SendTimeout);
            await client.SendMailAsync(message, timeout.Token);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning("Gmail SMTP OTP delivery failed ({FailureType}).", exception.GetType().Name);
            throw new SensitiveAccessException(503, "Không gửi được mã xác minh qua Gmail. Chưa cấp quyền đọc nhật ký.");
        }
    }
}
