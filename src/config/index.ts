// Environment variables
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || "https://localhost:7088/api",
  appName: import.meta.env.VITE_APP_NAME || "NoteX",

  // Token storage keys
  tokenKey: "notex_token",
  refreshTokenKey: "notex_refresh_token",

  // API endpoints
  endpoints: {
    auth: {
      login: "/auth/login",
      refreshToken: "/auth/refresh-token",
      me: "/auth/me",
    },
    users: "/users",
    posts: "/posts",
    categories: "/categories",
    tags: "/tags",
    units: "/units",
    teams: "/teams",
    notifications: "/notifications",
    interactions: "/interactions",
  },
} as const;
