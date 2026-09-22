using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Application.Features.Auth;
using PharmaSecure.Application.Features.Sales;
using PharmaSecure.Application.Features.Inventory;
using PharmaSecure.Application.Features.Invoices;
using PharmaSecure.Application.Features.Security;
using PharmaSecure.Infrastructure.Cryptography;
using PharmaSecure.Infrastructure.Persistence;
using PharmaSecure.Infrastructure.Security;

namespace PharmaSecure.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserContext, CurrentUserContext>();
        services.AddScoped<IBranchContextAccessor, BranchContextAccessor>();
        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, BouncyCastlePasswordHasher>();
        services.AddScoped<IAuthService, AuthService>();
        services.Configure<DigitalSignatureOptions>(configuration.GetSection("DigitalSignature"));
        services.AddSingleton<IDigitalSignatureService, DigitalSignatureService>();
        services.AddScoped<ICheckoutService, CheckoutService>();
        services.AddScoped<IDrugQueryService, DrugQueryService>();
        services.AddScoped<IInventoryQueryService, InventoryQueryService>();
        services.AddScoped<IInvoiceQueryService, InvoiceQueryService>();
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                var jwt = configuration.GetSection("Jwt");
                var secretKey = jwt["SecretKey"];
                if (string.IsNullOrWhiteSpace(secretKey))
                    throw new InvalidOperationException("Jwt:SecretKey must be configured.");

                if (secretKey.Equals("${JWT_SECRET}", StringComparison.Ordinal))
                    secretKey = Environment.GetEnvironmentVariable("JWT_SECRET");

                if (string.IsNullOrWhiteSpace(secretKey) || Encoding.UTF8.GetByteCount(secretKey) < 32)
                    throw new InvalidOperationException("JWT secret key must contain at least 256 bits.");

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                    ValidateIssuer = true,
                    ValidIssuer = jwt["Issuer"],
                    ValidateAudience = true,
                    ValidAudience = jwt["Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),
                    RoleClaimType = ClaimTypes.Role,
                    NameClaimType = ClaimTypes.Name
                };
            });
        services.AddAuthorization(options =>
        {
            options.AddPolicy("OwnerOnly", policy => policy.RequireRole("OWNER"));
            options.AddPolicy("SalesOnly", policy => policy.RequireRole("SALES"));
            options.AddPolicy("WarehouseOnly", policy => policy.RequireRole("WAREHOUSE"));
            options.AddPolicy("InventoryRead", policy => policy.RequireRole("OWNER", "SALES", "WAREHOUSE"));
        });
        services.AddScoped<IOracleConnectionFactory, OracleConnectionFactory>();
        services.AddScoped<OracleUnitOfWork>();
        services.AddScoped<IUnitOfWork>(serviceProvider => serviceProvider.GetRequiredService<OracleUnitOfWork>());
        services.AddScoped<IInventoryRepository, InventoryRepository>();
        services.AddScoped<IInvoicePersistence, InvoicePersistence>();

        return services;
    }
}
