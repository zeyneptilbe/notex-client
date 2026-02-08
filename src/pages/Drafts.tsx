import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Loading } from "../components/common";
import { Button } from "../components/common/Button";
import { postsApi } from "../api/posts.api";
import { useAuth } from "../hooks/useAuth";

export default function Drafts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page] = useState(1);

  // Sadece kendi taslaklarını çek (status=0)
  const { data, isLoading, error } = useQuery({
    queryKey: ["drafts", user?.id, page],
    queryFn: () =>
      postsApi.getAll({
        authorId: user?.id,
        status: 0, // Taslak
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

  if (isLoading) {
    return <Loading text="Taslaklar yükleniyor..." />;
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

  const drafts = data?.items || [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Taslaklarım</h1>
          <p className="text-gray-500 text-sm mt-1">
            Henüz yayınlanmamış postlarınız
          </p>
        </div>
        <Button onClick={() => navigate("/posts/new")}>+ Yeni Post</Button>
      </div>

      {/* Taslak Listesi */}
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

                  {/* Etiketler */}
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

                {/* Aksiyon Butonları */}
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="secondary" onClick={() => handleEdit(draft)}>
                    ✏️ Düzenle
                  </Button>
                  <Button variant="primary" onClick={() => handleEdit(draft)}>
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
    </div>
  );
}
