import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('omni_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.success) {
          setUser(res.data.user);
          setVendor(res.data.vendor);
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success) {
      localStorage.setItem('omni_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setVendor(res.data.vendor);
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.success) {
      localStorage.setItem('omni_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setVendor(res.data.vendor);
      return res.data;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('omni_token');
    setToken(null);
    setUser(null);
    setVendor(null);
  };

  const updateProfile = async (profileData) => {
    const res = await api.patch('/auth/me', profileData);
    if (res.success) {
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Failed to update profile');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        vendor,
        token,
        loading,
        isAuthenticated: !!user,
        role: user?.role || 'GUEST',
        isCustomer: user?.role === 'CUSTOMER',
        isVendor: user?.role === 'VENDOR',
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
