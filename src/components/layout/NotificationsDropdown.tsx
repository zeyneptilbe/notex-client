import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "../../hooks/useNotifications";
import { Avatar } from "../common/Avatar";
import { formatDate } from "../../utils/helpers";

const NOTIFICATION_ICONS: Record<number, string> = {
  0: "💬", // NewComment
  1: "↩️", // CommentReply
  2: "❤️", // PostLiked
  3: "👍", // CommentLiked
  4: "📢", // Mention
  5: "📝", // NewFollowerPost
  8: "⏳", // PostApprovalRequest
  9: "✅", // PostApproved
  10: "🚫", // PostRejected
};

export function NotificationsDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notificationsData } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notifications = notificationsData?.items || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  // Dışarı tıklayınca kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNavigationUrl = (notification: {
    type: number;
    actionUrl?: string;
    triggeredByUserId?: string;
  }): string | null => {
    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith("/users/")) {
        const userId = notification.actionUrl.replace("/users/", "");
        return `/profile/${userId}`;
      }
      return notification.actionUrl.startsWith("/")
        ? notification.actionUrl
        : `/${notification.actionUrl}`;
    }
    // Takipci bildirimi (type: 4) - profil sayfasina yonlendir
    if (notification.type === 4 && notification.triggeredByUserId) {
      return `/profile/${notification.triggeredByUserId}`;
    }
    return null;
  };

  const handleNotificationClick = (notification: {
    id: string;
    type: number;
    isRead: boolean;
    actionUrl?: string;
    triggeredByUserId?: string;
  }) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    const url = getNavigationUrl(notification);
    if (url) {
      navigate(url);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bildirim Butonu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          {/* Bildirim Listesi */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  {/* İkon veya Avatar */}
                  <div className="shrink-0">
                    {notification.triggeredByUserName ? (
                      <Avatar
                        name={notification.triggeredByUserName}
                        size="sm"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span>
                          {NOTIFICATION_ICONS[notification.type] || "🔔"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* İçerik */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>

                  {/* Okunmamış göstergesi */}
                  {!notification.isRead && (
                    <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <span className="text-3xl mb-2 block">🔔</span>
                <p className="text-gray-500">Henüz bildirim yok</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => {
                  navigate("/notifications");
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
              >
                Tüm Bildirimleri Gör
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
