namespace PharmaSecure.Application.Interfaces;

public interface IActiveSessionTracker
{
    void SetActiveSession(string userId, string jti);
    bool IsActiveSession(string userId, string jti);
    void InvalidateSession(string userId);
}

