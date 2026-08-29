import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('taskflow_token')) { setLoading(false); return; }
    api('/auth/me').then(({ user }) => setUser(user)).catch(() => localStorage.removeItem('taskflow_token')).finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('taskflow_token', result.token);
    setUser(result.user);
  }

  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* local logout still succeeds */ }
    localStorage.removeItem('taskflow_token');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
