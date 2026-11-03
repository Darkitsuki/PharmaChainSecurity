using System.Collections.Concurrent;
using System.Data.Common;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Security;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Infrastructure;
using PharmaSecure.Infrastructure.Persistence;
using PharmaSecure.Infrastructure.Security;
using PharmaSecure.WebApi.Controllers;
using PharmaSecure.WebApi.Middlewares;
using Xunit;

namespace PharmaSecure.Tests.Security;

public sealed class LocalOracleFactAttribute : FactAttribute
{
    public LocalOracleFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("PHARMA_LOCAL_INTEGRATION") != "1")
            Skip = "Opt-in only: verified Local Oracle and PHARMA_TEST_CONNECTION required.";
    }
}
public sealed class LocalBrowserFactAttribute : FactAttribute
{
    public LocalBrowserFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("PHARMA_LOCAL_INTEGRATION") != "1" || Environment.GetEnvironmentVariable("PHARMA_BROWSER_TESTS") != "1")
            Skip = "Opt-in only: Local Oracle, Python Playwright and Edge required.";
    }
}

// This replacement exists exclusively in the test assembly and is never configuration-selectable.
internal sealed class FixtureOtpDelivery : IAuditOtpDelivery
{
    public bool IsAvailable => true;
    public ConcurrentDictionary<string, string> Codes { get; } = new();
    public string? LastCode { get; private set; }
    public Task SendAsync(string email, string code, CancellationToken ct) { Codes[email] = code; LastCode = code; return Task.CompletedTask; }
}
internal sealed record LocalActor(string Id, string Username, string Password, string Email, string Branch, string Role);
internal sealed class LocalSecurityHost : IAsyncDisposable
{
    public WebApplication App { get; }
    public FixtureOtpDelivery Otp { get; } = new();
    public string ConnectionString { get; }
    public string Url => App.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!.Addresses.Single();
    public static string Repo([CallerFilePath] string path = "") => Path.GetFullPath(Path.Combine(Path.GetDirectoryName(path)!, "..", "..", ".."));
    private LocalSecurityHost(WebApplication app, string connectionString, FixtureOtpDelivery otp) { App = app; ConnectionString = connectionString; Otp = otp; }
    public static async Task<LocalSecurityHost> Start(bool fakeOtp = true, bool failPasswordAudit = false)
    {
        var cs = Environment.GetEnvironmentVariable("PHARMA_TEST_CONNECTION") ?? throw new InvalidOperationException("Explicit Local connection required.");
        var parsed = new OracleConnectionStringBuilder(cs);
        Assert.Equal("127.0.0.1:1521/FREEPDB1", parsed.DataSource); Assert.Equal("PHARMASECURE_APP", parsed.UserID);
        await using (var connection = new OracleConnection(cs))
        {
            await connection.OpenAsync(); using var guard = connection.CreateCommand();
            guard.CommandText = "SELECT SYS_CONTEXT('USERENV','SESSION_USER')||'|'||SYS_CONTEXT('USERENV','CON_NAME') FROM DUAL";
            Assert.Equal("PHARMASECURE_APP|FREEPDB1", await guard.ExecuteScalarAsync());
        }
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Development", ContentRootPath = Path.Combine(Repo(), "backend", "PharmaSecure.WebApi") });
        builder.WebHost.UseUrls("http://127.0.0.1:0"); builder.Configuration.Sources.Clear();
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?> {
            ["ConnectionStrings:DefaultConnection"] = cs, ["Database:AutoMigrate"] = "false",
            ["Jwt:SecretKey"] = Convert.ToHexString(RandomNumberGenerator.GetBytes(40)), ["Jwt:Issuer"] = "LocalSecurityTests",
            ["Jwt:Audience"] = "LocalSecurityTests", ["Jwt:ExpiryMinutes"] = "60" });
        builder.Logging.ClearProviders(); builder.Logging.AddConsole().SetMinimumLevel(LogLevel.Error);
        builder.Services.AddControllers().AddApplicationPart(typeof(AccountSettingsController).Assembly);
        builder.Services.AddInfrastructureServices(builder.Configuration);
        var otp = new FixtureOtpDelivery();
        if (fakeOtp) { builder.Services.RemoveAll<IAuditOtpDelivery>(); builder.Services.AddSingleton<IAuditOtpDelivery>(otp); }
        if (failPasswordAudit) builder.Services.AddScoped<SecurityAuditWriter, FaultPasswordAudit>();
        var app = builder.Build(); app.UseMiddleware<CorrelationIdMiddleware>(); app.UseAuthentication();
        app.UseMiddleware<SecurityAuditMiddleware>(); app.UseMiddleware<BranchContextMiddleware>(); app.UseAuthorization(); app.MapControllers();
        await app.StartAsync(); return new(app, cs, otp);
    }
    public async Task<LocalActor> Actor(string role, string branchSuffix = "1")
    {
        var suffix = Guid.NewGuid().ToString("N"); var id = "it-" + suffix; var username = "it_" + role.ToLowerInvariant() + "_" + suffix[..10];
        var password = "Fixture-" + Convert.ToHexString(RandomNumberGenerator.GetBytes(12)); var email = username + "@example.invalid";
        var branch = "br-00000000-0000-0000-0000-00000000000" + branchSuffix;
        var roleId = "rl-00000000-0000-0000-0000-00000000000" + (role == "OWNER" ? "1" : role == "WAREHOUSE" ? "2" : "3");
        await using var connection = new OracleConnection(ConnectionString); await connection.OpenAsync(); using var cmd = connection.CreateCommand(); cmd.BindByName = true;
        cmd.CommandText = "INSERT INTO USERS(id,Username,PasswordHash,FullName,Email,RoleId,BranchId,IsActive) VALUES(:actor,:username,:hash,'Integration Test Account',:email,:roleId,:branch,1)";
        foreach (var pair in new[] { ("actor", id), ("username", username), ("hash", App.Services.GetRequiredService<IPasswordHasher>().HashPassword(password)), ("email", email), ("roleId", roleId), ("branch", branch) }) cmd.Parameters.Add(pair.Item1, OracleDbType.Varchar2).Value = pair.Item2;
        await cmd.ExecuteNonQueryAsync(); return new(id, username, password, email, branch, role);
    }
    public async Task<HttpClient> Login(LocalActor actor, string? password = null)
    {
        var client = new HttpClient { BaseAddress = new Uri(Url) };
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { actor.Username, Password = password ?? actor.Password }); Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var data = await response.Content.ReadFromJsonAsync<JsonElement>(); client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", data.GetProperty("accessToken").GetString()); return client;
    }
    public async Task<string> Grant(HttpClient client, LocalActor actor)
    {
        var response = await client.PostAsJsonAsync("/api/v1/security/audit-access/challenges", new { actor.Password }); Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var challenge = await response.Content.ReadFromJsonAsync<AuditChallenge>();
        response = await client.PostAsJsonAsync("/api/v1/security/audit-access/verify", new AuditOtpRequest(challenge!.ChallengeId, Otp.Codes[actor.Email])); Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var grant = await response.Content.ReadFromJsonAsync<AuditGrant>(); client.DefaultRequestHeaders.Remove("X-Audit-Access"); client.DefaultRequestHeaders.Add("X-Audit-Access", grant!.AccessToken); return grant.AccessToken;
    }
    public async Task<object?> Scalar(string sql, params (string Name, object Value)[] values)
    {
        await using var connection = new OracleConnection(ConnectionString); await connection.OpenAsync(); using var cmd = connection.CreateCommand(); cmd.BindByName = true; cmd.CommandText = sql;
        foreach (var value in values) cmd.Parameters.Add(value.Name, OracleDbType.Varchar2).Value = value.Value;
        return await cmd.ExecuteScalarAsync();
    }
    public async ValueTask DisposeAsync() { await App.StopAsync(); await App.DisposeAsync(); }
    private sealed class FaultPasswordAudit(ICurrentUserContext user, IHttpContextAccessor http, IOracleConnectionFactory factory, ILogger<SecurityAuditWriter> logger)
        : SecurityAuditWriter(user, http, factory, logger)
    {
        public override Task WriteAsync(DbConnection connection, DbTransaction? transaction, string eventType, string? reason = null, CancellationToken ct = default)
            => eventType == "PASSWORD_CHANGED" ? throw new AuditPersistenceException() : base.WriteAsync(connection, transaction, eventType, reason, ct);
    }
}

public sealed class LocalAccountAuditIntegrationTests
{
    [LocalOracleFact, Trait("Category", "LocalOracle")]
    public async Task Audit_WithRealOracle_EnforcesStepUpBranchFiltersAndRoles()
    {
        await using var host = await LocalSecurityHost.Start(); var a = await host.Actor("OWNER"); var b = await host.Actor("OWNER", "2");
        using var ca = await host.Login(a); using var cb = await host.Login(b);
        Assert.Equal(HttpStatusCode.Forbidden, (await ca.GetAsync("/api/v1/security/audit-logs")).StatusCode);
        await host.Grant(ca, a); await host.Grant(cb, b);
        var employee = "it_employee_" + Guid.NewGuid().ToString("N")[..10];
        var created = await ca.PostAsJsonAsync("/api/v1/users", new { username = employee, password = a.Password, fullName = "Integration Employee", role = "WAREHOUSE", phoneNumber = "0901234567" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var employeeId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();
        Assert.Equal(HttpStatusCode.OK, (await ca.PutAsJsonAsync($"/api/v1/users/{employeeId}/status", new { isActive = false })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await ca.PutAsJsonAsync($"/api/v1/users/{employeeId}/status", new { isActive = true })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await ca.PutAsJsonAsync($"/api/v1/users/{employeeId}/status", new { isActive = true })).StatusCode);
        foreach (var eventType in new[] { "USER_CREATED", "USER_DEACTIVATED", "USER_ACTIVATED" })
            Assert.Equal(1m, Convert.ToDecimal(await host.Scalar("SELECT COUNT(*) FROM AUDIT_LOGS WHERE UserId=:actor AND EventType=:eventType AND FailureReason=:reason", ("actor", a.Id), ("eventType", eventType), ("reason", "Target user: " + employeeId))));
        foreach (var role in new[] { "SALES", "WAREHOUSE" })
        {
            using var denied = await host.Login(await host.Actor(role));
            Assert.Equal(HttpStatusCode.Forbidden, (await denied.GetAsync("/api/v1/security/audit-logs")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await denied.PostAsJsonAsync("/api/v1/security/audit-access/challenges", new { password = a.Password })).StatusCode);
        }
        var listA = await ca.GetFromJsonAsync<JsonElement>("/api/v1/security/audit-logs?pageSize=1");
        Assert.True(listA.GetProperty("totalCount").GetInt32() > 1); Assert.Single(listA.GetProperty("items").EnumerateArray());
        Assert.All(listA.GetProperty("items").EnumerateArray(), entry => Assert.Equal(a.Branch, entry.GetProperty("branchId").GetString()));
        var secondPage = await ca.GetFromJsonAsync<JsonElement>("/api/v1/security/audit-logs?page=2&pageSize=1"); Assert.NotEqual(listA.GetProperty("items")[0].GetProperty("id").GetString(), secondPage.GetProperty("items")[0].GetProperty("id").GetString());
        var listB = await cb.GetFromJsonAsync<JsonElement>("/api/v1/security/audit-logs");
        Assert.All(listB.GetProperty("items").EnumerateArray(), entry => Assert.Equal(b.Branch, entry.GetProperty("branchId").GetString()));
        var foreignId = listB.GetProperty("items")[0].GetProperty("id").GetString();
        Assert.Equal(HttpStatusCode.NotFound, (await ca.GetAsync("/api/v1/security/audit-logs/" + foreignId)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await ca.GetAsync("/api/v1/security/audit-logs?branchId=" + b.Branch)).StatusCode);
        var q = "?username=" + a.Username + "&eventType=LOGIN_SUCCESS&outcome=SUCCESS&pageSize=1";
        var filtered = await ca.GetFromJsonAsync<JsonElement>("/api/v1/security/audit-logs" + q); Assert.Equal(1, filtered.GetProperty("totalCount").GetInt32());
        Assert.InRange(filtered.GetProperty("items")[0].GetProperty("createdDate").GetDateTime(), DateTime.UtcNow.AddMinutes(-2), DateTime.UtcNow.AddSeconds(5));
        var statistics = await ca.GetFromJsonAsync<AuditStatistics>("/api/v1/security/audit-logs/statistics" + q); Assert.Equal(1, statistics!.LoginSuccess); Assert.Equal(1, statistics.TotalCount);
        Assert.Equal(HttpStatusCode.BadRequest, (await ca.GetAsync("/api/v1/security/audit-logs?pageSize=101")).StatusCode);
        using var anonymous = new HttpClient { BaseAddress = new Uri(host.Url) }; var unknown = "it_unknown_" + Guid.NewGuid().ToString("N");
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsJsonAsync("/api/v1/auth/login", new { username = unknown, password = "not-valid" })).StatusCode);
        var nullId = await host.Scalar("SELECT id FROM AUDIT_LOGS WHERE Username=:username AND BranchId IS NULL", ("username", unknown)); Assert.NotNull(nullId);
        Assert.Equal(HttpStatusCode.NotFound, (await ca.GetAsync("/api/v1/security/audit-logs/" + nullId)).StatusCode);
        var nullSearch = await ca.GetFromJsonAsync<JsonElement>("/api/v1/security/audit-logs?username=" + unknown); Assert.Equal(0, nullSearch.GetProperty("totalCount").GetInt32());
        using var otherSession = await host.Login(a); otherSession.DefaultRequestHeaders.Add("X-Audit-Access", ca.DefaultRequestHeaders.GetValues("X-Audit-Access").Single());
        Assert.Equal(HttpStatusCode.Forbidden, (await otherSession.GetAsync("/api/v1/security/audit-logs")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await ca.PostAsync("/api/v1/auth/logout", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await ca.GetAsync("/api/v1/security/audit-logs")).StatusCode);
    }
    [LocalOracleFact, Trait("Category", "LocalOracle")]
    public async Task Audit_WithoutRealOtpProvider_VerifiesPasswordButNeverGrantsAccess()
    {
        await using var host = await LocalSecurityHost.Start(fakeOtp: false); var actor = await host.Actor("OWNER"); using var client = await host.Login(actor);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/v1/security/audit-access/challenges", new { password = "wrong-password" })).StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.PostAsJsonAsync("/api/v1/security/audit-access/challenges", new { actor.Password })).StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.PostAsJsonAsync("/api/v1/security/audit-access/verify", new AuditOtpRequest(new string('A', 64), "123456"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/v1/security/audit-logs")).StatusCode);
    }
    [LocalOracleFact, Trait("Category", "LocalOracle")]
    public async Task Settings_WithOracle_UpdatesOnlySelfAndRevokesOldPasswordTokens()
    {
        await using var host = await LocalSecurityHost.Start();
        foreach (var role in new[] { "OWNER", "WAREHOUSE", "SALES" })
        {
            var actor = await host.Actor(role); using var client = await host.Login(actor); using var secondSession = await host.Login(actor);
            var profile = await client.GetFromJsonAsync<AccountProfile>("/api/v1/account/profile"); Assert.Equal(actor.Id, profile!.UserId); Assert.Equal(role, profile.Role);
            var raw = await (await client.GetAsync("/api/v1/account/profile")).Content.ReadAsStringAsync(); Assert.DoesNotContain("password", raw, StringComparison.OrdinalIgnoreCase);
            Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/v1/account/profile/other-id")).StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync("/api/v1/account/profile", new { fullName = "Bad assignment", phoneNumber = "0901234567", roleId = "owner" })).StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync("/api/v1/account/profile", new { fullName = "Bad assignment", phoneNumber = "0901234567", email = "other@example.invalid" })).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await client.PutAsJsonAsync("/api/v1/account/profile", new UpdateProfileRequest("Integration Updated", "0901234567"))).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await client.PutAsJsonAsync("/api/v1/account/profile", new UpdateProfileRequest("Integration Updated", "0901234567"))).StatusCode);
            Assert.Equal("Integration Updated|0901234567", await host.Scalar("SELECT FullName||'|'||PhoneNumber FROM USERS WHERE id=:actor", ("actor", actor.Id)));
            Assert.Equal(1m, Convert.ToDecimal(await host.Scalar("SELECT COUNT(*) FROM AUDIT_LOGS WHERE UserId=:actor AND EventType='PROFILE_UPDATED'", ("actor", actor.Id))));
            var newPassword = "Updated-" + Convert.ToHexString(RandomNumberGenerator.GetBytes(12));
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/v1/account/password", new ChangePasswordRequest("wrong-current", newPassword, newPassword))).StatusCode);
            Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/api/v1/account/password", new ChangePasswordRequest(actor.Password, newPassword, newPassword))).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/account/profile")).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await secondSession.GetAsync("/api/v1/auth/me")).StatusCode);
            var hash = (string)(await host.Scalar("SELECT PasswordHash FROM USERS WHERE id=:actor", ("actor", actor.Id)))!;
            Assert.False(newPassword == hash, "Password must be hashed."); Assert.True(host.App.Services.GetRequiredService<IPasswordHasher>().VerifyPassword(newPassword, hash));
            using var newLogin = await host.Login(actor, newPassword); Assert.Equal(HttpStatusCode.OK, (await newLogin.GetAsync("/api/v1/account/profile")).StatusCode);
        }
    }
    [LocalOracleFact, Trait("Category", "LocalOracle")]
    public async Task Settings_WhenAuditPersistenceFails_RollsBackPasswordUpdate()
    {
        await using var host = await LocalSecurityHost.Start(failPasswordAudit: true); var actor = await host.Actor("SALES"); using var client = await host.Login(actor);
        var before = await host.Scalar("SELECT PasswordHash FROM USERS WHERE id=:actor", ("actor", actor.Id));
        var newPassword = "Updated-" + Convert.ToHexString(RandomNumberGenerator.GetBytes(12));
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.PostAsJsonAsync("/api/v1/account/password", new ChangePasswordRequest(actor.Password, newPassword, newPassword))).StatusCode);
        Assert.True(Equals(before, await host.Scalar("SELECT PasswordHash FROM USERS WHERE id=:actor", ("actor", actor.Id))), "Password update must roll back when audit fails.");
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/account/profile")).StatusCode);
    }

    [LocalBrowserFact, Trait("Category", "LocalBrowser")]
    public async Task Browser_TestHostWithFixtureOtp_ReadsOracleAndSyncsSettingsHeader()
    {
        await using var host = await LocalSecurityHost.Start(); var actor = await host.Actor("OWNER");
        using (var attempts = new HttpClient { BaseAddress = new Uri(host.Url) })
            for (var i = 0; i < 21; i++)
                Assert.Equal(HttpStatusCode.Unauthorized, (await attempts.PostAsJsonAsync("/api/v1/auth/login", new { actor.Username, Password = "intentional-fixture-failure" })).StatusCode);
        var repo = LocalSecurityHost.Repo();
        Assert.DoesNotContain(System.Net.NetworkInformation.IPGlobalProperties.GetIPGlobalProperties().GetActiveTcpListeners(), endpoint => endpoint.Port == 3002);
        // Standalone test-only Vite instance; the user's normal Web remains on its production provider.
        var start = new ProcessStartInfo("node") { WorkingDirectory = Path.Combine(repo, "frontend"), UseShellExecute = false, CreateNoWindow = true, WindowStyle = ProcessWindowStyle.Hidden, RedirectStandardOutput = true, RedirectStandardError = true };
        start.ArgumentList.Add(Path.Combine(repo, "frontend", "node_modules", "vite", "bin", "vite.js")); start.ArgumentList.Add("--host"); start.ArgumentList.Add("127.0.0.1"); start.ArgumentList.Add("--port"); start.ArgumentList.Add("3002"); start.ArgumentList.Add("--strictPort"); start.Environment["VITE_API_BASE_URL"] = host.Url + "/api/v1";
        using var vite = Process.Start(start)!;
        try
        {
            using var probe = new HttpClient(); var ready = false;
            for (var i = 0; i < 40; i++) { try { ready = (await probe.GetAsync("http://127.0.0.1:3002")).IsSuccessStatusCode; if (ready) break; } catch (HttpRequestException) { } await Task.Delay(250); }
            Assert.True(ready, "Test-only Vite server did not start.");
            var python = new ProcessStartInfo("python") { WorkingDirectory = repo, UseShellExecute = false, CreateNoWindow = true, WindowStyle = ProcessWindowStyle.Hidden, RedirectStandardOutput = true, RedirectStandardError = true, RedirectStandardInput = true };
            python.ArgumentList.Add(Path.Combine(repo, "backend", "PharmaSecure.Tests", "Security", "browser_audit_settings.py"));
            python.Environment["PHARMA_UI_USER"] = actor.Username; python.Environment["PHARMA_UI_PASSWORD"] = actor.Password; python.Environment["PYTHONIOENCODING"] = "utf-8";
            using var browser = Process.Start(python)!;
            var stderr = browser.StandardError.ReadToEndAsync();
            while (await browser.StandardOutput.ReadLineAsync() is { } line)
            {
                if (line == "OTP") { Assert.NotNull(host.Otp.LastCode); await browser.StandardInput.WriteLineAsync(host.Otp.LastCode); await browser.StandardInput.FlushAsync(); }
                else Console.WriteLine(line);
            }
            await browser.WaitForExitAsync(); Assert.True(browser.ExitCode == 0, await stderr);
            Assert.Equal("Browser Updated Profile", await host.Scalar("SELECT FullName FROM USERS WHERE id=:actor", ("actor", actor.Id)));
        }
        finally { if (!vite.HasExited) { vite.Kill(entireProcessTree: true); await vite.WaitForExitAsync(); } }
    }
}
