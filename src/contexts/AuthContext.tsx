'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '@/config/api';

interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthData {
  token: string;
  user: User;
}

interface AuthContextType {
  authData: AuthData | null;
  setAuthData: (data: AuthData | null) => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cek status autentikasi dari backend
    const checkAuth = async () => {
      try {
        const authData = localStorage.getItem('auth');
        if (!authData) {
          setAuthData(null);
          setError(null);
          return;
        }

        const { token } = JSON.parse(authData);
        
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: token
          })
        });

        const data = await response.json();
        
        if (data.isAuthorized) {
          // Token masih valid, pertahankan data auth yang ada
          setAuthData(JSON.parse(authData));
          setError(null);
        } else {
          // Token tidak valid, hapus data auth
          localStorage.removeItem('auth');
          setAuthData(null);
          setError('Session expired');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setAuthData(null);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ authData, setAuthData, isLoading, error }}>
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