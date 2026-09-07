import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('landlordvision_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null; // Unauthenticated by default so site opens to Login/Registration
  });

  const [selectedPortfolio, setSelectedPortfolio] = useState('My Portfolio');

  const portfolios = [
    { id: 'my-portfolio', name: 'My Portfolio', count: 12 },
    { id: 'residential', name: 'Residential Portfolio', count: 8 },
    { id: 'commercial', name: 'Commercial Portfolio', count: 4 },
    { id: 'development', name: 'Development Portfolio', count: 2 },
  ];

  const login = (userData) => {
    const loggedInUser = userData || {
      name: 'Old Street Holdings Ltd',
      email: 'ftaccountants@hotmail.com',
      company: 'LandlordVision Property Management',
      avatarUrl: null,
    };
    setUser(loggedInUser);
    localStorage.setItem('landlordvision_user', JSON.stringify(loggedInUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('landlordvision_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        selectedPortfolio,
        setSelectedPortfolio,
        portfolios,
        login,
        logout,
        isAuthenticated: Boolean(user),
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
