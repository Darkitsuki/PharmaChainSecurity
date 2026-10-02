using Org.BouncyCastle.Crypto.Generators;
using PharmaSecure.Application.Interfaces;
using System.Security.Cryptography;

namespace PharmaSecure.Infrastructure.Security;

public sealed class BouncyCastlePasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 12;
    private const int SaltSize = 16;

    public string HashPassword(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);

        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        return OpenBsdBCrypt.Generate(password.ToCharArray(), salt, WorkFactor);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(passwordHash))
            return false;

        try
        {
            return OpenBsdBCrypt.CheckPassword(passwordHash, password.ToCharArray());
        }
        catch
        {
            return false;
        }
    }
}
