'use client';

import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import type { JWTPayload } from '@/lib/auth';
import type { User } from '@/lib/db';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  updateUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current user on mount
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('[v0] Failed to fetch current user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (err) {
      setError('Logout failed');
      console.error('[v0] Logout error:', err);
    }
  }, []);

  const updateUser = useCallback((newUser: User | null) => {
    setUser(newUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
