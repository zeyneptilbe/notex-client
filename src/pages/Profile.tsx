import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUsers";
import { Avatar } from "../components/common/Avatar";
import { Button } from "../components/common/Button";
import { Loading } from "../components/common/Loading";
import { PostList } from "../components/posts";
import { formatDate } from "../utils/helpers";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "favorites" | "about">(
    "posts",
  );

  // Eğer id yoksa kendi profilini göster
  const profileId = id || currentUser?.id || "";
  const isOwnProfile = !id || id === currentUser?.id;

  // Kullanıcı verilerini çek
  const { data: profileUser, isLoading } = useUser(profileId);

  // Görüntülenecek kullanıcı (API'den veya current user)
  const user = profileUser || (isOwnProfile ? currentUser : null);

  // Örnek postlar (sonra API'den gelecek)
  const userPosts = [
    {
      id: "1",
      title: "Clean Architecture ile .NET Core Projesi",
      summary: "Bu yazıda Clean Architecture prensiplerini öğreneceksiniz...",
      authorName: user?.fullName || "",
      teamName: user?.teamName || "",
      createdAt: "2025-01-18T10:00:00.000Z",
      likeCount: 42,
      commentCount: 12,
      viewCount: 234,
      categoryName: "Rehber",
      categoryColor: "#10B981",
      categoryIcon: "📚",
      tags: ["C#", ".NET Core"],
      isPinned: false,
      isLiked: false,
      isFavorited: false,
    },
  ];

  if (isLoading) {
    return <Loading text="Profil yükleniyor..." />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl mb-4 block">😕</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Kullanıcı Bulunamadı
        </h2>
        <p className="text-gray-600 mb-4">
          Bu kullanıcı mevcut değil veya silinmiş.
        </p>
        <Button onClick={() => navigate("/")}>Ana Sayfaya Dön</Button>
      </div>
    );
  }

  const getRoleBadge = (role: number) => {
    const roles: Record<number, { label: string; color: string }> = {
      0: { label: "Çalışan", color: "bg-gray-100 text-gray-700" },
      1: { label: "Takım Lideri", color: "bg-blue-100 text-blue-700" },
      2: { label: "Birim Yöneticisi", color: "bg-purple-100 text-purple-700" },
      3: { label: "Sistem Yöneticisi", color: "bg-red-100 text-red-700" },
    };
    return roles[role] || roles[0];
  };

  const roleBadge = getRoleBadge(user.role);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profil Kartı */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Cover Image */}
        <div className="h-40 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          {/* Avatar ve Temel Bilgiler */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 mb-6">
            <div className="ring-4 ring-white rounded-2xl bg-white">
              <Avatar name={user.fullName} size="lg" />
            </div>

            <div className="flex-1 pt-4 sm:pt-0 sm:pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-800">
                  {user.fullName}
                </h1>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${roleBadge.color} w-fit`}
                >
                  {roleBadge.label}
                </span>
              </div>
              <p className="text-gray-600">{user.email}</p>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <Button variant="secondary">✏️ Profili Düzenle</Button>
              ) : (
                <>
                  <Button variant="primary">➕ Takip Et</Button>
                  <Button variant="secondary">✉️ Mesaj</Button>
                </>
              )}
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-4 gap-4 py-4 border-y border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {userPosts.length}
              </p>
              <p className="text-sm text-gray-500">Post</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">0</p>
              <p className="text-sm text-gray-500">Takipçi</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">0</p>
              <p className="text-sm text-gray-500">Takip</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">0</p>
              <p className="text-sm text-gray-500">Beğeni</p>
            </div>
          </div>

          {/* Ekip ve Birim */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <span>👥</span>
              <span>{user.teamName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span>🏢</span>
              <span>{user.unitName}</span>
            </div>
            {currentUser && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>📅</span>
                <span>Katılım: {formatDate(new Date().toISOString())}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "posts"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            📝 Postlar
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "favorites"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            ❤️ Favoriler
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "about"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            ℹ️ Hakkında
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "posts" && (
            <div>
              {userPosts.length > 0 ? (
                <PostList
                  posts={userPosts}
                  onPostClick={(post) => navigate(`/posts/${post.id}`)}
                  emptyMessage="Henüz post paylaşılmamış."
                />
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block">📭</span>
                  <p className="text-gray-500">Henüz post paylaşılmamış.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="text-center py-8">
              <span className="text-4xl mb-2 block">❤️</span>
              <p className="text-gray-500">Favori postlar burada görünecek.</p>
            </div>
          )}

          {activeTab === "about" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Bio</h3>
                <p className="text-gray-600">Henüz bio eklenmemiş.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Uzmanlık Alanları
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    Henüz eklenmemiş
                  </span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">İletişim</h3>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
