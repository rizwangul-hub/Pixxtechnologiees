import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';
import { Alert } from 'react-native';

interface Manager {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
}

interface AuthContextProps {
  manager: Manager | null;
  token: string | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  manager: null,
  token: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  restoreToken: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [manager, setManager] = useState<Manager | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async (jwt: string) => {
    try {
      const response = await client.get('/auth/me');
      setManager(response.data);
    } catch (error) {
      console.log('Failed to fetch current user', error);
      await signOut();
    }
  };

  const signIn = async (newToken: string) => {
    await SecureStore.setItemAsync('token', newToken);
    setToken(newToken);
    await fetchCurrentUser(newToken);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('token');
    setToken(null);
    setManager(null);
    try {
      await client.post('/auth/logout');
    } catch (_) {}
  };

  const restoreToken = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      if (storedToken) {
        setToken(storedToken);
        await fetchCurrentUser(storedToken);
      }
    } catch (e) {
      console.log('Error restoring token', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    restoreToken();
  }, []);

  // Global 401 handling – if a request returns 401, force logout
  useEffect(() => {
    const interceptor = client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          Alert.alert('Session Expired', 'Please login again.');
          await signOut();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      client.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ manager, token, isLoading, signIn, signOut, restoreToken }}>
      {children}
    </AuthContext.Provider>
  );
};
