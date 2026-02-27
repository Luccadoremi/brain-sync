import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      await authAPI.verifyToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('accessToken');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token) => {
    try {
      const response = await authAPI.verifyToken(token);
      console.log('Login response:', response);
      localStorage.setItem('accessToken', token);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error, error.response);
      throw new Error('Invalid access token');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
