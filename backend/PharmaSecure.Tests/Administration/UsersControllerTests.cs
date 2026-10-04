using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PharmaSecure.Application.Features.Users;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Administration;

public class UsersControllerTests
{
    private readonly Mock<IUserService> userServiceMock = new();
    private readonly Mock<ICurrentUserContext> userContextMock = new();
    private readonly Mock<ILogger<UsersController>> loggerMock = new();

    private const string CurrentBranchId = "br-00000000-0000-0000-0000-000000000001";
    private const string CurrentOwnerUserId = "us-00000000-0000-0000-0000-000000000001";

    private UsersController CreateController()
    {
        userContextMock.Setup(u => u.BranchId).Returns(CurrentBranchId);
        userContextMock.Setup(u => u.UserId).Returns(CurrentOwnerUserId);

        var controller = new UsersController(
            userServiceMock.Object,
            userContextMock.Object,
            loggerMock.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        return controller;
    }

    [Fact]
    public async Task GetBranchUsers_WhenCalled_ReturnsOkWithUsersList()
    {
        // Arrange
        var users = new List<UserSummaryResponse>
        {
            new("us-1", "owner1", "Pharmacy Owner", "0901111111", "OWNER", CurrentBranchId, "Branch 1", true, DateTime.UtcNow),
            new("us-2", "sales1", "Sales Staff", "0902222222", "SALES", CurrentBranchId, "Branch 1", true, DateTime.UtcNow)
        };

        userServiceMock.Setup(s => s.GetBranchUsersAsync(CurrentBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        var controller = CreateController();

        // Act
        var result = await controller.GetBranchUsers(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<UserSummaryResponse>>(okResult.Value);
        Assert.Equal(2, returned.Count);
    }

    [Fact]
    public async Task GetById_WhenUserExists_ReturnsOk()
    {
        // Arrange
        var user = new UserSummaryResponse("us-2", "sales1", "Sales Staff", "0902222222", "SALES", CurrentBranchId, "Branch 1", true, DateTime.UtcNow);
        userServiceMock.Setup(s => s.GetByIdAsync("us-2", CurrentBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var controller = CreateController();

        // Act
        var result = await controller.GetById("us-2", CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<UserSummaryResponse>(okResult.Value);
        Assert.Equal("sales1", returned.Username);
        Assert.Equal("SALES", returned.Role);
    }

    [Fact]
    public async Task GetById_WhenUserNotFound_ReturnsNotFound()
    {
        // Arrange
        userServiceMock.Setup(s => s.GetByIdAsync("not-found", CurrentBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserSummaryResponse?)null);

        var controller = CreateController();

        // Act
        var result = await controller.GetById("not-found", CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFoundResult.Value);
        Assert.Equal(StatusCodes.Status404NotFound, problem.Status);
    }

    [Fact]
    public async Task Create_WithValidData_ReturnsCreatedResult()
    {
        // Arrange
        var request = new CreateUserRequest("sales_new", "SecretPass123!", "Nguyen Van A", "0934567890", "SALES");
        var created = new UserSummaryResponse("us-new", "sales_new", "Nguyen Van A", "0934567890", "SALES", CurrentBranchId, "Branch 1", true, DateTime.UtcNow);

        userServiceMock.Setup(s => s.CreateUserAsync(request, CurrentBranchId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        var controller = CreateController();

        // Act
        var result = await controller.Create(request, CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status201Created, objectResult.StatusCode);
        var returned = Assert.IsType<UserSummaryResponse>(objectResult.Value);
        Assert.Equal("sales_new", returned.Username);
    }

    [Fact]
    public async Task Create_WhenDuplicateUsername_ReturnsConflict()
    {
        // Arrange
        var request = new CreateUserRequest("sales1", "SecretPass123!", "Duplicate User", null, "SALES");
        userServiceMock.Setup(s => s.CreateUserAsync(request, CurrentBranchId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Username 'sales1' already exists in the system."));

        var controller = CreateController();

        // Act
        var result = await controller.Create(request, CancellationToken.None);

        // Assert
        var conflictResult = Assert.IsType<ConflictObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(conflictResult.Value);
        Assert.Equal(StatusCodes.Status409Conflict, problem.Status);
    }

    [Theory]
    [InlineData("", "Secret123", "Full Name", "SALES")]
    [InlineData("username", "12345", "Full Name", "SALES")] // Password < 6 chars
    [InlineData("username", "Secret123", "", "SALES")]
    [InlineData("username", "Secret123", "Full Name", "")]
    public async Task Create_WhenInvalidData_ReturnsBadRequest(string username, string password, string fullName, string role)
    {
        // Arrange
        var request = new CreateUserRequest(username, password, fullName, null, role);
        var controller = CreateController();

        // Act
        var result = await controller.Create(request, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(badRequestResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, problem.Status);
    }

    [Fact]
    public async Task UpdateStatus_SelfLockout_ReturnsBadRequest()
    {
        // Arrange
        // Calling update status on CurrentOwnerUserId
        var request = new UpdateUserStatusRequest(false);
        var controller = CreateController();

        // Act
        var result = await controller.UpdateStatus(CurrentOwnerUserId, request, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(badRequestResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, problem.Status);
        Assert.Equal("Self lockout prohibited", problem.Title);
    }

    [Fact]
    public async Task UpdateStatus_WhenValid_ReturnsOkResult()
    {
        // Arrange
        var request = new UpdateUserStatusRequest(false);
        var updated = new UserSummaryResponse("us-2", "sales1", "Sales Staff", "0902222222", "SALES", CurrentBranchId, "Branch 1", false, DateTime.UtcNow);

        userServiceMock.Setup(s => s.UpdateStatusAsync("us-2", CurrentBranchId, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        var controller = CreateController();

        // Act
        var result = await controller.UpdateStatus("us-2", request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<UserSummaryResponse>(okResult.Value);
        Assert.False(returned.IsActive);
    }

    [Fact]
    public async Task UpdateStatus_WhenUserNotFound_ReturnsNotFound()
    {
        // Arrange
        var request = new UpdateUserStatusRequest(false);
        userServiceMock.Setup(s => s.UpdateStatusAsync("not-found", CurrentBranchId, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserSummaryResponse?)null);

        var controller = CreateController();

        // Act
        var result = await controller.UpdateStatus("not-found", request, CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFoundResult.Value);
        Assert.Equal(StatusCodes.Status404NotFound, problem.Status);
    }
}
