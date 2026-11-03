using PharmaSecure.Infrastructure;
using PharmaSecure.WebApi;
using PharmaSecure.WebApi.Middlewares;

LoadDotEnv();

var builder = WebApplication.CreateBuilder(args);
EmailLocalConfiguration.AddDevelopmentFile(builder.Configuration, builder.Environment);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Register Infrastructure Layer abstractions and dependencies
builder.Services.AddInfrastructureServices(builder.Configuration);

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseCors();

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseMiddleware<SecurityAuditMiddleware>();
app.UseMiddleware<BranchContextMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();

static void LoadDotEnv()
{
    var current = Directory.GetCurrentDirectory();
    for (int i = 0; i < 4; i++)
    {
        var envPath = Path.Combine(current, ".env");
        if (File.Exists(envPath))
        {
            foreach (var line in File.ReadAllLines(envPath))
            {
                var trimmed = line.Trim();
                if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith('#')) continue;
                var parts = trimmed.Split('=', 2);
                if (parts.Length == 2)
                {
                    var key = parts[0].Trim();
                    var val = parts[1].Trim();
                    if (!string.IsNullOrEmpty(key) && string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                    {
                        Environment.SetEnvironmentVariable(key, val);
                    }
                }
            }
            break;
        }
        var parent = Directory.GetParent(current);
        if (parent == null) break;
        current = parent.FullName;
    }
}

public partial class Program { }
