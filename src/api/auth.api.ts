import type { LoginRequest, LoginResponse, CurrentUser } from "../types";
import api from "./axios";
import { config } from "../config";

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(
      config.endpoints.auth.login,
      data
    );
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(
      config.endpoints.auth.refreshToken,
      { refreshToken }
    );
    return response.data;
  },

  getCurrentUser: async (): Promise<CurrentUser> => {
    const response = await api.get<CurrentUser>(config.endpoints.auth.me);
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem(config.tokenKey);
    localStorage.removeItem(config.refreshTokenKey);
  },
};
