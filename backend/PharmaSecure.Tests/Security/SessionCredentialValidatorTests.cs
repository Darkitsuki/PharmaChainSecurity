using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Moq;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Infrastructure.Persistence;
using PharmaSecure.Infrastructure.Security;
using Xunit;

namespace PharmaSecure.Tests.Security;

public sealed class SessionCredentialValidatorTests
{
    private readonly Mock<IOracleConnectionFactory> connectionFactoryMock = new(MockBehavior.Strict);
    private readonly Mock<IActiveSessionTracker> sessionTrackerMock = new();
    private readonly IOptions<JwtOptions> jwtOptions = Options.Create(new JwtOptions
    {
        SecretKey = new string('s', 40),
        Issuer = "PharmaSecureTest",
        Audience = "PharmaSecureTest",
        ExpiryMinutes = 60
    });

    private const string UserId = "user-uuid-001";
    private const string BranchId = "branch-uuid-001";
    private const string Role = "SALES";

    private ClaimsPrincipal CreatePrincipal(string jti, string userId = UserId, string? stamp = "dummy-stamp")
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new("UserId", userId),
            new(ClaimTypes.Role, Role),
            new("RoleCode", Role),
            new("BranchId", BranchId),
            new("jti", jti),
            new(JwtRegisteredClaimNames.Jti, jti)
        };

        if (stamp != null)
        {
            claims.Add(new Claim("pwdv", stamp));
        }

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
    }

    [Fact]
    public async Task ValidateAsync_WhenSessionSupersededByAnotherDevice_ReturnsFalseWithoutCallingDatabase()
    {
        // Scenario:
        // 1. User logs in from Machine 1 and gets Jti_1.
        // 2. User logs in from Machine 2 and gets Jti_2, superseding Machine 1.
        // 3. Machine 1 sends request with Jti_1 -> ValidateAsync must return false immediately.
        const string jtiMachine1 = "jti-machine-1-session";
        const string jtiMachine2 = "jti-machine-2-session";

        // Tracker only recognizes Machine 2 as active
        sessionTrackerMock.Setup(t => t.IsActiveSession(UserId, jtiMachine1)).Returns(false);
        sessionTrackerMock.Setup(t => t.IsActiveSession(UserId, jtiMachine2)).Returns(true);

        var validator = new SessionCredentialValidator(
            connectionFactoryMock.Object,
            jwtOptions,
            sessionTrackerMock.Object);

        var machine1Principal = CreatePrincipal(jtiMachine1);

        // Act
        var isValid = await validator.ValidateAsync(machine1Principal, CancellationToken.None);

        // Assert
        Assert.False(isValid);
        sessionTrackerMock.Verify(t => t.IsActiveSession(UserId, jtiMachine1), Times.Once);
        // Connection factory must never be invoked for an invalidated session
        connectionFactoryMock.Verify(f => f.CreateAuthConnectionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ValidateAsync_WithActiveSessionTrackerIntegration_InvalidatesPreviousSession()
    {
        // Arrange - Use real in-memory tracker to verify end-to-end flow between tracker and validator
        var realTracker = new MemoryActiveSessionTracker();
        const string jtiMachine1 = "jti-device-A";
        const string jtiMachine2 = "jti-device-B";

        // User logs in from Machine 1
        realTracker.SetActiveSession(UserId, jtiMachine1);
        Assert.True(realTracker.IsActiveSession(UserId, jtiMachine1));

        // User logs in from Machine 2 -> supersedes Machine 1
        realTracker.SetActiveSession(UserId, jtiMachine2);
        Assert.False(realTracker.IsActiveSession(UserId, jtiMachine1));
        Assert.True(realTracker.IsActiveSession(UserId, jtiMachine2));

        var validator = new SessionCredentialValidator(
            connectionFactoryMock.Object,
            jwtOptions,
            realTracker);

        var machine1Principal = CreatePrincipal(jtiMachine1);

        // Act - Request arrives from Machine 1 with old token
        var isMachine1Valid = await validator.ValidateAsync(machine1Principal, CancellationToken.None);

        // Assert - Machine 1 is denied access
        Assert.False(isMachine1Valid);
        connectionFactoryMock.Verify(f => f.CreateAuthConnectionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ValidateAsync_WhenMissingJtiClaim_ReturnsFalseWithoutCallingDb()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new("UserId", UserId),
            new("pwdv", "valid-stamp")
        };
        var principalWithoutJti = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));

        var validator = new SessionCredentialValidator(
            connectionFactoryMock.Object,
            jwtOptions,
            sessionTrackerMock.Object);

        // Act
        var isValid = await validator.ValidateAsync(principalWithoutJti, CancellationToken.None);

        // Assert
        Assert.False(isValid);
        sessionTrackerMock.Verify(t => t.IsActiveSession(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        connectionFactoryMock.Verify(f => f.CreateAuthConnectionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ValidateAsync_WhenMissingPasswordStampClaim_ReturnsFalseWithoutCallingDb()
    {
        // Arrange
        var principalWithoutStamp = CreatePrincipal("any-jti", UserId, stamp: null);

        var validator = new SessionCredentialValidator(
            connectionFactoryMock.Object,
            jwtOptions,
            sessionTrackerMock.Object);

        // Act
        var isValid = await validator.ValidateAsync(principalWithoutStamp, CancellationToken.None);

        // Assert
        Assert.False(isValid);
        sessionTrackerMock.Verify(t => t.IsActiveSession(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        connectionFactoryMock.Verify(f => f.CreateAuthConnectionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ValidateAsync_WhenMissingUserIdClaim_ReturnsFalseWithoutCallingDb()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new("jti", "valid-jti"),
            new("pwdv", "valid-stamp")
        };
        var principalWithoutUserId = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));

        var validator = new SessionCredentialValidator(
            connectionFactoryMock.Object,
            jwtOptions,
            sessionTrackerMock.Object);

        // Act
        var isValid = await validator.ValidateAsync(principalWithoutUserId, CancellationToken.None);

        // Assert
        Assert.False(isValid);
        sessionTrackerMock.Verify(t => t.IsActiveSession(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        connectionFactoryMock.Verify(f => f.CreateAuthConnectionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}

