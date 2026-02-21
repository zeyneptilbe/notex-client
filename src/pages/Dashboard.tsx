import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PostList } from "../components/posts";
import { Loading } from "../components/common";
import { Avatar } from "../components/common/Avatar";
import { postsApi } from "../api/posts.api";
import { usePosts, useLikePost, useFavoritePost } from "../hooks/usePosts";
import { usePopularTags } from "../hooks/useTags";
import { useTopAuthors } from "../hooks/useUsers";
import { useCategories } from "../hooks/useCategories";

type FeedTab = "all" | "following";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState<FeedTab>("all");

  const categoryId = searchParams.get("category") || undefined;
  const tagSlug = searchParams.get("tag") || undefined;
  const { data: categories } = useCategories();
  const selectedCategory = categoryId
    ? categories?.find((c) => c.id === categoryId)
    : undefined;

  // API'den veri çek
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
  } = usePosts({
    categoryId,
    tagSlug,
    followingOnly: activeTab === "following" ? true : undefined,
    sortBy: sortBy === "newest" ? "Latest" : sortBy === "popular" ? "Popular" : "MostLiked",
  });
  const { data: popularTags } = usePopularTags(8);
  const { data: topAuthors } = useTopAuthors(5);
  const { data: trendingData } = useQuery({
    queryKey: ["posts", "trending"],
    queryFn: () => postsApi.getAll({ sortBy: "Popular", pageSize: 5 }),
  });

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
      authorId: post.authorId,
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
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "all"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Keşfet
              </button>
              <button
                onClick={() => setActiveTab("following")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "following"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Takip Ettiklerim
              </button>
            </div>
            {selectedCategory && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                {selectedCategory.icon} {selectedCategory.name}
                <button
                  onClick={() => {
                    searchParams.delete("category");
                    setSearchParams(searchParams);
                  }}
                  className="ml-0.5 text-indigo-400 hover:text-indigo-700"
                >
                  ✕
                </button>
              </span>
            )}
            {tagSlug && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                #{tagSlug}
                <button
                  onClick={() => {
                    searchParams.delete("tag");
                    setSearchParams(searchParams);
                  }}
                  className="ml-0.5 text-blue-400 hover:text-blue-700"
                >
                  ✕
                </button>
              </span>
            )}
            {postsData && (
              <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
                {postsData.totalCount} post
              </span>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
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
            emptyMessage={
              activeTab === "following"
                ? "Takip ettiğiniz kişilerin henüz paylaşımı yok. Keşfet sekmesinden yeni kişileri takip edebilirsiniz!"
                : "Henüz hiç post paylaşılmamış. İlk postu sen paylaş!"
            }
            onPostClick={(post) => handlePostClick(post)}
            onLike={handleLike}
            onFavorite={handleFavorite}
          />
        )}
      </div>

      {/* Sağ - Sidebar */}
      <div className="hidden lg:block w-80 space-y-5 sticky top-21 self-start">
        {/* Popüler Yazarlar */}
        {topAuthors && topAuthors.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
              ✍️ Popüler Yazarlar
            </h3>
            <div className="space-y-2.5">
              {topAuthors.slice(0, 4).map((author) => (
                <div
                  key={author.id}
                  onClick={() => navigate(`/profile/${author.id}`)}
                  className="flex items-center gap-2.5 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Avatar
                    name={author.fullName}
                    imageUrl={author.profileImageUrl}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {author.fullName}
                    </p>
                    <p className="text-xs text-gray-400">{author.teamName}</p>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                    {author.postCount} post
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* En Çok Okunanlar */}
        {trendingData?.items && trendingData.items.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
              📈 En Çok Okunan Postlar
            </h3>
            <div className="space-y-2.5">
              {trendingData.items.slice(0, 5).map((post, idx) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/posts/${post.slug || post.id}`)}
                  className="flex gap-2.5 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <span className="text-base font-bold text-gray-300 shrink-0 w-5 text-center">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span>{post.authorName}</span>
                      <span>·</span>
                      <span>👁️ {post.viewCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popüler Etiketler */}
        {popularTags && popularTags.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
              🔥 Popüler Etiketler
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
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
