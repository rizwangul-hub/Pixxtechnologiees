import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

const formatUserData = (u) => {
  if (!u) return u;
  return {
    ...u,
    name: (!u.name || u.name === 'Pixx Manager' || u.name === 'System Admin') ? 'Fahad Rasheed' : u.name,
    role: (!u.role || u.role === 'Administrator') ? 'Manager Accounts' : u.role,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pixx_user') || localStorage.getItem('landlordvision_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return formatUserData(parsed);
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
            const formatted = formatUserData(res.manager);
            setUser(formatted);
            localStorage.setItem('pixx_user', JSON.stringify(formatted));
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
      const formatted = formatUserData(res.manager);
      setToken(res.token);
      setUser(formatted);
      localStorage.setItem('pixx_auth_token', res.token);
      localStorage.setItem('pixx_user', JSON.stringify(formatted));
      return formatted;
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
