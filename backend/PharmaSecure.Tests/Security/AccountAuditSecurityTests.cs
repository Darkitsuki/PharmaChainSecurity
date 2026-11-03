using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using PharmaSecure.Application.Features.Security;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Enums;
using PharmaSecure.Infrastructure;
using PharmaSecure.Infrastructure.Persistence;
using PharmaSecure.Infrastructure.Security;
using Xunit;

namespace PharmaSecure.Tests.Security;

public sealed class AccountAuditSecurityTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.Parse("2030-01-15T12:00:00Z");
    private sealed class Clock : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = AccountAuditSecurityTests.Now;
        public override DateTimeOffset GetUtcNow() => Now;
    }
    [Fact]
    public void AuditChallengeRequest_WhenClientSuppliesRecipientEmail_IsRejected()
    {
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<AuditPasswordRequest>(
            """{"password":"correct-password","email":"attacker@example.test"}"""));
    }
    [Fact]
    public void OtpGrant_WhenCorrect_BindsUserBranchSessionAndCannotReplay()
    {
        using var store = new AuditAccessStore(new Clock());
        var challenge = store.Create("owner:a:session1", "owner@example.test", "314159");
        Assert.Throws<SensitiveAccessException>(() => store.Verify("owner:b:session1", new(challenge.ChallengeId, "314159"), Now.AddHours(1), "owner@example.test"));
        var grant = store.Verify("owner:a:session1", new(challenge.ChallengeId, "314159"), Now.AddHours(1), "owner@example.test");
        Assert.True(store.HasGrant("owner:a:session1", grant.AccessToken));
        Assert.False(store.HasGrant("owner:a:session2", grant.AccessToken));
        Assert.False(store.HasGrant("other:a:session1", grant.AccessToken));
        Assert.False(store.HasGrant("owner:b:session1", grant.AccessToken));
        Assert.Throws<SensitiveAccessException>(() => store.Verify("owner:a:session1", new(challenge.ChallengeId, "314159"), Now.AddHours(1), "owner@example.test"));
    }
    [Fact]
    public void OtpGrant_WhenOwnerEmailChanges_CannotUsePreviousChallenge()
    {
        using var store = new AuditAccessStore(new Clock());
        var challenge = store.Create("owner:a:session1", "owner@example.test", "314159");
        Assert.Equal(403, Assert.Throws<SensitiveAccessException>(() =>
            store.Verify("owner:a:session1", new(challenge.ChallengeId, "314159"), Now.AddHours(1), "different@example.test")).Status);
    }
    [Fact]
    public void OtpChallenge_WhenWrongFiveTimes_LocksOutCorrectCode()
    {
        using var store = new AuditAccessStore(new Clock()); var c = store.Create("binding", "owner@example.test", "314159");
        for (var i = 0; i < 5; i++) Assert.Equal(400, Assert.Throws<SensitiveAccessException>(() => store.Verify("binding", new(c.ChallengeId, "000000"), Now.AddHours(1), "owner@example.test")).Status);
        Assert.Equal(403, Assert.Throws<SensitiveAccessException>(() => store.Verify("binding", new(c.ChallengeId, "314159"), Now.AddHours(1), "owner@example.test")).Status);
    }
    [Fact]
    public void OtpGrant_WhenExpiredOrSessionRevoked_FailsClosed()
    {
        var clock = new Clock(); using var store = new AuditAccessStore(clock);
        var c = store.Create("binding", "owner@example.test", "314159"); var grant = store.Verify("binding", new(c.ChallengeId, "314159"), Now.AddHours(1), "owner@example.test");
        store.RevokeBinding("binding", Now.AddHours(1)); Assert.False(store.HasGrant("binding", grant.AccessToken));
        var other = store.Create("other", "owner@example.test", "314159"); var otherGrant = store.Verify("other", new(other.ChallengeId, "314159"), Now.AddHours(1), "owner@example.test");
        clock.Now = Now.AddMinutes(6); Assert.False(store.HasGrant("other", otherGrant.AccessToken));
    }
    [Fact]
    public void OtpChallenge_WhenExpired_RejectsCode()
    {
        var clock = new Clock(); using var store = new AuditAccessStore(clock); var c = store.Create("binding", "owner@example.test", "314159");
        clock.Now = Now.AddMinutes(6);
        Assert.Equal(403, Assert.Throws<SensitiveAccessException>(() => store.Verify("binding", new(c.ChallengeId, "314159"), clock.Now.AddHours(1), "owner@example.test")).Status);
    }
    [Fact]
    public void OtpChallenge_WhenRemovedAfterDeliveryFailure_CannotBeVerified()
    {
        using var store = new AuditAccessStore(new Clock());
        var challenge = store.Create("binding", "owner@example.test", "314159");

        store.RemoveChallenge(challenge.ChallengeId);

        Assert.Equal(403, Assert.Throws<SensitiveAccessException>(() =>
            store.Verify("binding", new(challenge.ChallengeId, "314159"), Now.AddHours(1), "owner@example.test")).Status);
    }
    [Fact]
    public void Reauthentication_WhenRepeated_IsRateLimited()
    {
        using var store = new AuditAccessStore(new Clock());
        for (var i = 0; i < 5; i++) store.Limit("user");
        Assert.Equal(429, Assert.Throws<SensitiveAccessException>(() => store.Limit("user")).Status);
    }
    [Fact]
    public void ProductionRegistration_WhenNoEmailProvider_HasOnlyUnavailableDelivery()
    {
        var services = new ServiceCollection(); services.AddInfrastructureServices(new ConfigurationBuilder().Build());
        using var provider = services.BuildServiceProvider();
        var delivery = provider.GetRequiredService<IAuditOtpDelivery>();
        Assert.IsType<UnavailableAuditOtpDelivery>(delivery); Assert.False(delivery.IsAvailable);
    }
    [Fact]
    public void ProductionRegistration_WhenGmailConfigurationIsIncomplete_RemainsUnavailable()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Email:Smtp:Enabled"] = "true",
            ["Email:Smtp:Sender"] = "sender@example.test"
        }).Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddInfrastructureServices(configuration);
        using var provider = services.BuildServiceProvider();

        var delivery = provider.GetRequiredService<IAuditOtpDelivery>();

        Assert.IsType<UnavailableAuditOtpDelivery>(delivery);
        Assert.False(delivery.IsAvailable);
    }
    [Fact]
    public void ProductionRegistration_WhenGmailIsConfigured_UsesSmtpDelivery()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Email:Smtp:Enabled"] = "true",
            ["Email:Smtp:Sender"] = "sender@example.test",
            ["Email:Smtp:Username"] = "sender@example.test",
            ["Email:Smtp:AppPassword"] = "test-only-placeholder"
        }).Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddInfrastructureServices(configuration);
        using var provider = services.BuildServiceProvider();
        var delivery = provider.GetRequiredService<IAuditOtpDelivery>();
        Assert.IsType<GmailAuditOtpDelivery>(delivery);
        Assert.True(delivery.IsAvailable);
    }
    [Fact]
    public async Task GmailDelivery_WhenRecipientIsMalformed_RejectsBeforeSending()
    {
        var delivery = new GmailAuditOtpDelivery(Options.Create(new AuditOtpSmtpOptions
        {
            Enabled = true,
            Sender = "sender@example.test",
            Username = "sender@example.test",
            AppPassword = "test-only-placeholder"
        }), NullLogger<GmailAuditOtpDelivery>.Instance);

        var error = await Assert.ThrowsAsync<SensitiveAccessException>(() =>
            delivery.SendAsync("not-an-email", "123456", CancellationToken.None));

        Assert.Equal(503, error.Status);
    }
    [Theory]
    [InlineData("owner.a@gmail.com")]
    [InlineData("owner.b@outlook.com")]
    [InlineData("owner.c@yahoo.com")]
    public async Task AuditChallenge_UsesOnlyEmailReturnedForAuthenticatedOwner(string accountEmail)
    {
        var user = new Mock<ICurrentUserContext>();
        user.SetupGet(x => x.IsAuthenticated).Returns(true);
        user.SetupGet(x => x.UserId).Returns("owner");
        user.SetupGet(x => x.BranchId).Returns("branch");
        user.SetupGet(x => x.Role).Returns(UserRole.OWNER);
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity([
                new Claim("jti", "session"),
                new Claim("exp", Now.AddHours(1).ToUnixTimeSeconds().ToString())
            ], "test"))
        };
        var http = new Mock<IHttpContextAccessor>();
        http.SetupGet(x => x.HttpContext).Returns(httpContext);
        var account = new Mock<IAccountSettingsService>();
        account.Setup(x => x.VerifyPasswordAsync("correct-password", It.IsAny<CancellationToken>()))
            .ReturnsAsync(accountEmail);
        string? recipient = null;
        var delivery = new Mock<IAuditOtpDelivery>();
        delivery.SetupGet(x => x.IsAvailable).Returns(true);
        delivery.Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, CancellationToken>((email, _, _) => recipient = email)
            .Returns(Task.CompletedTask);
        using var store = new AuditAccessStore(new Clock());
        var audit = new SecurityAuditWriter(user.Object, http.Object, Mock.Of<IOracleConnectionFactory>(),
            NullLogger<SecurityAuditWriter>.Instance);
        var service = new AuditAccessService(user.Object, http.Object, account.Object, delivery.Object, store, audit);

        var challenge = await service.StartAsync("correct-password");

        Assert.Equal(accountEmail, recipient);
        Assert.Equal(64, challenge.ChallengeId.Length);
        Assert.DoesNotContain(accountEmail, challenge.MaskedEmail);
        Assert.EndsWith(accountEmail[accountEmail.IndexOf('@')..], challenge.MaskedEmail);
    }
    [Theory]
    [InlineData(UserRole.OWNER, false)]
    [InlineData(UserRole.SALES, true)]
    [InlineData(UserRole.WAREHOUSE, true)]
    public async Task AuditRead_WhenGrantOrRoleInvalid_RejectsBeforeOracle(UserRole role, bool granted)
    {
        var unit = new Mock<IUnitOfWork>(MockBehavior.Strict); var user = new Mock<ICurrentUserContext>();
        user.SetupGet(x => x.IsAuthenticated).Returns(true); user.SetupGet(x => x.UserId).Returns("u");
        user.SetupGet(x => x.BranchId).Returns("a"); user.SetupGet(x => x.Role).Returns(role);
        var access = new Mock<IAuditAccessService>(); access.Setup(x => x.HasAccess()).Returns(granted);
        var service = new AuditLogService(unit.Object, user.Object, access.Object);
        Assert.Equal(403, (await Assert.ThrowsAsync<SensitiveAccessException>(() => service.GetAsync(new()))).Status);
        unit.VerifyNoOtherCalls();
    }
    [Fact]
    public void AuditFilter_WhenUnboundedOrInvalid_IsRejected()
    {
        Assert.Throws<SensitiveAccessException>(() => AuditLogService.Validate(new() { PageSize = 101 }, Now));
        Assert.Throws<SensitiveAccessException>(() => AuditLogService.Validate(new() { StartDate = Now.AddDays(-100), EndDate = Now }, Now));
        Assert.Throws<SensitiveAccessException>(() => AuditLogService.Validate(new() { Page = int.MaxValue, PageSize = 100 }, Now));
        Assert.Throws<SensitiveAccessException>(() => AuditLogService.Validate(new() { EventType = "x' OR 1=1" }, Now));
    }
    [Fact]
    public void ProfileValidation_WhenInvalidUnicodeOrPhone_IsRejected()
    {
        Assert.Throws<SensitiveAccessException>(() => AccountSettingsService.ValidateProfile(new(new string('ệ', 100), null)));
        Assert.Throws<SensitiveAccessException>(() => AccountSettingsService.ValidateProfile(new("Test", "not-a-phone")));
        AccountSettingsService.ValidateProfile(new("Dược sĩ kiểm thử", "+84 900 123456"));
    }
    [Fact]
    public void PasswordPolicy_WhenTooLongForBcryptOrConfirmationWrong_IsRejected()
    {
        Assert.Throws<SensitiveAccessException>(() => AccountSettingsService.ValidatePassword(new("current", new string('ệ', 25), new string('ệ', 25))));
        Assert.Throws<SensitiveAccessException>(() => AccountSettingsService.ValidatePassword(new("current", "sufficient-password", "different-password")));
        Assert.Throws<SensitiveAccessException>(() => AccountSettingsService.ValidatePassword(new("current", "short", "short")));
    }
    [Fact]
    public void CredentialStamp_WhenPasswordChanges_ChangesWithoutExposingHash()
    {
        var stamp = SessionCredentialValidator.Stamp("hash-one", new string('k', 40));
        Assert.Equal(64, stamp.Length); Assert.DoesNotContain("hash-one", stamp);
        Assert.NotEqual(stamp, SessionCredentialValidator.Stamp("hash-two", new string('k', 40)));
    }
    [Fact]
    public void AuditText_WhenMultibyte_TruncatesAtOracleByteBoundary()
    {
        var result = SecurityAuditWriter.Bounded(new string('ệ', 200), 500)!;
        Assert.True(System.Text.Encoding.UTF8.GetByteCount(result) <= 500);
        Assert.DoesNotContain('\uFFFD', result);
    }
    [Fact]
    public void AuditText_WhenSecretPatternsPresent_RedactsBeforePersistenceAndDisplay()
    {
        var safe = SecurityAuditWriter.Sanitize("Agent Bearer example-secret password=example-password token=example-token");
        Assert.DoesNotContain("example-secret", safe); Assert.DoesNotContain("example-password", safe); Assert.DoesNotContain("example-token", safe);
    }
}
