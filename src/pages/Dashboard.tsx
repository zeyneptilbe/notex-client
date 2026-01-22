import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PostList } from "../components/posts";
import { Loading } from "../components/common";
import { usePosts, useLikePost, useFavoritePost } from "../hooks/usePosts";
import { useCategories } from "../hooks/useCategories";
import { usePopularTags } from "../hooks/useTags";

export default function Dashboard() {
  const navigate = useNavigate();
  const [sortBy] = useState("newest");

  // API'den veri çek
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
  } = usePosts();
  const { data: categories } = useCategories();
  const { data: popularTags } = usePopularTags(8);

  // Mutations
  const likeMutation = useLikePost();
  const favoriteMutation = useFavoritePost();

  const handleLike = (postId: string) => {
    likeMutation.mutate(postId);
  };

  const handleFavorite = (postId: string) => {
    favoriteMutation.mutate(postId);
  };

  const handlePostClick = (post: { id: string; slug?: string }) => {
    const identifier = post.slug || post.id;
    navigate(`/posts/${identifier}`);
  };

  // Hata durumu
  if (postsError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Bağlantı Hatası
          </h2>
          <p className="text-gray-600 mb-4">
            API'ye bağlanılamadı. Backend çalışıyor mu?
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Posts'u dönüştür
  const posts =
    postsData?.items?.map((post) => ({
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
    })) || [];

  return (
    <div className="flex gap-6">
      {/* Sol - Post Listesi */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">
              Son Paylaşımlar
            </h1>
            {postsData && (
              <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
                {postsData.totalCount} post
              </span>
            )}
          </div>

          <select
            value={sortBy}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">En Yeni</option>
            <option value="popular">En Popüler</option>
            <option value="liked">En Çok Beğenilen</option>
          </select>
        </div>

        {postsLoading ? (
          <div className="py-12">
            <Loading text="Postlar yükleniyor..." />
          </div>
        ) : (
          <PostList
            posts={posts}
            emptyMessage="Henüz hiç post paylaşılmamış. İlk postu sen paylaş!"
            onPostClick={(post) => handlePostClick(post)}
            onLike={handleLike}
            onFavorite={handleFavorite}
          />
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

        {/* Veriler yoksa placeholder */}
        {(!categories || categories.length === 0) &&
          (!popularTags || popularTags.length === 0) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <span className="text-3xl mb-2 block">📭</span>
              <p className="text-gray-500 text-sm">
                Henüz kategori ve etiket eklenmemiş.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
