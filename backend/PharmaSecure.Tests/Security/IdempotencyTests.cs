using PharmaSecure.Infrastructure.Security;
using Xunit;

namespace PharmaSecure.Tests.Security;

public class IdempotencyTests
{
    [Fact]
    public void SetAndGet_WhenKeyExistsAndNotExpired_ReturnsTrueAndCachedValue()
    {
        // Arrange
        var service = new MemoryIdempotencyService();
        var key = "test-key-1";
        var expectedData = "invoice-response-data";

        // Act
        service.Set(key, expectedData, TimeSpan.FromMinutes(5));
        var found = service.TryGet<string>(key, out var actualData);

        // Assert
        Assert.True(found);
        Assert.Equal(expectedData, actualData);
    }

    [Fact]
    public void TryGet_WhenKeyDoesNotExist_ReturnsFalse()
    {
        // Arrange
        var service = new MemoryIdempotencyService();

        // Act
        var found = service.TryGet<string>("nonexistent-key", out var actualData);

        // Assert
        Assert.False(found);
        Assert.Null(actualData);
    }
}
