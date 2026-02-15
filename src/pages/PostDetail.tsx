import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Avatar } from "../components/common/Avatar";
import { Button } from "../components/common/Button";
import { Loading } from "../components/common/Loading";
import { MarkdownViewer } from "../components/common";
import { formatDate } from "../utils/helpers";
import { postsApi, type Post, type PostRevision } from "../api/posts.api";
import { RevisionCompare } from "../components/posts/RevisionCompare";
import {
  commentsApi,
  commentAttachmentsApi,
  type Comment,
  type CommentAttachment,
} from "../api/comments.api";
import { Modal } from "../components/common/Modal";
import { AttachmentList } from "../components/posts/AttachmentList";
import { usePopularTags } from "../hooks/useTags";
import { isForbiddenError } from "../api/axios";
import { showToast } from "../components/common/Toast";

const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
  ".txt", ".csv", ".zip", ".rar", ".7z",
]);

const MAX_COMMENT_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx !== -1 ? fileName.slice(idx).toLowerCase() : "";
}

function validateCommentFiles(
  files: File[],
): { valid: File[]; errors: string[] } {
  const valid: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const ext = getFileExtension(file.name);
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      errors.push(
        `"${file.name}" — desteklenmeyen dosya türü (${ext || "uzantı yok"})`,
      );
      continue;
    }
    if (file.size > MAX_COMMENT_FILE_SIZE) {
      errors.push(
        `"${file.name}" — dosya boyutu 50MB limitini aşıyor`,
      );
      continue;
    }
    valid.push(file);
  }

  return { valid, errors };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(contentType: string): string {
  if (contentType.startsWith("image/")) return "🖼️";
  if (contentType === "application/pdf") return "📕";
  if (contentType.includes("spreadsheet") || contentType.includes("excel") || contentType === "text/csv") return "📊";
  if (contentType.includes("document") || contentType.includes("word") || contentType.includes("msword")) return "📝";
  if (contentType.includes("presentation") || contentType.includes("powerpoint")) return "📙";
  if (contentType.includes("zip") || contentType.includes("compressed")) return "📦";
  if (contentType.startsWith("video/")) return "🎬";
  if (contentType.startsWith("audio/")) return "🎵";
  return "📄";
}

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [revisions, setRevisions] = useState<PostRevision[]>([]);
  const [isLoadingRevisions, setIsLoadingRevisions] = useState(false);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const { data: popularTags } = usePopularTags(8);
  const [authorPosts, setAuthorPosts] = useState<Post[]>([]);

  // Post verisini API'den çek
  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await postsApi.getBySlug(slug);
        setPost(data);

        // Yorumları da çek
        try {
          const commentsData = await commentsApi.getByPostId(data.id);
          setComments(commentsData || []);
        } catch {
          setComments([]);
        }

        // Yazarin diger postlari
        try {
          const authorRes = await postsApi.getAll({ authorId: data.authorId, pageSize: 5 });
          setAuthorPosts(
            authorRes.items.filter((p) => p.id !== data.id).slice(0, 3),
          );
        } catch {
          // sessizce gec
        }
      } catch (err) {
        console.error("Post yükleme hatası:", err);
        setError("Post bulunamadı veya bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    const perm = isOwner ? "posts.update" : "posts.updateOthers";
    if (!hasPermission(perm)) {
      showToast("Bu işlem için yetkiniz bulunmuyor.", "warning");
      return;
    }
    navigate(`/posts/${post?.slug}/edit`);
  };

  const handleDelete = async () => {
    if (!post) return;

    const perm = isOwner ? "posts.delete" : "posts.deleteOthers";
    if (!hasPermission(perm)) {
      showToast("Bu işlem için yetkiniz bulunmuyor.", "warning");
      return;
    }

    const confirmed = window.confirm(
      "Bu postu silmek istediğinize emin misiniz?",
    );
    if (!confirmed) return;

    try {
      await postsApi.delete(post.id);
      navigate("/");
    } catch (err) {
      if (!isForbiddenError(err)) {
        console.error("Post silme hatası:", err);
        alert("Post silinirken bir hata oluştu.");
      }
    }
  };

  const handleLike = async () => {
    if (!post) return;

    try {
      await postsApi.like(post.id);
      setPost({
        ...post,
        isLiked: !post.isLiked,
        likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
      });
    } catch (err) {
      console.error("Beğeni hatası:", err);
    }
  };

  const handleFavorite = async () => {
    if (!post) return;

    try {
      await postsApi.favorite(post.id);
      setPost({
        ...post,
        isFavorited: !post.isFavorited,
      });
    } catch (err) {
      console.error("Favori hatası:", err);
    }
  };

  // Yorum ekle
  const handleAddComment = async () => {
    if (!newComment.trim() || !post) return;

    setIsSubmittingComment(true);

    try {
      const newCommentData = await commentsApi.create({
        postId: post.id,
        content: newComment,
      });

      // Dosya varsa yükle (ayrı try/catch — yorum zaten oluştu)
      const uploadedAttachments: CommentAttachment[] = [];
      if (commentFiles.length > 0) {
        const results = await Promise.allSettled(
          commentFiles.map((file) =>
            commentAttachmentsApi.upload(newCommentData.id, file),
          ),
        );
        const failed: string[] = [];
        results.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            uploadedAttachments.push(result.value);
          } else {
            failed.push(commentFiles[idx].name);
          }
        });
        if (failed.length > 0) {
          showToast(
            `Bazı dosyalar yüklenemedi: ${failed.join(", ")}`,
            "error",
          );
        }
      }

      setComments([
        {
          ...newCommentData,
          attachments: [
            ...(newCommentData.attachments || []),
            ...uploadedAttachments,
          ],
        },
        ...comments,
      ]);
      setNewComment("");
      setCommentFiles([]);

      setPost({
        ...post,
        commentCount: post.commentCount + 1,
      });
    } catch (err) {
      if (!isForbiddenError(err)) {
        console.error("Yorum ekleme hatası:", err);
        alert("Yorum eklenirken bir hata oluştu.");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Yoruma yanıt ekle
  const handleAddReply = async (parentId: string) => {
    if (!replyContent.trim() || !post) return;

    setIsSubmittingComment(true);

    try {
      const newReply = await commentsApi.create({
        postId: post.id,
        content: replyContent,
        parentCommentId: parentId,
      });

      // Dosya varsa yükle (ayrı try/catch — yanıt zaten oluştu)
      const uploadedAttachments: CommentAttachment[] = [];
      if (replyFiles.length > 0) {
        const results = await Promise.allSettled(
          replyFiles.map((file) =>
            commentAttachmentsApi.upload(newReply.id, file),
          ),
        );
        const failed: string[] = [];
        results.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            uploadedAttachments.push(result.value);
          } else {
            failed.push(replyFiles[idx].name);
          }
        });
        if (failed.length > 0) {
          showToast(
            `Bazı dosyalar yüklenemedi: ${failed.join(", ")}`,
            "error",
          );
        }
      }

      const replyWithAttachments = {
        ...newReply,
        attachments: [
          ...(newReply.attachments || []),
          ...uploadedAttachments,
        ],
      };

      setComments(
        comments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), replyWithAttachments],
            };
          }
          return comment;
        }),
      );

      setReplyingTo(null);
      setReplyContent("");
      setReplyFiles([]);

      setPost({
        ...post,
        commentCount: post.commentCount + 1,
      });
    } catch (err) {
      if (!isForbiddenError(err)) {
        console.error("Yanıt ekleme hatası:", err);
        alert("Yanıt eklenirken bir hata oluştu.");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Yorum sil
  const handleDeleteComment = async (commentId: string, parentId?: string) => {
    if (!hasPermission("comments.delete") && !hasPermission("comments.deleteOthers")) {
      showToast("Bu işlem için yetkiniz bulunmuyor.", "warning");
      return;
    }

    const confirmed = window.confirm(
      "Bu yorumu silmek istediğinize emin misiniz?",
    );
    if (!confirmed) return;

    try {
      await commentsApi.delete(commentId);

      if (parentId) {
        setComments(
          comments.map((comment) => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies:
                  comment.replies?.filter((r) => r.id !== commentId) || [],
              };
            }
            return comment;
          }),
        );
      } else {
        setComments(comments.filter((c) => c.id !== commentId));
      }

      if (post) {
        setPost({
          ...post,
          commentCount: post.commentCount - 1,
        });
      }
    } catch (err) {
      if (!isForbiddenError(err)) {
        console.error("Yorum silme hatası:", err);
        alert("Yorum silinirken bir hata oluştu.");
      }
    }
  };

  // Yorum beğen
  const handleLikeComment = async (commentId: string, parentId?: string) => {
    try {
      await commentsApi.like(commentId);

      if (parentId) {
        setComments(
          comments.map((comment) => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies:
                  comment.replies?.map((reply) => {
                    if (reply.id === commentId) {
                      return {
                        ...reply,
                        isLiked: !reply.isLiked,
                        likeCount: reply.isLiked
                          ? reply.likeCount - 1
                          : reply.likeCount + 1,
                      };
                    }
                    return reply;
                  }) || [],
              };
            }
            return comment;
          }),
        );
      } else {
        setComments(
          comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: !comment.isLiked,
                likeCount: comment.isLiked
                  ? comment.likeCount - 1
                  : comment.likeCount + 1,
              };
            }
            return comment;
          }),
        );
      }
    } catch (err) {
      console.error("Yorum beğeni hatası:", err);
    }
  };

  // Yorum eki sil
  const handleDeleteAttachment = async (
    attachmentId: string,
    commentId: string,
  ) => {
    setDeletingAttachment(attachmentId);
    try {
      await commentAttachmentsApi.delete(attachmentId);

      const removeAttachment = (c: Comment): Comment => {
        if (c.id === commentId) {
          return {
            ...c,
            attachments: c.attachments?.filter((a) => a.id !== attachmentId),
          };
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(removeAttachment),
          };
        }
        return c;
      };

      setComments(comments.map(removeAttachment));
    } catch (err) {
      console.error("Ek silme hatası:", err);
      showToast("Dosya silinirken bir hata oluştu.", "error");
    } finally {
      setDeletingAttachment(null);
    }
  };

  // Post onayla
  const handleApprove = async () => {
    if (!post) return;
    setIsApproving(true);
    try {
      const updated = await postsApi.approve(post.id);
      setPost(updated);
      showToast("Post onaylandı ve yayınlandı.", "success");
    } catch (err) {
      if (!isForbiddenError(err)) {
        console.error("Onay hatası:", err);
      }
    } finally {
      setIsApproving(false);
    }
  };

  // Post reddet
  const handleReject = async () => {
    if (!post || !rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      const updated = await postsApi.reject(post.id, rejectReason);
      setPost(updated);
      setShowRejectModal(false);
      setRejectReason("");
      showToast("Post reddedildi.", "info");
    } catch (err) {
      if (!isForbiddenError(err)) {
        console.error("Reddetme hatası:", err);
      }
    } finally {
      setIsRejecting(false);
    }
  };

  // Revizyonları getir
  const handleShowRevisions = async () => {
    if (!post) return;
    setIsLoadingRevisions(true);
    try {
      const data = await postsApi.getRevisions(post.id);
      if (data.length > 0) {
        setRevisions(data);
        setShowCompareModal(true);
      } else {
        showToast("Bu postun önceki versiyonu yok.", "info");
      }
    } catch {
      showToast("Revizyonlar yüklenirken hata oluştu.", "error");
    } finally {
      setIsLoadingRevisions(false);
    }
  };

  // Yazar profiline git
  const handleAuthorClick = () => {
    if (post?.authorId) {
      navigate(`/profile/${post.authorId}`);
    }
  };

  // Kullanıcı post sahibi mi?
  const isOwner = user?.id === post?.authorId;

  // Yükleniyor
  if (isLoading) {
    return <Loading text="Post yükleniyor..." />;
  }

  // Hata
  if (error || !post) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">😕</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Post Bulunamadı
        </h2>
        <p className="text-gray-600 mb-4">
          {error || "Bu post mevcut değil veya silinmiş."}
        </p>
        <Button onClick={() => navigate("/")}>Ana Sayfaya Dön</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Geri Butonu */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <span>←</span>
        <span>Geri Dön</span>
      </button>

      {/* Onay Bekliyor Banner */}
      {post.status === 3 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⏳</span>
              <div>
                <h3 className="font-semibold text-amber-800">
                  {isOwner ? "Postunuz onay bekliyor" : "Bu post onay bekliyor"}
                </h3>
                <p className="text-sm text-amber-600">
                  Takım lideri onayından sonra yayınlanacaktır.
                </p>
              </div>
            </div>
            {hasPermission("posts.approve") && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={handleShowRevisions}
                  loading={isLoadingRevisions}
                >
                  Değişiklikleri Gör
                </Button>
                <Button
                  variant="primary"
                  onClick={handleApprove}
                  loading={isApproving}
                >
                  ✓ Onayla
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowRejectModal(true)}
                >
                  ✕ Reddet
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reddedildi Banner */}
      {post.status === 4 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-xl">🚫</span>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">
                {isOwner ? "Postunuz reddedildi" : "Bu post reddedildi"}
              </h3>
              {post.rejectionReason && (
                <p className="text-sm text-red-700 mt-1">
                  <span className="font-medium">Sebep:</span> {post.rejectionReason}
                </p>
              )}
              {post.reviewedByName && (
                <p className="text-xs text-red-500 mt-1">
                  Reddeden: {post.reviewedByName}
                  {post.reviewedAt ? ` - ${formatDate(post.reviewedAt)}` : ""}
                </p>
              )}
              {isOwner && (
                <Button
                  className="mt-3"
                  variant="secondary"
                  onClick={() => navigate(`/posts/${post.slug}/edit?publish=true`)}
                >
                  ✏️ Düzenle ve Tekrar Gönder
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onaylandı Bilgisi */}
      {post.status === 1 && post.reviewedByUserId && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <span>✅</span>
            <span>
              Onaylayan: {post.reviewedByName}
              {post.reviewedAt
                ? ` - ${new Date(post.reviewedAt).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-6">
      {/* Sol - Post İçeriği */}
      <div className="flex-1 min-w-0">
      {/* Post Kartı */}
      <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-8 border-b border-gray-100">
          <h1 className="text-3xl font-bold text-gray-800 mb-5">
            {post.title}
          </h1>

          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80"
              onClick={handleAuthorClick}
            >
              <Avatar
                name={post.authorName}
                imageUrl={post.authorProfileImage}
                size="md"
              />
              <div>
                <p className="font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                  {post.authorName}
                </p>
                <p className="text-sm text-gray-500">
                  {post.authorTitle || post.teamName} • {post.teamName}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(post.createdAt)}
                </p>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  post.isLiked
                    ? "bg-red-50 text-red-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{post.isLiked ? "❤️" : "🤍"}</span>
                <span className="text-sm font-medium">{post.likeCount}</span>
              </button>

              <button
                onClick={handleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  post.isFavorited
                    ? "bg-yellow-50 text-yellow-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {post.isFavorited ? "⭐" : "☆"}
              </button>

              {((isOwner && hasPermission("posts.update")) || hasPermission("posts.updateOthers")) && (
                <button
                  onClick={handleEdit}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Düzenle"
                >
                  ✏️
                </button>
              )}
              {((isOwner && hasPermission("posts.delete")) || hasPermission("posts.deleteOthers")) && (
                <button
                  onClick={handleDelete}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  title="Sil"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        </div>

        {/* İçerik */}
        <div className="px-8 py-8">
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Özet */}
          {post.summary && (
            <div className="mb-8 p-5 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-gray-700 italic text-base leading-relaxed">{post.summary}</p>
            </div>
          )}

          {/* Post Content - Markdown Render */}
          <div className="prose prose-lg prose-gray max-w-none">
            <MarkdownViewer content={post.content || ""} />
          </div>

          {/* Ekli Dosyalar */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-100">
              <AttachmentList attachments={post.attachments} />
            </div>
          )}

          {/* İstatistikler */}
          <div className="flex items-center gap-6 mt-10 pt-6 border-t border-gray-100 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span>👁️</span>
              <span>{post.viewCount} görüntülenme</span>
            </span>
            <span className="flex items-center gap-1">
              <span>❤️</span>
              <span>{post.likeCount} beğeni</span>
            </span>
            <span className="flex items-center gap-1">
              <span>💬</span>
              <span>{post.commentCount} yorum</span>
            </span>
          </div>
        </div>
      </article>

      {/* Yorumlar */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Yorumlar ({comments.length})
        </h2>

        {/* Yorum Yazma */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex gap-3">
            <Avatar name={user?.fullName || "User"} size="md" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Yorumunuzu yazın..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                disabled={isSubmittingComment}
              />
              {/* Seçili dosyalar */}
              {commentFiles.length > 0 && (
                <div className="mt-2 p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg space-y-1.5">
                  <span className="text-xs font-medium text-blue-600">
                    {commentFiles.length} dosya seçildi
                  </span>
                  {commentFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1.5 bg-white rounded-md border border-blue-100 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0">
                          {getFileIcon(file.type || "application/octet-stream")}
                        </span>
                        <span className="truncate text-gray-700">{file.name}</span>
                        <span className="shrink-0 text-gray-400">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCommentFiles(commentFiles.filter((_, i) => i !== idx))
                        }
                        className="shrink-0 ml-2 p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <div>
                  <input
                    ref={commentFileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept={Array.from(ALLOWED_EXTENSIONS).join(",")}
                    onChange={(e) => {
                      if (e.target.files) {
                        const { valid, errors } = validateCommentFiles(
                          Array.from(e.target.files),
                        );
                        if (errors.length > 0) {
                          showToast(errors.join("\n"), "warning");
                        }
                        if (valid.length > 0) {
                          setCommentFiles([...commentFiles, ...valid]);
                        }
                      }
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => commentFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                    title="Dosya ekle"
                  >
                    <span>📎</span>
                    <span className="text-xs">Dosya Ekle</span>
                  </button>
                </div>
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  loading={isSubmittingComment}
                >
                  Yorum Yap
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Yorum Listesi */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex gap-3">
                  <Avatar name={comment.authorName} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-sm">
                          {comment.authorName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>

                      {((user?.id === comment.authorId && hasPermission("comments.delete")) || hasPermission("comments.deleteOthers")) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Sil
                        </button>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-2">
                      {comment.content}
                    </p>

                    {/* Yorum ekleri */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mb-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs font-medium text-gray-500 mb-1.5 block">
                          📎 Ekli Dosyalar ({comment.attachments.length})
                        </span>
                        <div className="space-y-1">
                          {comment.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center justify-between px-2.5 py-1.5 bg-white rounded-md border border-gray-100 hover:border-gray-200 transition-colors text-xs group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="shrink-0 text-base">
                                  {getFileIcon(att.contentType)}
                                </span>
                                <span className="truncate text-gray-700 font-medium">
                                  {att.originalFileName}
                                </span>
                                <span className="shrink-0 text-gray-400">
                                  {formatFileSize(att.fileSize)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={() => commentAttachmentsApi.download(att.id)}
                                  className="px-2 py-0.5 text-blue-600 hover:bg-blue-50 rounded font-medium transition-colors"
                                >
                                  İndir
                                </button>
                                {user?.id === comment.authorId && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteAttachment(att.id, comment.id)
                                    }
                                    disabled={deletingAttachment === att.id}
                                    className="px-2 py-0.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors disabled:opacity-50"
                                  >
                                    {deletingAttachment === att.id ? "..." : "Sil"}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        className={`flex items-center gap-1 hover:text-red-500 ${
                          comment.isLiked ? "text-red-500" : ""
                        }`}
                      >
                        <span>{comment.isLiked ? "❤️" : "🤍"}</span>
                        <span>{comment.likeCount}</span>
                      </button>
                      <button
                        onClick={() =>
                          setReplyingTo(
                            replyingTo === comment.id ? null : comment.id,
                          )
                        }
                        className="hover:text-blue-500"
                      >
                        Yanıtla
                      </button>
                    </div>

                    {/* Yanıt Formu */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 pl-4 border-l-2 border-blue-200">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Yanıtınızı yazın..."
                          className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                          rows={2}
                          disabled={isSubmittingComment}
                        />
                        {/* Seçili dosyalar */}
                        {replyFiles.length > 0 && (
                          <div className="mt-2 p-2 bg-blue-50/60 border border-blue-100 rounded-lg space-y-1">
                            <span className="text-xs font-medium text-blue-600">
                              {replyFiles.length} dosya seçildi
                            </span>
                            {replyFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between px-2 py-1 bg-white rounded-md border border-blue-100 text-xs"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="shrink-0">
                                    {getFileIcon(file.type || "application/octet-stream")}
                                  </span>
                                  <span className="truncate text-gray-700">{file.name}</span>
                                  <span className="shrink-0 text-gray-400">
                                    {formatFileSize(file.size)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReplyFiles(
                                      replyFiles.filter((_, i) => i !== idx),
                                    )
                                  }
                                  className="shrink-0 ml-2 p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          <div>
                            <input
                              ref={replyFileInputRef}
                              type="file"
                              className="hidden"
                              multiple
                              accept={Array.from(ALLOWED_EXTENSIONS).join(",")}
                              onChange={(e) => {
                                if (e.target.files) {
                                  const { valid, errors } = validateCommentFiles(
                                    Array.from(e.target.files),
                                  );
                                  if (errors.length > 0) {
                                    showToast(errors.join("\n"), "warning");
                                  }
                                  if (valid.length > 0) {
                                    setReplyFiles([...replyFiles, ...valid]);
                                  }
                                }
                                e.target.value = "";
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => replyFileInputRef.current?.click()}
                              className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs"
                              title="Dosya ekle"
                            >
                              <span>📎</span>
                              <span>Dosya Ekle</span>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent("");
                                setReplyFiles([]);
                              }}
                            >
                              İptal
                            </Button>
                            <Button
                              onClick={() => handleAddReply(comment.id)}
                              disabled={
                                !replyContent.trim() || isSubmittingComment
                              }
                              loading={isSubmittingComment}
                            >
                              Yanıtla
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Yanıtlar */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar name={reply.authorName} size="sm" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-800 text-sm">
                                    {reply.authorName}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>

                                {((user?.id === reply.authorId && hasPermission("comments.delete")) || hasPermission("comments.deleteOthers")) && (
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(reply.id, comment.id)
                                    }
                                    className="text-xs text-red-500 hover:text-red-700"
                                  >
                                    Sil
                                  </button>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm">
                                {reply.content}
                              </p>
                              {/* Yanıt ekleri */}
                              {reply.attachments && reply.attachments.length > 0 && (
                                <div className="mt-1.5 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                  <span className="text-xs font-medium text-gray-500 mb-1 block">
                                    📎 Ekli Dosyalar ({reply.attachments.length})
                                  </span>
                                  <div className="space-y-1">
                                    {reply.attachments.map((att) => (
                                      <div
                                        key={att.id}
                                        className="flex items-center justify-between px-2 py-1 bg-white rounded-md border border-gray-100 hover:border-gray-200 transition-colors text-xs"
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="shrink-0 text-base">
                                            {getFileIcon(att.contentType)}
                                          </span>
                                          <span className="truncate text-gray-700 font-medium">
                                            {att.originalFileName}
                                          </span>
                                          <span className="shrink-0 text-gray-400">
                                            {formatFileSize(att.fileSize)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              commentAttachmentsApi.download(att.id)
                                            }
                                            className="px-2 py-0.5 text-blue-600 hover:bg-blue-50 rounded font-medium transition-colors"
                                          >
                                            İndir
                                          </button>
                                          {user?.id === reply.authorId && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleDeleteAttachment(
                                                  att.id,
                                                  reply.id,
                                                )
                                              }
                                              disabled={deletingAttachment === att.id}
                                              className="px-2 py-0.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors disabled:opacity-50"
                                            >
                                              {deletingAttachment === att.id
                                                ? "..."
                                                : "Sil"}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <button
                                onClick={() =>
                                  handleLikeComment(reply.id, comment.id)
                                }
                                className={`flex items-center gap-1 text-xs mt-1 hover:text-red-500 ${
                                  reply.isLiked
                                    ? "text-red-500"
                                    : "text-gray-500"
                                }`}
                              >
                                <span>{reply.isLiked ? "❤️" : "🤍"}</span>
                                <span>{reply.likeCount}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <span className="text-3xl mb-2 block">💬</span>
            <p className="text-gray-500">
              Henüz yorum yok. İlk yorumu sen yap!
            </p>
          </div>
        )}
      </section>
      </div>

      {/* Sag - Sidebar */}
      <div className="hidden lg:block w-80 shrink-0 space-y-6">
        {/* Post Bilgileri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            📋 Post Bilgileri
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Kategori</span>
              <span className="font-medium text-gray-700">
                {post.categoryIcon} {post.categoryName || "Belirtilmemiş"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Ekip</span>
              <span className="font-medium text-gray-700">{post.teamName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Görüntülenme</span>
              <span className="font-medium text-gray-700">{post.viewCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Beğeni</span>
              <span className="font-medium text-gray-700">{post.likeCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Yorum</span>
              <span className="font-medium text-gray-700">{post.commentCount}</span>
            </div>
          </div>
        </div>

        {/* Aynı Yazardan */}
        {authorPosts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              ✍️ {post.authorName} - Diger Yazilari
            </h3>
            <div className="space-y-3">
              {authorPosts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/posts/${p.slug}`)}
                  className="p-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">
                    {p.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{formatDate(p.createdAt)}</span>
                    <span>❤️ {p.likeCount}</span>
                  </div>
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

      {/* Reddet Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason("");
        }}
        title="Postu Reddet"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            <strong>{post.title}</strong> postunu reddetmek istediğinize emin misiniz?
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
      {showCompareModal && revisions.length > 0 && post && (
        <RevisionCompare
          currentPost={post}
          revisions={revisions}
          onClose={() => {
            setShowCompareModal(false);
            setRevisions([]);
          }}
        />
      )}
    </div>
  );
}
