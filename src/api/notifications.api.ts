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
  triggeredByUserId?: string;
  triggeredByUserName?: string;
}

interface NotificationListResponse {
  items: Notification[];
  unreadCount: number;
  pageNumber: number;
  totalPages: number;
  totalCount: number;
}

interface GetNotificationsParams {
  isRead?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export const notificationsApi = {
  getAll: async (params?: GetNotificationsParams): Promise<NotificationListResponse> => {
    const response = await api.get<NotificationListResponse>(
      config.endpoints.notifications,
      { params },
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
