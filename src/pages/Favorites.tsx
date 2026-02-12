import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PostList } from "../components/posts";
import { Loading } from "../components/common";
import { Button } from "../components/common/Button";
import { postsApi } from "../api/posts.api";
import type { Post } from "../api/posts.api";
import { useCategories } from "../hooks/useCategories";
import { usePopularTags } from "../hooks/useTags";

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: categories } = useCategories();
  const { data: popularTags } = usePopularTags(8);

  useEffect(() => {
    const fetchFavorites = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await postsApi.getFavorites();
        setFavorites(data);
      } catch (err) {
        console.error("Favoriler yükleme hatası:", err);
        setError("Favoriler yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handlePostClick = (post: { id: string; slug?: string }) => {
    const identifier = post.slug || post.id;
    navigate(`/posts/${identifier}`);
  };

  const handleLike = async (postId: string) => {
    try {
      await postsApi.like(postId);
      setFavorites(
        favorites.map((post) => {
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
    } catch (err) {
      console.error("Beğeni hatası:", err);
    }
  };

  const handleFavorite = async (postId: string) => {
    try {
      await postsApi.favorite(postId);
      // Favoriden çıkarıldıysa listeden kaldır
      setFavorites(favorites.filter((post) => post.id !== postId));
    } catch (err) {
      console.error("Favori hatası:", err);
    }
  };

  // Yükleniyor
  if (isLoading) {
    return <Loading text="Favoriler yükleniyor..." />;
  }

  // Hata
  if (error) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl mb-4 block">😕</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Hata</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Tekrar Dene</Button>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Sol - Favori Listesi */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Favorilerim</h1>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
              {favorites.length} post
            </span>
          </div>
        </div>

        {/* Favori Listesi */}
        {favorites.length > 0 ? (
          <PostList
            posts={favorites.map((post) => ({
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
              isFavorited: true, // Favoriler sayfasında hepsi favori
            }))}
            emptyMessage=""
            onPostClick={handlePostClick}
            onLike={handleLike}
            onFavorite={handleFavorite}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <span className="text-5xl mb-4 block">⭐</span>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Henüz Favori Yok
            </h2>
            <p className="text-gray-600 mb-6">
              Beğendiğiniz postları favorilere ekleyerek daha sonra kolayca
              erişebilirsiniz.
            </p>
            <Button onClick={() => navigate("/")}>Postları Keşfet</Button>
          </div>
        )}
      </div>

      {/* Sağ - Sidebar */}
      <div className="hidden lg:block w-80 space-y-6">
        {/* Kategoriler */}
        {categories && categories.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              📁 Kategoriler
            </h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {cat.postCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popüler Etiketler */}
        {popularTags && popularTags.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              🔥 Popüler Etiketler
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                >
                  #{tag.name}
                  <span className="ml-1 text-gray-400 text-xs">
                    {tag.usageCount}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
