import type { UserRole } from "./user.types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  teamId: string;
  teamName: string;
  unitName: string;
  profileImageUrl?: string;
}

export interface AuthState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
