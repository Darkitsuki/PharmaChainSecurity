using Microsoft.Extensions.Configuration;
using Moq;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.Domain.Enums;
using PharmaSecure.Infrastructure.Persistence;
using Xunit;

namespace PharmaSecure.Tests.Security;

public sealed class OracleConnectionFactoryTests
{
    private const string BranchId = "br-00000000-0000-0000-0000-000000000001";
    private const string UserId = "us-00000000-0000-0000-0000-000000000001";

    [Fact]
    public async Task CreateOpenConnectionAsync_WhenUserIsNotAuthenticated_FailsBeforeOpeningConnection()
    {
        var currentUser = CreateCurrentUser(isAuthenticated: false, UserRole.SALES, BranchId);
        var factory = CreateFactory(currentUser.Object, BranchId);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => factory.CreateOpenConnectionAsync(BranchId));

        Assert.Contains("authenticated user", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateOpenConnectionAsync_WhenAuthenticatedBranchDiffers_FailsClosed()
    {
        var currentUser = CreateCurrentUser(true, UserRole.SALES, "br-other");
        var factory = CreateFactory(currentUser.Object, BranchId);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => factory.CreateOpenConnectionAsync(BranchId));

        Assert.Contains("authenticated user branch", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateOpenConnectionAsync_WhenRequiredClaimIsMissing_FailsClosed()
    {
        var currentUser = CreateCurrentUser(true, role: null, BranchId);
        var factory = CreateFactory(currentUser.Object, BranchId);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => factory.CreateOpenConnectionAsync(BranchId));

        Assert.Contains("user, role, and branch", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void CreateSetSessionContextCommand_UsesTrustedValuesWithoutRoleRemapping()
    {
        using var connection = new OracleConnection();
        using var command = OracleConnectionFactory.CreateSetSessionContextCommand(
            connection,
            UserId,
            UserRole.OWNER.ToString(),
            BranchId);

        Assert.True(command.BindByName);
        Assert.Contains("PKG_PHARMA_SECURITY.SET_USER_CONTEXT", command.CommandText, StringComparison.Ordinal);
        Assert.Contains("DBMS_SESSION.SET_IDENTIFIER", command.CommandText, StringComparison.Ordinal);
        Assert.Equal(UserId, command.Parameters["userId"].Value);
        Assert.Equal("OWNER", command.Parameters["roleCode"].Value);
        Assert.Equal(BranchId, command.Parameters["branchId"].Value);
    }

    [Fact]
    public void CreateSetSessionContextCommand_ForSequentialBranches_DoesNotReusePreviousBranch()
    {
        const string secondBranchId = "br-00000000-0000-0000-0000-000000000002";
        using var connection = new OracleConnection();
        using var firstCommand = OracleConnectionFactory.CreateSetSessionContextCommand(
            connection,
            UserId,
            UserRole.SALES.ToString(),
            BranchId);
        using var secondCommand = OracleConnectionFactory.CreateSetSessionContextCommand(
            connection,
            UserId,
            UserRole.SALES.ToString(),
            secondBranchId);

        Assert.Equal(BranchId, firstCommand.Parameters["branchId"].Value);
        Assert.Equal(secondBranchId, secondCommand.Parameters["branchId"].Value);
        Assert.NotEqual(
            firstCommand.Parameters["branchId"].Value,
            secondCommand.Parameters["branchId"].Value);
    }

    [Fact]
    public void CreateClearSessionContextCommand_ClearsPackageContextAndClientIdentifier()
    {
        using var connection = new OracleConnection();
        using var command = OracleConnectionFactory.CreateClearSessionContextCommand(connection);

        Assert.Contains("PKG_PHARMA_SECURITY.CLEAR_USER_CONTEXT", command.CommandText, StringComparison.Ordinal);
        Assert.Contains("DBMS_SESSION.CLEAR_IDENTIFIER", command.CommandText, StringComparison.Ordinal);
    }

    [Fact]
    public async Task OracleSessionContextScope_ClearsContextOnlyOnce()
    {
        var factory = new Mock<IOracleConnectionFactory>();
        using var connection = new OracleConnection();
        factory.Setup(x => x.ClearSessionContextAsync(connection, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var scope = new OracleSessionContextScope(factory.Object, connection);

        await scope.DisposeAsync();
        await scope.DisposeAsync();

        factory.Verify(
            x => x.ClearSessionContextAsync(connection, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static OracleConnectionFactory CreateFactory(ICurrentUserContext currentUser, string? activeBranch)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "User Id=not-used;Data Source=127.0.0.1:1/NOT_USED"
            })
            .Build();
        var branchContext = new Mock<IBranchContextAccessor>();
        branchContext.SetupGet(x => x.BranchId).Returns(activeBranch);
        return new OracleConnectionFactory(configuration, branchContext.Object, currentUser);
    }

    private static Mock<ICurrentUserContext> CreateCurrentUser(
        bool isAuthenticated,
        UserRole? role,
        string? branchId)
    {
        var currentUser = new Mock<ICurrentUserContext>();
        currentUser.SetupGet(x => x.IsAuthenticated).Returns(isAuthenticated);
        currentUser.SetupGet(x => x.UserId).Returns(UserId);
        currentUser.SetupGet(x => x.Role).Returns(role);
        currentUser.SetupGet(x => x.BranchId).Returns(branchId);
        return currentUser;
    }
}
