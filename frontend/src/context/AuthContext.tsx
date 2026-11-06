import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import type { CurrentUser, LoginResponse } from '../types';

interface AuthContextValue {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void> | void;
  refreshCurrentUser: () => Promise<void>;
  clearSession: (notice?: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const cachedUser = localStorage.getItem('auth_user');
    return cachedUser ? (JSON.parse(cachedUser) as CurrentUser) : null;
  });
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem('auth_token')));

  useEffect(() => {
    const onUnauthorized = (event: Event) => {
      setCurrentUser(null);
      const customEvent = event as CustomEvent<{ message?: string }>;
      const notice =
        customEvent.detail?.message ||
        'Phiên làm việc đã kết thúc do tài khoản được đăng nhập trên thiết bị khác.';
      navigate('/login', { replace: true, state: { notice, noticeType: 'warning', superseded: true } });
    };
    window.addEventListener('pharmasecure:unauthorized', onUnauthorized);
    return () => window.removeEventListener('pharmasecure:unauthorized', onUnauthorized);
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) {
      setIsLoading(false);
      return;
    }

    let active = true;
    apiClient<CurrentUser>('/auth/me')
      .then((user) => {
        if (!active) return;
        setCurrentUser(user);
        localStorage.setItem('auth_user', JSON.stringify(user));
      })
      .catch(() => {
        if (active && !localStorage.getItem('auth_token')) setCurrentUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function signIn(username: string, password: string) {
    const response = await apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('auth_token', response.accessToken);
    localStorage.setItem('auth_user', JSON.stringify(response.user));
    setCurrentUser(response.user);

    if (response.user.role === 'SALES') {
      navigate('/checkout', { replace: true });
    } else if (response.user.role === 'WAREHOUSE') {
      navigate('/inventory', { replace: true });
    } else {
      navigate('/reports', { replace: true });
    }
  }

  async function signOut() {
    try {
      if (localStorage.getItem('auth_token')) {
        await apiClient('/auth/logout', { method: 'POST' });
      }
    } catch {
      // Ignore logout network errors to ensure client session is always cleaned up
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setCurrentUser(null);
      navigate('/login', { replace: true });
    }
  }

  async function refreshCurrentUser() {
    const user = await apiClient<CurrentUser>('/auth/me');
    setCurrentUser(user);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }
  function clearSession(notice?: string) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setCurrentUser(null);
    navigate('/login', { replace: true, state: { notice } });
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, signIn, signOut, refreshCurrentUser, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider.');
  return value;
}
