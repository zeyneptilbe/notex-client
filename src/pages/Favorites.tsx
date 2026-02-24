import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PostList } from "../components/posts";
import { Loading, Pagination } from "../components/common";
import { Button } from "../components/common/Button";
import { Avatar } from "../components/common/Avatar";
import { postsApi } from "../api/posts.api";
import { usePopularTags } from "../hooks/useTags";
import { useTopAuthors } from "../hooks/useUsers";

export default function Favorites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { data: popularTags } = usePopularTags(8);
  const { data: topAuthors } = useTopAuthors(5);
  const { data: trendingData } = useQuery({
    queryKey: ["posts", "trending"],
    queryFn: () => postsApi.getAll({ sortBy: "Popular", pageSize: 5 }),
  });

  const { data: favoritesData, isLoading, error } = useQuery({
    queryKey: ["favorites", page],
    queryFn: () => postsApi.getFavorites({ pageNumber: page, pageSize: 10 }),
  });

  const handlePostClick = (post: { id: string; slug?: string }) => {
    const identifier = post.slug || post.id;
    navigate(`/posts/${identifier}`);
  };

  const handleLike = async (postId: string) => {
    try {
      await postsApi.like(postId);
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    } catch (err) {
      console.error("Beğeni hatası:", err);
    }
  };

  const handleFavorite = async (postId: string) => {
    try {
      await postsApi.favorite(postId);
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
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
        <p className="text-gray-600 mb-4">Favoriler yüklenirken bir hata oluştu.</p>
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
              {favoritesData?.totalCount ?? 0} post
            </span>
          </div>
        </div>

        {/* Favori Listesi */}
        {favoritesData?.items && favoritesData.items.length > 0 ? (
          <>
            <PostList
              posts={favoritesData.items.map((post) => ({
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
            <Pagination
              currentPage={page}
              totalPages={favoritesData?.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
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
                    <p className="text-xs text-gray-400">{author.teamName || author.unitName}</p>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                    {author.postCount} post
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* En Çok Okunan Postlar */}
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
