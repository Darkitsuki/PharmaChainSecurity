using Microsoft.Extensions.DependencyInjection;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Infrastructure.Security;

namespace PharmaSecure.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserContext, CurrentUserContext>();

        return services;
    }
}
