'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { api } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('optimark_cms_token');
    const storedUser = localStorage.getItem('optimark_cms_user');

    if (!token) {
      setLoading(false);
      if (pathname !== '/login') {
        router.push('/login');
      }
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }

    // Verify token validity with backend
    api.getMe()
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem('optimark_cms_user', JSON.stringify(freshUser));
      })
      .catch((err) => {
        console.warn('Session verification failed, clearing auth:', err);
        localStorage.removeItem('optimark_cms_token');
        localStorage.removeItem('optimark_cms_user');
        setUser(null);
        if (pathname !== '/login') {
          router.push('/login');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pathname, router]);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    localStorage.setItem('optimark_cms_token', res.accessToken);
    localStorage.setItem('optimark_cms_user', JSON.stringify(res.user));
    setUser(res.user);
    router.push('/articles');
  };

  const logout = () => {
    localStorage.removeItem('optimark_cms_token');
    localStorage.removeItem('optimark_cms_user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
