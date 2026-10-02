import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import type { CurrentUser, LoginResponse } from '../types';

interface AuthContextValue {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
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
    const onUnauthorized = () => {
      setCurrentUser(null);
      navigate('/login', { replace: true });
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
    navigate('/', { replace: true });
  }

  function signOut() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setCurrentUser(null);
    navigate('/login', { replace: true });
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider.');
  return value;
}