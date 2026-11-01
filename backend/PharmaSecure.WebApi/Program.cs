using PharmaSecure.Infrastructure;
using PharmaSecure.WebApi.Middlewares;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Register Infrastructure Layer abstractions and dependencies
builder.Services.AddInfrastructureServices(builder.Configuration);

var app = builder.Build();
var hasher = new PharmaSecure.Infrastructure.Security.BouncyCastlePasswordHasher();
string newHash = hasher.HashPassword("123456");
Console.WriteLine($"\n==========================================");
Console.WriteLine($"GENERATED HASH: {newHash}");
Console.WriteLine($"==========================================\n");
// Configure the HTTP request pipeline.
// Configure the HTTP request pipeline
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseMiddleware<BranchContextMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();