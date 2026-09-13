import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';

const client = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

// Request interceptor – attach JWT from SecureStore
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor – globally handle 401 for expired authenticated sessions
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only alert "Session Expired" if this was an authenticated request, not a login attempt
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
    }
    return Promise.reject(error);
  }
);

export default client;
