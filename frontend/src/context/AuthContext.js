import React, { createContext, useState, useEffect } from 'react';
import { setAuthToken } from '../services/api';

export const AuthContext = createContext();

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    if (user?.token) setAuthToken(user.token);
  }, [user]);

  const login = (userData) => {
    setUser(userData);
    setAuthToken(userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
