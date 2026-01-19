import { useState, useEffect } from "react";
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

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(config.tokenKey);
      if (token) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error("Auth init error:", error);
          authApi.logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data);

    localStorage.setItem(config.tokenKey, response.token);
    localStorage.setItem(config.refreshTokenKey, response.refreshToken);

    const currentUser = await authApi.getCurrentUser();
    setUser(currentUser);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    isSuperAdmin: user?.role === 3,
    isTeamLead: (user?.role ?? -1) >= 1,
    isUnitManager: (user?.role ?? -1) >= 2,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
