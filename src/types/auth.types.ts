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
  firstName?: string;
  lastName?: string;
  fullName: string;
  role: number;
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

export interface AuthState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
