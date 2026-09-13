import client from './client';

export const login = (email: string, password: string) => {
  return client.post('/auth/login', { email, password });
};

export const getCurrentUser = () => {
  return client.get('/auth/me');
};

export const logout = () => {
  return client.post('/auth/logout');
};
