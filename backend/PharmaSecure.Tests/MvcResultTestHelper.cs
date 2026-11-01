using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace PharmaSecure.Tests;

internal static class MvcResultTestHelper
{
    internal static async Task ExecuteCreatedResultAsync(
        ControllerBase controller,
        IActionResult result,
        string createActionName,
        string requestPath,
        string expectedLocation)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Testing",
            ApplicationName = controller.GetType().Assembly.GetName().Name
        });
        builder.Services.AddControllers().AddApplicationPart(controller.GetType().Assembly);

        await using var app = builder.Build();
        app.MapControllers();
        app.UseRouting();
        app.UseEndpoints(_ => { });

        var endpoint = app.Services.GetRequiredService<EndpointDataSource>().Endpoints.Single(candidate =>
        {
            var action = candidate.Metadata.GetMetadata<ControllerActionDescriptor>();
            return action?.ControllerTypeInfo.AsType() == controller.GetType() &&
                action.ActionName == createActionName;
        });
        var actionDescriptor = endpoint.Metadata.GetMetadata<ControllerActionDescriptor>()!;

        await using var scope = app.Services.CreateAsyncScope();
        using var responseBody = new MemoryStream();
        var httpContext = controller.HttpContext;
        httpContext.RequestServices = scope.ServiceProvider;
        httpContext.Request.Scheme = "https";
        httpContext.Request.Host = new HostString("localhost");
        httpContext.Request.Path = requestPath;
        httpContext.Request.Method = HttpMethods.Post;
        httpContext.Response.Body = responseBody;
        httpContext.SetEndpoint(endpoint);

        var routeData = new RouteData();
        routeData.Values["controller"] = actionDescriptor.ControllerName;
        routeData.Values["action"] = actionDescriptor.ActionName;
        controller.ControllerContext = new ControllerContext(new ActionContext(httpContext, routeData, actionDescriptor));

        await result.ExecuteResultAsync(controller.ControllerContext);

        Assert.Equal(StatusCodes.Status201Created, httpContext.Response.StatusCode);
        Assert.Equal(expectedLocation, httpContext.Response.Headers.Location.ToString());
    }
}
