import axios from "axios";
import { config } from "../config";

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor - Token ekle
api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem(config.tokenKey);
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Hata yönetimi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem(config.refreshTokenKey);
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${config.apiUrl}${config.endpoints.auth.refreshToken}`,
            { refreshToken }
          );

          const { token, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem(config.tokenKey, token);
          localStorage.setItem(config.refreshTokenKey, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem(config.tokenKey);
          localStorage.removeItem(config.refreshTokenKey);
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
