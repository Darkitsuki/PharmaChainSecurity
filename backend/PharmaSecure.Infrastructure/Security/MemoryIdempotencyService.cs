using System.Collections.Concurrent;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Security;

public sealed class MemoryIdempotencyService : IIdempotencyService
{
    private readonly ConcurrentDictionary<string, IdempotencyEntry> store = new();

    public bool TryGet<T>(string key, out T? value)
    {
        if (store.TryGetValue(key, out var entry) && entry.ExpiresAt > DateTime.UtcNow)
        {
            if (entry.Value is T castValue)
            {
                value = castValue;
                return true;
            }
        }

        value = default;
        return false;
    }

    public void Set<T>(string key, T value, TimeSpan? expiration = null)
    {
        var expiresAt = DateTime.UtcNow.Add(expiration ?? TimeSpan.FromHours(1));
        store[key] = new IdempotencyEntry(value, expiresAt);
    }

    private sealed record IdempotencyEntry(object? Value, DateTime ExpiresAt);
}
