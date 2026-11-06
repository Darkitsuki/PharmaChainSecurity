using PharmaSecure.Infrastructure.Security;
using Xunit;

namespace PharmaSecure.Tests.Security;

public sealed class MemoryActiveSessionTrackerTests
{
    [Fact]
    public void SetActiveSession_WhenNewSessionAssigned_OverwritesPreviousSession()
    {
        // Arrange
        var tracker = new MemoryActiveSessionTracker();
        const string userId = "usr-001";
        const string jti1 = "session-guid-1";
        const string jti2 = "session-guid-2";

        // Act - Device 1 logs in
        tracker.SetActiveSession(userId, jti1);
        Assert.True(tracker.IsActiveSession(userId, jti1));

        // Act - Device 2 logs in with same userId
        tracker.SetActiveSession(userId, jti2);

        // Assert - Device 1 session is invalidated; Device 2 session is active
        Assert.False(tracker.IsActiveSession(userId, jti1));
        Assert.True(tracker.IsActiveSession(userId, jti2));
    }

    [Theory]
    [InlineData("usr-001", "valid-jti", true)]
    [InlineData("usr-001", "wrong-jti", false)]
    [InlineData("unknown-user", "valid-jti", false)]
    [InlineData("", "valid-jti", false)]
    [InlineData("usr-001", "", false)]
    [InlineData(null, "valid-jti", false)]
    [InlineData("usr-001", null, false)]
    public void IsActiveSession_ValidatesSessionCorrectly(string? userId, string? jti, bool expected)
    {
        // Arrange
        var tracker = new MemoryActiveSessionTracker();
        tracker.SetActiveSession("usr-001", "valid-jti");

        // Act
        var result = tracker.IsActiveSession(userId!, jti!);

        // Assert
        Assert.Equal(expected, result);
    }

    [Fact]
    public void InvalidateSession_WhenCalled_RemovesActiveSession()
    {
        // Arrange
        var tracker = new MemoryActiveSessionTracker();
        const string userId = "usr-001";
        const string jti = "active-session-id";

        tracker.SetActiveSession(userId, jti);
        Assert.True(tracker.IsActiveSession(userId, jti));

        // Act
        tracker.InvalidateSession(userId);

        // Assert
        Assert.False(tracker.IsActiveSession(userId, jti));
    }

    [Fact]
    public void MultipleUsers_SessionsRemainIsolated()
    {
        // Arrange
        var tracker = new MemoryActiveSessionTracker();
        const string userA = "usr-A";
        const string userB = "usr-B";
        const string jtiA1 = "jti-A-1";
        const string jtiA2 = "jti-A-2";
        const string jtiB1 = "jti-B-1";

        // Act
        tracker.SetActiveSession(userA, jtiA1);
        tracker.SetActiveSession(userB, jtiB1);

        // User A logs in from another device
        tracker.SetActiveSession(userA, jtiA2);

        // Assert
        Assert.False(tracker.IsActiveSession(userA, jtiA1));
        Assert.True(tracker.IsActiveSession(userA, jtiA2));
        // User B's session must remain unaffected
        Assert.True(tracker.IsActiveSession(userB, jtiB1));
    }

    [Fact]
    public async Task ConcurrentAccess_HandlesParallelUpdatesSafely()
    {
        // Arrange
        var tracker = new MemoryActiveSessionTracker();
        const int userCount = 50;
        const int iterationsPerUser = 100;

        // Act
        var tasks = Enumerable.Range(0, userCount).Select(u => Task.Run(() =>
        {
            var userId = $"concurrent-user-{u}";
            for (var i = 0; i < iterationsPerUser; i++)
            {
                var jti = $"jti-{u}-{i}";
                tracker.SetActiveSession(userId, jti);
                Assert.True(tracker.IsActiveSession(userId, jti));
            }
        }));

        await Task.WhenAll(tasks);

        // Assert - Each user should have their final iteration's JTI active
        for (var u = 0; u < userCount; u++)
        {
            var userId = $"concurrent-user-{u}";
            var finalJti = $"jti-{u}-{iterationsPerUser - 1}";
            Assert.True(tracker.IsActiveSession(userId, finalJti));
            Assert.False(tracker.IsActiveSession(userId, $"jti-{u}-0"));
        }
    }
}

