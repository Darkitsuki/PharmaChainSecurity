using System.Collections.Concurrent;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Security;

public sealed class MemoryActiveSessionTracker : IActiveSessionTracker
{
    private readonly ConcurrentDictionary<string, string> sessions = new(StringComparer.Ordinal);

    public void SetActiveSession(string userId, string jti)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(jti))
            return;

        sessions[userId] = jti;
    }

    public bool IsActiveSession(string userId, string jti)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(jti))
            return false;

        return sessions.TryGetValue(userId, out var activeJti) &&
               string.Equals(activeJti, jti, StringComparison.Ordinal);
    }

    public void InvalidateSession(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return;

        sessions.TryRemove(userId, out _);
    }
}

