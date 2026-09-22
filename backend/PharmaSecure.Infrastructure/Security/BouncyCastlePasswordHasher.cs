using Org.BouncyCastle.Crypto.Generators;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Security;

public sealed class BouncyCastlePasswordHasher : IPasswordHasher
{
    public bool VerifyPassword(string password, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(passwordHash))
            return false;

        try
        {
            return OpenBSDBCrypt.CheckPassword(passwordHash, password.ToCharArray());
        }
        catch
        {
            return false;
        }
    }
}
