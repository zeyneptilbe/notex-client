import { createContext } from "react";

// Tipler
export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: number;
  teamId: string;
  teamName: string;
  unitName: string;
  profileImageUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  isSuperAdmin: boolean;
  isTeamLead: boolean;
  isUnitManager: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
