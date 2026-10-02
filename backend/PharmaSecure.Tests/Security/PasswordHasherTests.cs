using PharmaSecure.Infrastructure.Security;
using Xunit;

namespace PharmaSecure.Tests.Security;

public class PasswordHasherTests
{
    [Fact]
    public void HashPassword_WithValidPassword_GeneratesVerifiableHash()
    {
        // Arrange
        var hasher = new BouncyCastlePasswordHasher();

        // Act
        var hash = hasher.HashPassword("secure-password");

        // Assert
        Assert.False(string.IsNullOrWhiteSpace(hash));
        Assert.StartsWith("$2", hash);
        Assert.True(hasher.VerifyPassword("secure-password", hash));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void HashPassword_WithNullOrWhitespacePassword_ThrowsArgumentException(string? password)
    {
        // Arrange
        var hasher = new BouncyCastlePasswordHasher();

        // Act & Assert
        Assert.ThrowsAny<ArgumentException>(() => hasher.HashPassword(password!));
    }

    [Fact]
    public void VerifyPassword_WithCorrectPassword_ReturnsTrue()
    {
        // Arrange
        var hasher = new BouncyCastlePasswordHasher();
        var hash = hasher.HashPassword("123456");

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
        var hash = hasher.HashPassword("123456");

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
