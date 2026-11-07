using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PharmaSecure.Application.Common;
using PharmaSecure.Application.Features.Auth;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Security;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> authServiceMock = new();
    private readonly Mock<ICurrentUserContext> userContextMock = new();

    private const string TestUserId = "us-00000000-0000-0000-0000-000000000001";
    private const string TestBranchId = "br-00000000-0000-0000-0000-000000000001";

    private AuthController CreateController()
    {
        var controller = new AuthController(
            authServiceMock.Object,
            userContextMock.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        return controller;
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsOkWithTokenAndFullProfile()
    {
        // Arrange
        var request = new LoginRequest("chunhathuoc", "Admin@123");
        var expectedProfile = new UserProfileResponse(
            TestUserId,
            "chunhathuoc",
            "Chủ Nhà Thuốc",
            "OWNER",
            TestBranchId,
            TestBranchId,
            "Chi Nhánh Trung Tâm");

        var loginResponse = new LoginResponse(
            "fake-jwt-token-xyz",
            "Bearer",
            3600,
            expectedProfile);

        authServiceMock.Setup(s => s.LoginAsync(
                It.Is<LoginRequest>(r => r.Username == "chunhathuoc" && r.Password == "Admin@123"),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<LoginResponse>.Success(loginResponse));

        var controller = CreateController();

        // Act
        var actionResult = await controller.LoginAsync(request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<LoginResponse>(okResult.Value);
        Assert.Equal("fake-jwt-token-xyz", response.AccessToken);
        Assert.Equal("chunhathuoc", response.User.Username);
        Assert.Equal("Chủ Nhà Thuốc", response.User.FullName);
        Assert.Equal("Chi Nhánh Trung Tâm", response.User.BranchName);
        Assert.Equal("OWNER", response.User.Role);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest("chunhathuoc", "WrongPassword");

        authServiceMock.Setup(s => s.LoginAsync(
                It.IsAny<LoginRequest>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<LoginResponse>.Failure("Invalid username or password."));

        var controller = CreateController();

        // Act
        var actionResult = await controller.LoginAsync(request, CancellationToken.None);

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(actionResult.Result);
        Assert.Equal(StatusCodes.Status401Unauthorized, problemResult.StatusCode);
        var problemDetails = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal("Invalid username or password.", problemDetails.Title);
    }

    [Fact]
    public async Task LoginAsync_WithDeactivatedUser_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest("locked_user", "Pass@123");

        authServiceMock.Setup(s => s.LoginAsync(
                It.IsAny<LoginRequest>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<LoginResponse>.Failure("User account is deactivated."));

        var controller = CreateController();

        // Act
        var actionResult = await controller.LoginAsync(request, CancellationToken.None);

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(actionResult.Result);
        Assert.Equal(StatusCodes.Status401Unauthorized, problemResult.StatusCode);
        var problemDetails = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal("User account is deactivated.", problemDetails.Title);
    }

    [Theory]
    [InlineData("", "Password123")]
    [InlineData("username", "")]
    [InlineData("   ", "   ")]
    public async Task LoginAsync_WithMissingFields_ReturnsBadRequest(string username, string password)
    {
        // Arrange
        var request = new LoginRequest(username, password);
        var controller = CreateController();

        // Act
        var actionResult = await controller.LoginAsync(request, CancellationToken.None);

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(actionResult.Result);
        Assert.Equal(StatusCodes.Status400BadRequest, problemResult.StatusCode);
        var problemDetails = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal("Username and password are required.", problemDetails.Title);
    }

    [Fact]
    public async Task GetCurrentUserAsync_WhenAuthenticated_ReturnsProfile()
    {
        // Arrange
        userContextMock.Setup(u => u.IsAuthenticated).Returns(true);
        userContextMock.Setup(u => u.UserId).Returns(TestUserId);
        userContextMock.Setup(u => u.BranchId).Returns(TestBranchId);

        var expectedProfile = new UserProfileResponse(
            TestUserId,
            "chunhathuoc",
            "Chủ Nhà Thuốc",
            "OWNER",
            TestBranchId,
            TestBranchId,
            "Chi Nhánh Trung Tâm");

        authServiceMock.Setup(s => s.GetCurrentUserAsync(TestUserId, TestBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<UserProfileResponse>.Success(expectedProfile));

        var controller = CreateController();

        // Act
        var actionResult = await controller.GetCurrentUserAsync(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var profile = Assert.IsType<UserProfileResponse>(okResult.Value);
        Assert.Equal(TestUserId, profile.UserId);
        Assert.Equal("Chủ Nhà Thuốc", profile.FullName);
        Assert.Equal("Chi Nhánh Trung Tâm", profile.BranchName);
    }

    [Fact]
    public async Task GetCurrentUserAsync_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Arrange
        userContextMock.Setup(u => u.IsAuthenticated).Returns(false);
        userContextMock.Setup(u => u.UserId).Returns((string?)null);

        var controller = CreateController();

        // Act
        var actionResult = await controller.GetCurrentUserAsync(CancellationToken.None);

        // Assert
        Assert.IsType<UnauthorizedResult>(actionResult.Result);
    }

    [Fact]
    public async Task SwitchBranchAsync_WhenOwnerAndTargetIsValid_ReturnsReplacementSession()
    {
        userContextMock.Setup(u => u.IsAuthenticated).Returns(true);
        userContextMock.Setup(u => u.UserId).Returns(TestUserId);
        userContextMock.Setup(u => u.BranchId).Returns(TestBranchId);
        const string targetBranchId = "br-00000000-0000-0000-0000-000000000002";
        var profile = new UserProfileResponse(TestUserId, "chunhathuoc", "Owner", "OWNER", TestBranchId, targetBranchId, "Chi nh?nh 2");
        var expected = new LoginResponse("replacement-token", "Bearer", 3600, profile);
        authServiceMock.Setup(s => s.SwitchBranchAsync(
                TestUserId,
                TestBranchId,
                targetBranchId,
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<LoginResponse>.Success(expected));

        var result = await CreateController().SwitchBranchAsync(new SwitchBranchRequest(targetBranchId), CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<LoginResponse>(ok.Value);
        Assert.Equal("replacement-token", response.AccessToken);
        Assert.Equal(TestBranchId, response.User.HomeBranchId);
        Assert.Equal(targetBranchId, response.User.BranchId);
    }

    [Fact]
    public void SwitchBranchAsync_RequiresOwnerRole()
    {
        var method = typeof(AuthController).GetMethod(nameof(AuthController.SwitchBranchAsync));
        var authorize = Assert.Single(method!.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true).Cast<AuthorizeAttribute>());
        Assert.Equal("OWNER", authorize.Roles);
    }

    [Fact]
    public async Task LogoutAsync_WhenAuthenticated_ReturnsNoContent()
    {
        // Arrange
        userContextMock.Setup(u => u.IsAuthenticated).Returns(true);
        userContextMock.Setup(u => u.UserId).Returns(TestUserId);

        authServiceMock.Setup(s => s.LogoutAsync(
                TestUserId,
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        var controller = CreateController();

        // Act
        var actionResult = await controller.LogoutAsync(CancellationToken.None);

        // Assert
        Assert.IsType<NoContentResult>(actionResult);
    }

    [Fact]
    public async Task LogoutAsync_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Arrange
        userContextMock.Setup(u => u.IsAuthenticated).Returns(false);
        userContextMock.Setup(u => u.UserId).Returns((string?)null);

        var controller = CreateController();

        // Act
        var actionResult = await controller.LogoutAsync(CancellationToken.None);

        // Assert
        Assert.IsType<UnauthorizedResult>(actionResult);
    }
}
