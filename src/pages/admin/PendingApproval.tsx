import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Loading } from "../../components/common/Loading";
import { Avatar } from "../../components/common/Avatar";
import { postsApi, type Post, type PostRevision } from "../../api/posts.api";
import { RevisionCompare } from "../../components/posts/RevisionCompare";
import { isForbiddenError } from "../../api/axios";
import { showToast } from "../../components/common/Toast";
import { formatDate } from "../../utils/helpers";

export default function PendingApproval() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingPost, setRejectingPost] = useState<Post | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [comparePost, setComparePost] = useState<Post | null>(null);
  const [compareRevisions, setCompareRevisions] = useState<PostRevision[]>([]);
  const [loadingRevisionId, setLoadingRevisionId] = useState<string | null>(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const data = await postsApi.getPendingApproval({ pageSize: 50 });
      setPosts(data.items);
      setTotalCount(data.totalCount);
    } catch (error) {
      if (!isForbiddenError(error)) {
        console.error("Onay bekleyen postlar yüklenemedi:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleApprove = async (post: Post) => {
    setApprovingId(post.id);
    try {
      await postsApi.approve(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      setTotalCount((prev) => prev - 1);
      showToast(`"${post.title}" onaylandı ve yayınlandı.`, "success");
    } catch (error) {
      if (!isForbiddenError(error)) {
        console.error("Onay hatası:", error);
      }
    } finally {
      setApprovingId(null);
    }
  };

  const openRejectModal = (post: Post) => {
    setRejectingPost(post);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectingPost || !rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      await postsApi.reject(rejectingPost.id, rejectReason);
      setPosts((prev) => prev.filter((p) => p.id !== rejectingPost.id));
      setTotalCount((prev) => prev - 1);
      showToast(`"${rejectingPost.title}" reddedildi.`, "info");
      setShowRejectModal(false);
      setRejectingPost(null);
      setRejectReason("");
    } catch (error) {
      if (!isForbiddenError(error)) {
        console.error("Reddetme hatası:", error);
      }
    } finally {
      setIsRejecting(false);
    }
  };

  const handleShowRevisions = async (post: Post) => {
    setLoadingRevisionId(post.id);
    try {
      // Liste endpoint'i attachments/content dönmeyebilir, tam post'u çek
      const [fullPost, revisions] = await Promise.all([
        postsApi.getBySlug(post.slug),
        postsApi.getRevisions(post.id),
      ]);
      if (revisions.length > 0) {
        setComparePost(fullPost);
        setCompareRevisions(revisions);
      } else {
        showToast("Bu postun önceki versiyonu yok.", "info");
      }
    } catch {
      showToast("Revizyonlar yüklenirken hata oluştu.", "error");
    } finally {
      setLoadingRevisionId(null);
    }
  };

  if (isLoading) {
    return <Loading text="Onay bekleyen postlar yükleniyor..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Onay Bekleyenler</h1>
          <p className="text-gray-500 text-sm mt-1">
            Yayınlanmak için onay bekleyen postlar
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
          {totalCount} post
        </span>
      </div>

      {/* Post Listesi */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Yazar Bilgisi */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      name={post.authorName}
                      imageUrl={post.authorProfileImage}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {post.authorName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {post.teamName} - {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Başlık */}
                  <h2
                    className="text-lg font-bold text-gray-800 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => navigate(`/posts/${post.slug}`)}
                  >
                    {post.title}
                  </h2>

                  {/* Özet */}
                  {post.summary && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {post.summary}
                    </p>
                  )}

                  {/* Kategori ve Etiketler */}
                  <div className="flex flex-wrap items-center gap-2">
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
                    {post.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleShowRevisions(post)}
                    disabled={loadingRevisionId === post.id}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 whitespace-nowrap"
                  >
                    {loadingRevisionId === post.id ? "Yükleniyor..." : "Değişiklikleri Gör"}
                  </button>
                  <Button
                    variant="primary"
                    onClick={() => handleApprove(post)}
                    loading={approvingId === post.id}
                    disabled={approvingId !== null}
                  >
                    ✓ Onayla
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => openRejectModal(post)}
                    disabled={approvingId !== null}
                  >
                    ✕ Reddet
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <span className="text-5xl mb-4 block">✅</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Onay Bekleyen Post Yok
          </h2>
          <p className="text-gray-600">
            Tüm postlar onaylanmış durumda.
          </p>
        </div>
      )}

      {/* Reddet Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectingPost(null);
          setRejectReason("");
        }}
        title="Postu Reddet"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            <strong>{rejectingPost?.title}</strong> postunu reddetmek istediğinize emin misiniz?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Red Sebebi (Zorunlu)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Red sebebini yazın..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {rejectReason.length}/500
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowRejectModal(false);
                setRejectingPost(null);
                setRejectReason("");
              }}
            >
              İptal
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={isRejecting}
              disabled={!rejectReason.trim()}
            >
              Reddet
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revizyon Karşılaştırma Modal */}
      {comparePost && compareRevisions.length > 0 && (
        <RevisionCompare
          currentPost={comparePost}
          revisions={compareRevisions}
          onClose={() => {
            setComparePost(null);
            setCompareRevisions([]);
          }}
        />
      )}
    </div>
  );
}
