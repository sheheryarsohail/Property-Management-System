'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './axios';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  customerId?: string;
  allowedTabs?: string[];
  authorizedTenants?: { id: string; name: string }[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncProfile = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const res = await api.get('/auth/me');
      if (res.data) {
        setUser((prev) => {
          const updated = { ...(prev || {}), ...res.data };
          localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  useEffect(() => {
    // Check local storage on mount
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);

    // Sync latest permissions and allowedTabs from database
    syncProfile();

    const handleFocus = () => {
      syncProfile();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // Auto-select the first authorized tenant on login to prevent cross-account tenant leakage
    if (userData.authorizedTenants && userData.authorizedTenants.length > 0) {
      const currentTenantId = localStorage.getItem('tenant_id');
      const hasAccess = userData.authorizedTenants.some(t => t.id === currentTenantId);
      
      // If no valid tenant is selected, or if not authorized for current tenant, or if SUPER_ADMIN is logging in
      if (!currentTenantId || !hasAccess || userData.role === 'SUPER_ADMIN') {
        localStorage.setItem('tenant_id', userData.authorizedTenants[0].id);
      }
    } else {
      // Fallback for completely isolated local accounts
      const currentTenantId = localStorage.getItem('tenant_id');
      if (!currentTenantId || currentTenantId !== 't_local') {
        localStorage.setItem('tenant_id', 't_local');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant_id');
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
