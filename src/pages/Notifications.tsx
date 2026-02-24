import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "../hooks/useNotifications";
import { Avatar } from "../components/common/Avatar";
import { Button } from "../components/common/Button";
import { Loading } from "../components/common/Loading";
import { Pagination } from "../components/common/Pagination";
import { formatDate } from "../utils/helpers";

// Backend'den gelen bildirim türleri
const NOTIFICATION_ICONS: Record<number, string> = {
  0: "💬", // NewComment
  1: "↩️", // CommentReply
  2: "❤️", // PostLike
  3: "👍", // CommentLike
  4: "👤", // NewFollower (Backend'de type: 4)
  5: "📝", // NewPost
  6: "📢", // Mention
};

const NOTIFICATION_TYPE_LABELS: Record<number, string> = {
  0: "Yeni Yorum",
  1: "Yorum Yanıtı",
  2: "Post Beğenisi",
  3: "Yorum Beğenisi",
  4: "Yeni Takipçi",
  5: "Yeni Post",
  6: "Bahsetme",
};

interface Notification {
  id: string;
  type: number;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  triggeredByUserId?: string;
  triggeredByUserName?: string;
  relatedPostId?: string;
  relatedPostSlug?: string;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data: notificationsData, isLoading } = useNotifications({ pageNumber: page, pageSize: 15 });
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notifications: Notification[] = notificationsData?.items || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  const getNavigationUrl = (notification: Notification): string | null => {
    console.log("Notification:", notification);
    console.log("ActionUrl:", notification.actionUrl);
    // actionUrl varsa ve /users/ içeriyorsa, /profile/ olarak değiştir
    if (notification.actionUrl) {
      // /users/xxx -> /profile/xxx dönüşümü
      if (notification.actionUrl.startsWith("/users/")) {
        const userId = notification.actionUrl.replace("/users/", "");
        return `/profile/${userId}`;
      }

      // /posts/ ile başlıyorsa olduğu gibi kullan
      if (notification.actionUrl.startsWith("/posts/")) {
        return notification.actionUrl;
      }

      // Diğer durumlar
      return notification.actionUrl.startsWith("/")
        ? notification.actionUrl
        : `/${notification.actionUrl}`;
    }

    // actionUrl yoksa, bildirim türüne göre yönlendir
    // Takipçi bildirimi (type: 4) için
    if (notification.type === 4 && notification.triggeredByUserId) {
      return `/profile/${notification.triggeredByUserId}`;
    }

    // Post ile ilgili bildirimler
    if (notification.relatedPostId) {
      return `/posts/${notification.relatedPostId}`;
    }

    return null;
  };

  const handleNotificationClick = (notification: Notification) => {
    // Okunmamışsa okundu işaretle
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Yönlendirme URL'ini al
    const url = getNavigationUrl(notification);

    if (url) {
      navigate(url);
    }
  };

  if (isLoading) {
    return <Loading text="Bildirimler yükleniyor..." />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bildirimler</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0
              ? `${unreadCount} okunmamış bildirim`
              : "Tüm bildirimler okundu"}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            onClick={() => markAllAsReadMutation.mutate()}
            loading={markAllAsReadMutation.isPending}
          >
            Tümünü Okundu İşaretle
          </Button>
        )}
      </div>

      {/* Bildirim Listesi */}
      {notifications.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                index !== notifications.length - 1
                  ? "border-b border-gray-100"
                  : ""
              } ${!notification.isRead ? "bg-blue-50 hover:bg-blue-100" : ""}`}
            >
              {/* İkon veya Avatar */}
              <div className="shrink-0">
                {notification.triggeredByUserName ? (
                  <Avatar name={notification.triggeredByUserName} size="md" />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">
                      {NOTIFICATION_ICONS[notification.type] || "🔔"}
                    </span>
                  </div>
                )}
              </div>

              {/* İçerik */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {NOTIFICATION_TYPE_LABELS[notification.type] || "Bildirim"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
                <p className="font-medium text-gray-800">
                  {notification.title}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {notification.message}
                </p>
              </div>

              {/* Okunmamış göstergesi */}
              {!notification.isRead && (
                <div className="shrink-0 w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <span className="text-5xl mb-4 block">🔔</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Henüz Bildirim Yok
          </h2>
          <p className="text-gray-600">
            Yeni bildirimler geldiğinde burada görünecek.
          </p>
        </div>
      )}

      <Pagination currentPage={page} totalPages={notificationsData?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  );
}
