using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using PharmaSecure.Application.Features.Auth;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Enums;
using PharmaSecure.Infrastructure.Persistence;
using PharmaSecure.Infrastructure.Security;
using Xunit;

namespace PharmaSecure.Tests.Security;

public sealed class AuthServiceTests
{
    private readonly Mock<IOracleConnectionFactory> connectionFactoryMock = new();
    private readonly Mock<IJwtTokenService> jwtTokenServiceMock = new();
    private readonly Mock<IPasswordHasher> passwordHasherMock = new();
    private readonly Mock<IActiveSessionTracker> sessionTrackerMock = new();
    private readonly IOptions<JwtOptions> jwtOptions = Options.Create(new JwtOptions
    {
        SecretKey = new string('s', 40),
        Issuer = "PharmaSecureTest",
        Audience = "PharmaSecureTest",
        ExpiryMinutes = 60
    });

    private AuthService CreateService()
    {
        return new AuthService(
            connectionFactoryMock.Object,
            jwtTokenServiceMock.Object,
            passwordHasherMock.Object,
            jwtOptions,
            NullLogger<AuthService>.Instance,
            sessionTrackerMock.Object);
    }

    [Theory]
    [InlineData("", "Password123")]
    [InlineData("username", "")]
    [InlineData("   ", "   ")]
    public async Task LoginAsync_WhenCredentialsEmpty_ReturnsFailureWithoutRegisteringSession(string username, string password)
    {
        // Arrange
        var service = CreateService();
        var request = new LoginRequest(username, password);

        // Act
        var result = await service.LoginAsync(request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Username and password are required.", result.Error);
        sessionTrackerMock.Verify(t => t.SetActiveSession(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task LogoutAsync_WhenCalledWithValidUserId_InvalidatesSessionInTracker()
    {
        // Arrange
        var service = CreateService();
        const string userId = "user-to-logout-001";

        // Setup connection factory to throw for audit log query in mock environment
        connectionFactoryMock.Setup(f => f.CreateAuthConnectionAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("No database in unit test."));

        // Act - Throws AuditPersistenceException because audit log persistence fails in unit test without Oracle
        await Assert.ThrowsAsync<PharmaSecure.Application.Features.Security.AuditPersistenceException>(() =>
            service.LogoutAsync(userId));

        // Assert - Session must have been revoked in tracker before attempting audit log
        sessionTrackerMock.Verify(t => t.InvalidateSession(userId), Times.Once);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task LogoutAsync_WhenUserIdInvalid_ReturnsFailureWithoutCallingTracker(string? userId)
    {
        // Arrange
        var service = CreateService();

        // Act
        var result = await service.LogoutAsync(userId!);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("User ID is required.", result.Error);
        sessionTrackerMock.Verify(t => t.InvalidateSession(It.IsAny<string>()), Times.Never);
    }

    [Theory]
    [InlineData("CHỦ NHÀ THUỐC", null, UserRole.OWNER)]
    [InlineData("NHÂN VIÊN KHO", null, UserRole.WAREHOUSE)]
    [InlineData("NHÂN VIÊN BÁN HÀNG", null, UserRole.SALES)]
    [InlineData("Owner", null, UserRole.OWNER)]
    [InlineData("Warehouse", null, UserRole.WAREHOUSE)]
    [InlineData("Sales", null, UserRole.SALES)]
    [InlineData("CustomRole", "rl-00000000-0000-0000-0000-000000000001", UserRole.OWNER)]
    [InlineData("CustomRole", "rl-00000000-0000-0000-0000-000000000002", UserRole.WAREHOUSE)]
    [InlineData("CustomRole", "rl-00000000-0000-0000-0000-000000000003", UserRole.SALES)]
    public void MapToUserRole_MapsRolesCorrectly(string roleName, string? roleId, UserRole expected)
    {
        var role = AuthService.MapToUserRole(roleName, roleId);
        Assert.Equal(expected, role);
    }
}
