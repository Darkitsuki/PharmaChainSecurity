namespace PharmaSecure.Application.Interfaces;

public interface IPasswordHasher
{
    bool VerifyPassword(string password, string passwordHash);
}
