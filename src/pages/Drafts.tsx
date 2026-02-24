import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Loading, Pagination } from "../components/common";
import { Button } from "../components/common/Button";
import { Avatar } from "../components/common/Avatar";
import { postsApi } from "../api/posts.api";
import { useAuth } from "../hooks/useAuth";
import { usePopularTags } from "../hooks/useTags";
import { useTopAuthors } from "../hooks/useUsers";

export default function Drafts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data: popularTags } = usePopularTags(8);
  const { data: topAuthors } = useTopAuthors(5);
  const { data: trendingData } = useQuery({
    queryKey: ["posts", "trending"],
    queryFn: () => postsApi.getAll({ sortBy: "Popular", pageSize: 5 }),
  });

  // Onay bekleyen postlar (status=3)
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["pendingPosts", user?.id],
    queryFn: () =>
      postsApi.getAll({
        authorId: user?.id,
        status: 3,
        pageSize: 50,
      }),
    enabled: !!user?.id,
  });

  // Taslaklar (status=0)
  const { data, isLoading, error } = useQuery({
    queryKey: ["drafts", user?.id, page],
    queryFn: () =>
      postsApi.getAll({
        authorId: user?.id,
        status: 0,
        pageNumber: page,
        pageSize: 20,
      }),
    enabled: !!user?.id,
  });

  const handlePostClick = (post: { id: string; slug?: string }) => {
    const identifier = post.slug || post.id;
    navigate(`/posts/${identifier}`);
  };

  const handleEdit = (post: { slug?: string }) => {
    if (post.slug) {
      navigate(`/posts/${post.slug}/edit`);
    }
  };

  const handlePublish = (post: { slug?: string }) => {
    if (post.slug) {
      navigate(`/posts/${post.slug}/edit?publish=true`);
    }
  };

  if (isLoading || pendingLoading) {
    return <Loading text="Yükleniyor..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl mb-4 block">⚠️</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Bir Hata Oluştu
        </h2>
        <p className="text-gray-600 mb-4">
          Taslaklar yüklenirken bir hata oluştu.
        </p>
        <Button onClick={() => window.location.reload()}>Tekrar Dene</Button>
      </div>
    );
  }

  const pendingPosts = pendingData?.items || [];
  const drafts = data?.items || [];

  return (
    <div className="flex gap-6">
      {/* Sol - İçerik */}
      <div className="flex-1 space-y-8">
        {/* Onay Bekleyen Postlarım */}
        {pendingPosts.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Onay Bekleyen Postlarım</h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                {pendingPosts.length}
              </span>
            </div>

            <div className="space-y-4">
              {pendingPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl shadow-sm border border-orange-100 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                          ⏳ Onay Bekliyor
                        </span>
                        {post.categoryName && (
                          <span
                            className="px-2 py-1 text-xs rounded-full"
                            style={{
                              backgroundColor: post.categoryColor
                                ? `${post.categoryColor}20`
                                : "#f3f4f6",
                              color: post.categoryColor || "#6b7280",
                            }}
                          >
                            {post.categoryIcon} {post.categoryName}
                          </span>
                        )}
                      </div>

                      <h2
                        className="text-lg font-bold text-gray-800 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => handlePostClick(post)}
                      >
                        {post.title}
                      </h2>

                      {post.summary && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {post.summary}
                        </p>
                      )}

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-gray-400">
                        Gönderilme:{" "}
                        {new Date(post.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Taslaklarım */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-800">Taslaklarım</h2>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
              {drafts.length} taslak
            </span>
          </div>

          {drafts.length > 0 ? (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                          📝 Taslak
                        </span>
                        {draft.categoryName && (
                          <span
                            className="px-2 py-1 text-xs rounded-full"
                            style={{
                              backgroundColor: draft.categoryColor
                                ? `${draft.categoryColor}20`
                                : "#f3f4f6",
                              color: draft.categoryColor || "#6b7280",
                            }}
                          >
                            {draft.categoryIcon} {draft.categoryName}
                          </span>
                        )}
                      </div>

                      <h2
                        className="text-lg font-bold text-gray-800 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => handlePostClick(draft)}
                      >
                        {draft.title || "Başlıksız Taslak"}
                      </h2>

                      {draft.summary && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {draft.summary}
                        </p>
                      )}

                      {draft.tags && draft.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {draft.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-gray-400">
                        Son düzenleme:{" "}
                        {new Date(draft.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="secondary" onClick={() => handleEdit(draft)}>
                        ✏️ Düzenle
                      </Button>
                      <Button variant="primary" onClick={() => handlePublish(draft)}>
                        🚀 Yayınla
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <span className="text-5xl mb-4 block">📝</span>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Taslak Yok</h2>
              <p className="text-gray-600 mb-4">
                Henüz kaydedilmiş taslağınız bulunmuyor.
              </p>
              <Button onClick={() => navigate("/posts/new")}>
                İlk Postunu Oluştur
              </Button>
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Sağ - Sidebar */}
      <div className="hidden lg:block w-80 space-y-5 sticky top-[84px] self-start">
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
                    <p className="text-xs text-gray-400">
                      {author.teamName || author.unitName}
                    </p>
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
