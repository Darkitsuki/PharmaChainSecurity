using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.Json;
using Microsoft.Extensions.Hosting;

namespace PharmaSecure.WebApi;

public static class EmailLocalConfiguration
{
    public static void AddDevelopmentFile(IConfigurationBuilder configuration, IHostEnvironment environment)
    {
        if (!environment.IsDevelopment()) return;

        // CreateBuilder adds appsettings.json and appsettings.{Environment}.json first,
        // followed by User Secrets, environment variables, and command-line settings.
        configuration.Sources.Insert(2, new JsonConfigurationSource
        {
            Path = "appsettings.Email.local.json",
            Optional = true,
            ReloadOnChange = true,
            FileProvider = environment.ContentRootFileProvider
        });
    }
}
