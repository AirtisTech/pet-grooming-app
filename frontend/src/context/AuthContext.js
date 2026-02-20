import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import socketService from '../services/socket';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Connect/disconnect socket based on auth state
  useEffect(() => {
    if (user) {
      // Store userId for socket room joining
      localStorage.setItem('userId', user.id || user._id);
      // Connect socket
      socketService.connect();
      socketService.join(user.id || user._id);
    } else {
      socketService.disconnect();
      localStorage.removeItem('userId');
    }
  }, [user]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    // Socket connection will be triggered by useEffect
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    // Socket connection will be triggered by useEffect
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    socketService.disconnect();
    setUser(null);
  };

  // Update user profile in state
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
