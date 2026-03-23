import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

const TOKEN_KEY = 'leadsher_token';
const USER_KEY  = 'leadsher_user';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  });
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);

  const saveSession = useCallback((token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setToken(token);
    setUser(user);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    authApi.getProfile()
      .then((res) => {
        const u = res.data?.user || res.data;
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
      .catch(clearSession)
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const { token, user } = res.data;
    saveSession(token, user);
    return user;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    const payload = res.data;
    if (payload.token) saveSession(payload.token, payload.user);
    return payload;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearSession();
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem(USER_KEY, JSON.stringify(merged));
  };

  const isAuthenticated = Boolean(token);
  const isAdmin   = user?.role === 'admin';
  const isMentor  = user?.role === 'mentor';
  const canManageEvents = isAdmin || isMentor;

  return (
    <AuthContext.Provider value={{
      user, token, loading, isAuthenticated, isAdmin, isMentor, canManageEvents,
      login, register, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
