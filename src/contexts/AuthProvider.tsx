import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthContextType, CurrentUser, LoginRequest } from "./AuthContext";
import { authApi } from "../api/auth.api";
import { config } from "../config";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Auth error:", error);
      authApi.logout();
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(config.tokenKey);
      if (token) {
        await fetchCurrentUser();
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data);
    localStorage.setItem(config.tokenKey, response.token);
    if (response.refreshToken) {
      localStorage.setItem(config.refreshTokenKey, response.refreshToken);
    }
    await fetchCurrentUser();
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return user?.permissions?.includes(permission) ?? false;
    },
    [user],
  );

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
    isSuperAdmin: user?.permissions?.includes("admin.access") ?? false,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
