/**
 * File: src/context/AuthContext.jsx
 * Overall Purpose: Manages global authentication state, token storage, and session lifecycle.
 * Connections: Wraps the entire App component tree. Exposes auth state to page route guards,
 * the Navbar, and other views requiring user identity context.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setToken, apiLogin, apiSignup, apiGetProfile, registerUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Clears session credentials. Memoized so it can be safely passed to Axios
   * registry interceptor without causing infinite re-render loops.
   */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    
    /* --------------------------------------------------------------------------
       JWT STORAGE SECURITY NOTE (FOR CYBER SECURITY INTERVIEWS):
       We are clearing the token from sessionStorage here.
       - sessionStorage: Mitigates CSRF since tokens aren't sent automatically. It is
         cleared on tab close, limiting the attack window compared to localStorage.
         However, it is still vulnerable to XSS if an attacker executes script context.
       - Alternative (In-Memory): Storing strictly in JS state is 100% XSS proof,
         but breaks UX on page refresh.
       - Alternative (HttpOnly Cookie): The most secure against XSS (when set with
         SameSite=Strict and Secure), but requires backend support which isn't configurable
         here.
       -------------------------------------------------------------------------- */
    sessionStorage.removeItem('auth_token');
  }, []);

  // Initialize Auth session on app mount
  useEffect(() => {
    // Register the 401 callback with Axios service
    registerUnauthorizedHandler(logout);

    const initializeAuth = async () => {
      const savedToken = sessionStorage.getItem('auth_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        // Hydrate Axios headers and query the current profile
        setToken(savedToken);
        const data = await apiGetProfile();
        if (data && data.user) {
          setUser(data.user);
        } else {
          logout();
        }
      } catch (error) {
        // If profile fetch fails (e.g. token expired), reset state
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [logout]);

  /**
   * Action: Logs in a user.
   * @param {string} email
   * @param {string} password
   */
  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    if (data && data.token) {
      sessionStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  /**
   * Action: Registers a new user.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   */
  const signup = async (name, email, password) => {
    const data = await apiSignup(name, email, password);
    if (data && data.token) {
      sessionStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume AuthContext cleanly across components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
