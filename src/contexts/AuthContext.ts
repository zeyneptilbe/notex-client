import { createContext } from "react";

// Tipler
export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  teamId: string;
  teamName: string;
  unitName: string;
  profileImageUrl?: string;
  title?: string;
  bio?: string;
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
  createdAt?: string;
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
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
