using PharmaSecure.Infrastructure.Security;
using Xunit;

namespace PharmaSecure.Tests.Security;

public class PasswordHasherTests
{
    [Fact]
    public void VerifyPassword_WithCorrectPassword_ReturnsTrue()
    {
        // Arrange
        var hasher = new BouncyCastlePasswordHasher();
        // Standard BCrypt hash for "123456" as seeded in database/seed.sql
        var hash = "$2a$12$eImiTXuWVxjM72fGC47AouX8L.g3qK8zG9/mP83D4qgX4mN3e2P3q";

        // Act
        var result = hasher.VerifyPassword("123456", hash);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void VerifyPassword_WithIncorrectPassword_ReturnsFalse()
    {
        // Arrange
        var hasher = new BouncyCastlePasswordHasher();
        var hash = "$2a$12$eImiTXuWVxjM72fGC47AouX8L.g3qK8zG9/mP83D4qgX4mN3e2P3q";

        // Act
        var result = hasher.VerifyPassword("wrongpassword", hash);

        // Assert
        Assert.False(result);
    }

    [Theory]
    [InlineData("", "some_hash")]
    [InlineData("123456", "")]
    [InlineData(null, "some_hash")]
    public void VerifyPassword_WithNullOrWhitespace_ReturnsFalse(string? password, string? hash)
    {
        // Arrange
        var hasher = new BouncyCastlePasswordHasher();

        // Act
        var result = hasher.VerifyPassword(password!, hash!);

        // Assert
        Assert.False(result);
    }
}
