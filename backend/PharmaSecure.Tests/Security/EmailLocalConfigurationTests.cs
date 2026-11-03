using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using PharmaSecure.Infrastructure.Security;
using PharmaSecure.WebApi;
using Xunit;

namespace PharmaSecure.Tests.Security;

public sealed class EmailLocalConfigurationTests
{
    [Fact]
    public void DevelopmentConfiguration_WhenLocalFileIsMissing_RemainsOptionalAndUnavailable()
    {
        using var root = new ConfigurationRoot();
        using var configuration = CreateDefaultSources();

        EmailLocalConfiguration.AddDevelopmentFile(configuration, root.CreateEnvironment("Development"));

        var options = configuration.GetSection("Email:Smtp").Get<AuditOtpSmtpOptions>() ?? new();
        Assert.False(GmailAuditOtpDelivery.IsConfigurationValid(options));
    }

    [Fact]
    public void DevelopmentConfiguration_WhenLocalFileHasValidSettings_BindsAdapterOptions()
    {
        using var root = new ConfigurationRoot();
        root.WriteLocalFile("""
            {
              "Email": {
                "Smtp": {
                  "Enabled": true,
                  "Sender": "sender@example.test",
                  "Username": "sender@example.test",
                  "AppPassword": "test-only-placeholder"
                }
              }
            }
            """);
        using var configuration = CreateDefaultSources();

        EmailLocalConfiguration.AddDevelopmentFile(configuration, root.CreateEnvironment("Development"));

        var options = configuration.GetSection("Email:Smtp").Get<AuditOtpSmtpOptions>()!;
        Assert.True(GmailAuditOtpDelivery.IsConfigurationValid(options));
    }

    [Fact]
    public void DevelopmentConfiguration_WhenLocalFileContainsPlaceholders_RemainsUnavailable()
    {
        using var root = new ConfigurationRoot();
        root.WriteLocalFile("""
            {
              "Email": {
                "Smtp": {
                  "Enabled": true,
                  "Sender": "YOUR_GMAIL_ADDRESS",
                  "Username": "YOUR_GMAIL_ADDRESS",
                  "AppPassword": ""
                }
              }
            }
            """);
        using var configuration = CreateDefaultSources();

        EmailLocalConfiguration.AddDevelopmentFile(configuration, root.CreateEnvironment("Development"));

        var options = configuration.GetSection("Email:Smtp").Get<AuditOtpSmtpOptions>()!;
        Assert.False(GmailAuditOtpDelivery.IsConfigurationValid(options));
    }

    [Fact]
    public void DevelopmentConfiguration_UserSecretsAndEnvironmentSettingsOverrideLocalFile()
    {
        using var root = new ConfigurationRoot();
        root.WriteLocalFile("""
            {
              "Email": {
                "Smtp": {
                  "Username": "local-file"
                }
              }
            }
            """);
        using var configuration = CreateDefaultSources();
        configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Email:Smtp:Username"] = "user-secrets"
        });

        EmailLocalConfiguration.AddDevelopmentFile(configuration, root.CreateEnvironment("Development"));
        Assert.Equal("user-secrets", configuration["Email:Smtp:Username"]);

        configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Email:Smtp:Username"] = "environment"
        });
        Assert.Equal("environment", configuration["Email:Smtp:Username"]);
    }

    [Fact]
    public void ProductionConfiguration_DoesNotLoadLocalFile()
    {
        using var root = new ConfigurationRoot();
        root.WriteLocalFile("""
            {
              "Email": {
                "Smtp": {
                  "Enabled": true,
                  "Username": "local-file"
                }
              }
            }
            """);
        using var configuration = CreateDefaultSources();

        EmailLocalConfiguration.AddDevelopmentFile(configuration, root.CreateEnvironment("Production"));

        Assert.Null(configuration["Email:Smtp:Username"]);
    }

    private static ConfigurationManager CreateDefaultSources()
    {
        var configuration = new ConfigurationManager();
        configuration.AddInMemoryCollection();
        configuration.AddInMemoryCollection();
        return configuration;
    }

    private sealed class ConfigurationRoot : IDisposable
    {
        private readonly string path = Path.Combine(Path.GetTempPath(), $"pharmasecure-email-config-{Guid.NewGuid():N}");
        private readonly PhysicalFileProvider fileProvider;

        public ConfigurationRoot()
        {
            Directory.CreateDirectory(path);
            fileProvider = new PhysicalFileProvider(path);
        }

        public IHostEnvironment CreateEnvironment(string name) => new TestHostEnvironment
        {
            EnvironmentName = name,
            ContentRootPath = path,
            ContentRootFileProvider = fileProvider
        };

        public void WriteLocalFile(string contents) =>
            File.WriteAllText(Path.Combine(path, "appsettings.Email.local.json"), contents);

        public void Dispose()
        {
            fileProvider.Dispose();
            Directory.Delete(path, recursive: true);
        }
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = string.Empty;
        public string ApplicationName { get; set; } = string.Empty;
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
