import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiClient, ApiException } from '../api/client';
import type { AuthResult, AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'adminpos6.auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthResult;
        apiClient.setToken(parsed.accessToken);
        setUser(parsed.user);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  async function login(username: string, password: string): Promise<string | null> {
    try {
      const result = await apiClient.login(username, password);
      if (result.user.role !== 'ADMIN') {
        apiClient.setToken(null);
        return 'Solo administradores pueden acceder a este panel.';
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      setUser(result.user);
      return null;
    } catch (err) {
      if (err instanceof ApiException) return err.message;
      return 'No se pudo conectar con el servidor.';
    }
  }

  function logout() {
    apiClient.setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
