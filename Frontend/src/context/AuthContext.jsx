import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pixx_user') || localStorage.getItem('landlordvision_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('pixx_auth_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Validate session on mount if token exists
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('pixx_auth_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.manager) {
            setUser(res.manager);
            localStorage.setItem('pixx_user', JSON.stringify(res.manager));
          } else {
            logout();
          }
        } catch (err) {
          console.warn('[Auth Session Expired or Server Unreachable]', err.message);
          // If server returns 401, clear token
          if (err.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success && res.token && res.manager) {
      setToken(res.token);
      setUser(res.manager);
      localStorage.setItem('pixx_auth_token', res.token);
      localStorage.setItem('pixx_user', JSON.stringify(res.manager));
      return res.manager;
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    localStorage.removeItem('pixx_auth_token');
    localStorage.removeItem('pixx_user');
    localStorage.removeItem('landlordvision_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        login,
        logout,
        isAuthenticated: Boolean(user && token),
        loading,
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
