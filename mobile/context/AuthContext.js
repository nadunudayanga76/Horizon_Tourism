import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.log('Error loading storage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: authToken, user: userData } = response.data;
      
      if (authToken) {
        setToken(authToken);
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        await AsyncStorage.setItem('token', authToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true };
      }
      return { success: false, error: 'No token received from server' };
    } catch (error) {
      console.log('Login error:', error.response?.data || error.message);
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return { success: false, error: 'Connection timed out. Make sure the server is running.' };
      }
      if (error.message === 'Network Error' || !error.response) {
        return { success: false, error: 'Cannot reach server. Make sure the backend is running on port 5000.' };
      }
      return { success: false, error: error.response?.data?.error || 'Login failed. Please check your credentials.' };
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, phone });
      const { token: authToken, user: userData } = response.data;
      
      if (authToken) {
        setToken(authToken);
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        await AsyncStorage.setItem('token', authToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true };
      }
      return { success: false, error: 'No token received after registration' };
    } catch (error) {
      console.log('Registration error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
