import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('food_mfg_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('food_mfg_token') || null;
  });

  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Synchronize auth state with API on mount if token exists
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Session expired');
          return res.json();
        })
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('food_mfg_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error?.message || 'Login failed. Please check your credentials.';
        setAuthError(errorMsg);
        return { success: false, message: errorMsg };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('food_mfg_token', data.token);
      localStorage.setItem('food_mfg_user', JSON.stringify(data.user));
      setActivePage('dashboard');
      return { success: true, user: data.user };
    } catch (err) {
      const msg = 'Network error connecting to backend API (Port 5000).';
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('food_mfg_token');
      localStorage.removeItem('food_mfg_user');
      setActivePage('dashboard');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        setAuthError,
        login,
        logout,
        activePage,
        setActivePage,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
