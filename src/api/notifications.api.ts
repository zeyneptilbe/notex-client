import api from "./axios";
import { config } from "../config";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: number;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  triggeredByUserName?: string;
}

interface NotificationListResponse {
  items: Notification[];
  unreadCount: number;
  pageNumber: number;
  totalPages: number;
  totalCount: number;
}

export const notificationsApi = {
  getAll: async (isRead?: boolean): Promise<NotificationListResponse> => {
    const response = await api.get<NotificationListResponse>(
      config.endpoints.notifications,
      {
        params: { isRead },
      },
    );
    return response.data;
  },

  getUnread: async (): Promise<NotificationListResponse> => {
    const response = await api.get<NotificationListResponse>(
      `${config.endpoints.notifications}/unread`,
    );
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put(`${config.endpoints.notifications}/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put(`${config.endpoints.notifications}/read-all`);
  },
};
