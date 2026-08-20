import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authService, setCsrfToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const { data } = await authService.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
    const onExpired = () => setUser(null);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [loadSession]);

  const login = async (email, password) => {
    const { data } = await authService.login(email, password);
    setCsrfToken(data.csrfToken);
    setUser(data.user);
  };

  const register = async (email, password) => {
    const { data } = await authService.register(email, password);
    setCsrfToken(data.csrfToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setCsrfToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
