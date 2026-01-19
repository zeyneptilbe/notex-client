export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/",
  POSTS: "/posts",
  POST_DETAIL: "/posts/:slug",
  PROFILE: "/profile/:id",
  FAVORITES: "/favorites",
  ADMIN: {
    USERS: "/admin/users",
    CATEGORIES: "/admin/categories",
    TEAMS: "/admin/teams",
  },
} as const;

export const POST_STATUS_LABELS = {
  0: "Taslak",
  1: "Yayında",
  2: "Arşivlendi",
} as const;

export const USER_ROLE_LABELS = {
  0: "Çalışan",
  1: "Takım Lideri",
  2: "Birim Yöneticisi",
  3: "Sistem Yöneticisi",
} as const;
