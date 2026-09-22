namespace PharmaSecure.Application.Interfaces;

public interface IIdempotencyService
{
    bool TryGet<T>(string key, out T? value);
    void Set<T>(string key, T value, TimeSpan? expiration = null);
}
