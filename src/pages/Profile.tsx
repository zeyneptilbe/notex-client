import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUsers";
import { Avatar } from "../components/common/Avatar";
import { Button } from "../components/common/Button";
import { Loading } from "../components/common/Loading";
import { PostList } from "../components/posts";
import { EditProfileModal } from "../components/modals";
import { formatDate } from "../utils/helpers";
import { postsApi } from "../api/posts.api";
import { usersApi } from "../api/users.api";
import type { Post } from "../api/posts.api";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "favorites">(
    "posts",
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userFavorites, setUserFavorites] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // Eğer id yoksa kendi profilini göster
  const profileId = id || currentUser?.id || "";
  const isOwnProfile = !id || id === currentUser?.id;

  // Kullanıcı verilerini çek
  const { data: profileUser, isLoading, refetch } = useUser(profileId);

  // Görüntülenecek kullanıcı (API'den veya current user)
  const user = profileUser || (isOwnProfile ? currentUser : null);

  // Takip durumunu ve takipçi sayısını güncelle
  useEffect(() => {
    if (profileUser) {
      setIsFollowing(profileUser.isFollowing || false);
      setFollowerCount(profileUser.followerCount || 0);
    }
  }, [profileUser]);

  // Kullanıcının postlarını çek
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!profileId) return;

      setIsLoadingPosts(true);
      try {
        const response = await postsApi.getAll({ authorId: profileId });
        setUserPosts(response.items || []);
      } catch (error) {
        console.error("Postlar yüklenirken hata:", error);
        setUserPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchUserPosts();
  }, [profileId]);

  // Favorileri çek (sadece kendi profilinde)
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isOwnProfile) {
        setUserFavorites([]);
        return;
      }

      setIsLoadingFavorites(true);
      try {
        const favorites = await postsApi.getFavorites();
        setUserFavorites(favorites || []);
      } catch (error) {
        console.error("Favoriler yüklenirken hata:", error);
        setUserFavorites([]);
      } finally {
        setIsLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, [isOwnProfile, activeTab]);

  const handleEditSuccess = async () => {
    await refetch();
    await refreshUser();
  };

  const handlePostClick = (post: { id: string; slug?: string }) => {
    const identifier = post.slug || post.id;
    navigate(`/posts/${identifier}`);
  };

  const handleLike = async (postId: string) => {
    try {
      await postsApi.like(postId);
      setUserPosts(
        userPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: !post.isLiked,
              likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
            };
          }
          return post;
        }),
      );
    } catch (error) {
      console.error("Beğeni hatası:", error);
    }
  };

  const handleFavorite = async (postId: string) => {
    try {
      await postsApi.favorite(postId);
      setUserPosts(
        userPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              isFavorited: !post.isFavorited,
            };
          }
          return post;
        }),
      );
    } catch (error) {
      console.error("Favori hatası:", error);
    }
  };

  // Takip Et / Takipten Çık
  const handleFollow = async () => {
    if (!profileId || isOwnProfile) return;

    setIsFollowLoading(true);
    try {
      const result = await usersApi.follow(profileId);
      setIsFollowing(result.isFollowing);
      setFollowerCount((prev) => (result.isFollowing ? prev + 1 : prev - 1));
    } catch (error) {
      console.error("Takip hatası:", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

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

  const roleName = user.roleName || "Kullanıcı";

  // User objesini düzenleme için hazırla
  const userForEdit = {
    firstName: user.firstName || user.fullName?.split(" ")[0] || "",
    lastName:
      user.lastName || user.fullName?.split(" ").slice(1).join(" ") || "",
    title: user.title || "",
    bio: user.bio || "",
  };

  // Toplam beğeni sayısını hesapla
  const totalLikes = userPosts.reduce((sum, post) => sum + post.likeCount, 0);

  return (
    <div>
      {/* Profil Kartı */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Cover Image */}
        <div className="h-40 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          {/* Avatar ve Temel Bilgiler */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 mb-6">
            <div className="ring-4 ring-white rounded-2xl bg-white">
              <Avatar name={user.fullName} size="lg" />
            </div>

            <div className="flex-1 pt-4 sm:pt-0 sm:pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-800 break-words">
                  {user.fullName}
                </h1>
                <span
                  className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 w-fit"
                >
                  {roleName}
                </span>
              </div>
              {user.title && (
                <p className="text-gray-700 font-medium break-words">{user.title}</p>
              )}
              <p className="text-gray-600">{user.email}</p>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <Button
                  variant="secondary"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  ✏️ Profili Düzenle
                </Button>
              ) : (
                <Button
                  variant={isFollowing ? "secondary" : "primary"}
                  onClick={handleFollow}
                  loading={isFollowLoading}
                >
                  {isFollowing ? "✓ Takip Ediliyor" : "➕ Takip Et"}
                </Button>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 break-words">{user.bio}</p>
            </div>
          )}

          {/* İstatistikler */}
          <div className="grid grid-cols-4 gap-4 py-4 border-y border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {userPosts.length}
              </p>
              <p className="text-sm text-gray-500">Post</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {followerCount}
              </p>
              <p className="text-sm text-gray-500">Takipçi</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {user.followingCount || 0}
              </p>
              <p className="text-sm text-gray-500">Takip</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{totalLikes}</p>
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
            {user.createdAt && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>📅</span>
                <span>Katılım: {formatDate(user.createdAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* İçerik: Sol Postlar/Favoriler + Sağ Hakkında */}
      <div className="flex gap-6">
        {/* Sol - Postlar / Favoriler */}
        <div className="flex-1">
          {/* Tab Headers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab("posts")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "posts"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                📝 Postlar ({userPosts.length})
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab("favorites")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "favorites"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  ⭐ Favoriler ({userFavorites.length})
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "posts" && (
                <div>
                  {isLoadingPosts ? (
                    <Loading text="Postlar yükleniyor..." />
                  ) : userPosts.length > 0 ? (
                    <PostList
                      posts={userPosts.map((post) => ({
                        id: post.id,
                        slug: post.slug,
                        title: post.title,
                        summary: post.summary,
                        authorName: post.authorName,
                        authorProfileImage: post.authorProfileImage,
                        teamName: post.teamName,
                        createdAt: post.createdAt,
                        likeCount: post.likeCount,
                        commentCount: post.commentCount,
                        viewCount: post.viewCount,
                        categoryName: post.categoryName,
                        categoryColor: post.categoryColor,
                        categoryIcon: post.categoryIcon,
                        tags: post.tags || [],
                        isPinned: post.isPinned,
                        isLiked: post.isLiked,
                        isFavorited: post.isFavorited,
                      }))}
                      onPostClick={handlePostClick}
                      onLike={handleLike}
                      onFavorite={handleFavorite}
                      emptyMessage="Henüz post paylaşılmamış."
                    />
                  ) : (
                    <div className="text-center py-8">
                      <span className="text-4xl mb-2 block">📝</span>
                      <p className="text-gray-500">Henüz post paylaşılmamış.</p>
                      {isOwnProfile && (
                        <Button
                          className="mt-4"
                          onClick={() => navigate("/posts/new")}
                        >
                          İlk Postunu Paylaş
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "favorites" && isOwnProfile && (
                <div>
                  {isLoadingFavorites ? (
                    <Loading text="Favoriler yükleniyor..." />
                  ) : userFavorites.length > 0 ? (
                    <PostList
                      posts={userFavorites.map((post) => ({
                        id: post.id,
                        slug: post.slug,
                        title: post.title,
                        summary: post.summary,
                        authorName: post.authorName,
                        authorProfileImage: post.authorProfileImage,
                        teamName: post.teamName,
                        createdAt: post.createdAt,
                        likeCount: post.likeCount,
                        commentCount: post.commentCount,
                        viewCount: post.viewCount,
                        categoryName: post.categoryName,
                        categoryColor: post.categoryColor,
                        categoryIcon: post.categoryIcon,
                        tags: post.tags || [],
                        isPinned: post.isPinned,
                        isLiked: post.isLiked,
                        isFavorited: true,
                      }))}
                      onPostClick={handlePostClick}
                      onLike={handleLike}
                      onFavorite={handleFavorite}
                      emptyMessage="Henüz favori post yok."
                    />
                  ) : (
                    <div className="text-center py-8">
                      <span className="text-4xl mb-2 block">⭐</span>
                      <p className="text-gray-500">Henüz favori post yok.</p>
                      <Button className="mt-4" onClick={() => navigate("/")}>
                        Postları Keşfet
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sağ - Hakkında Sidebar */}
        <div className="hidden lg:block w-80 space-y-6 sticky top-[84px] self-start">
          {/* Hakkında */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              ℹ️ Hakkında
            </h3>
            <div className="space-y-4">
              {user.bio && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Bio</h4>
                  <p className="text-sm text-gray-700 break-words">{user.bio}</p>
                </div>
              )}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Ünvan</h4>
                <p className="text-sm text-gray-700 break-words">{user.title || "Belirtilmemiş"}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Ekip</h4>
                <p className="text-sm text-gray-700">{user.teamName}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Birim</h4>
                <p className="text-sm text-gray-700">{user.unitName}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">İletişim</h4>
                <p className="text-sm text-gray-700">{user.email}</p>
              </div>
              {user.createdAt && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Katılım Tarihi</h4>
                  <p className="text-sm text-gray-700">{formatDate(user.createdAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Rol Bilgisi */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              🛡️ Rol
            </h3>
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {roleName}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={userForEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
