import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Logout function
  const logout = React.useCallback(() => {
    // Remove from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
    
    // Update state
    setCurrentUser(null);
  }, []);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          try {
            // Check if token is expired
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            
            if (decodedToken.exp < currentTime) {
              // Token expired, logout
              logout();
              return;
            }
            // Set auth header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Get user data safely
            try {
              const userStr = localStorage.getItem('user');
              if (userStr) {
                const userData = JSON.parse(userStr);
                setCurrentUser(userData);
              } else {
                logout();
              }
            } catch (parseError) {
              // Silently handle parse errors and logout
              logout();
            }
          } catch (tokenError) {
            // Silently handle token errors and logout
            logout();
          }
        }
      } catch (error) {
        // Silently handle auth errors and logout
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, [logout]);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setCurrentUser(user);
      setLoading(false);
      
      return { success: true };
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Login gagal. Silakan coba lagi.';
      setError(message);
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await axios.post('/api/auth/register', userData);

      const { token, user } = response.data.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setCurrentUser(user);
      setLoading(false);
      
      return { success: true };
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Pendaftaran gagal. Silakan coba lagi.';
      setError(message);
      return { success: false, message };
    }
  };


  // Update profile
  const updateProfile = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await axios.put('/api/auth/profile', userData);

      const { user } = response.data.data;
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setCurrentUser(user);
      setLoading(false);
      
      return { success: true };
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Update profil gagal. Silakan coba lagi.';
      setError(message);
      return { success: false, message };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      setLoading(true);
      
      await axios.put('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });

      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Ganti password gagal. Silakan coba lagi.';
      setError(message);
      return { success: false, message };
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 