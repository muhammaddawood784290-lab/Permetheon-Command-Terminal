// =====================================================================
// AuthContext — exposes the current authenticated user to the rest of
// the application. Components consume authentication state through
// `useAuth()`, never through direct localStorage access.
// =====================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Re-hydrate from storage on mount in case another tab updated it.
  useEffect(() => {
    const stored = authService.getStoredUser();
    if (stored && !user) setUser(stored);
  }, [user]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(credentials);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.message || 'Login failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      error,
      login,
      logout,
      setUser,
    }),
    [user, loading, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}

export default AuthContext;
