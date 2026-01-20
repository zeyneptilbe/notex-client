import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Avatar } from "../components/common/Avatar";
import { Button } from "../components/common/Button";
import { Loading } from "../components/common/Loading";
import { formatDate } from "../utils/helpers";

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorProfileImage?: string;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
  replies?: Comment[];
}

// Örnek post verisi (sonra API'den gelecek)
const mockPost = {
  id: "1",
  title: "Clean Architecture ile .NET Core Projesi Nasıl Kurulur?",
  slug: "clean-architecture-ile-net-core-projesi",
  content: `
## Giriş

Clean Architecture, yazılım projelerinde bağımlılıkları yönetmek ve kodun test edilebilirliğini artırmak için kullanılan bir mimari yaklaşımdır.

## Katmanlar

### 1. Domain Layer
Domain katmanı, iş kurallarını ve entity'leri içerir.

### 2. Application Layer
Application katmanı, use case'leri ve iş mantığını içerir.

### 3. Infrastructure Layer
Veritabanı, dosya sistemi gibi dış servislerin implementasyonları bu katmanda yer alır.

### 4. Presentation Layer
API controller'ları ve UI bileşenleri bu katmanda bulunur.

## Sonuç

Clean Architecture kullanarak projelerinizi daha modüler ve test edilebilir hale getirebilirsiniz.
  `,
  summary:
    "Bu rehberde Clean Architecture prensiplerini kullanarak sıfırdan bir .NET Core projesi oluşturmayı öğreneceksiniz.",
  authorId: "1",
  authorName: "Ahmet Yılmaz",
  authorTitle: "Senior Backend Developer",
  teamName: "Backend Ekibi",
  unitName: "Yazılım Geliştirme",
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  viewCount: 234,
  likeCount: 42,
  commentCount: 5,
  categoryName: "Rehber",
  categoryColor: "#10B981",
  categoryIcon: "📚",
  tags: ["C#", ".NET Core", "Clean Architecture", "Backend"],
  isPinned: true,
  isLiked: false,
  isFavorited: true,
};

const mockComments: Comment[] = [
  {
    id: "1",
    content:
      "Harika bir yazı olmuş! Clean Architecture konusunda çok faydalı bilgiler var.",
    authorName: "Elif Demir",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    likeCount: 5,
    isLiked: false,
    replies: [
      {
        id: "1-1",
        content: "Teşekkürler Elif! 🙏",
        authorName: "Ahmet Yılmaz",
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        likeCount: 2,
        isLiked: true,
      },
    ],
  },
];

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(mockPost);
  const [comments, setComments] = useState(mockComments);
  const [newComment, setNewComment] = useState("");
  const [isLoading] = useState(false);

  console.log("Loading post with slug:", slug);

  const handleLike = () => {
    setPost({
      ...post,
      isLiked: !post.isLiked,
      likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
    });
  };

  const handleFavorite = () => {
    setPost({
      ...post,
      isFavorited: !post.isFavorited,
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      authorName: user?.fullName || "Anonim",
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isLiked: false,
    };

    setComments([comment, ...comments]);
    setNewComment("");
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return <Loading fullScreen text="Post yükleniyor..." />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Geri Butonu */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <span>←</span>
        <span>Geri Dön</span>
      </button>

      {/* Post İçeriği */}
      <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          {/* Kategori ve Etiketler */}
          <div className="flex items-center gap-2 mb-4">
            {post.isPinned && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                📌 Sabitlenmiş
              </span>
            )}
            {post.categoryName && (
              <span
                className="px-2 py-1 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: `${post.categoryColor}20`,
                  color: post.categoryColor,
                }}
              >
                {post.categoryIcon} {post.categoryName}
              </span>
            )}
          </div>

          {/* Başlık */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            {post.title}
          </h1>

          {/* Yazar Bilgisi */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={post.authorName} size="lg" />
              <div>
                <p className="font-semibold text-gray-800">{post.authorName}</p>
                <p className="text-sm text-gray-500">
                  {post.authorTitle} • {post.teamName}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(post.createdAt)}
                </p>
              </div>
            </div>

            {/* Aksiyonlar */}
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

              <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                🔗
              </button>
            </div>
          </div>
        </div>

        {/* İçerik */}
        <div className="p-6">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Post Content */}
          <div className="prose prose-gray max-w-none">
            {post.content.split("\n").map((line, index) => {
              if (line.startsWith("## ")) {
                return (
                  <h2
                    key={index}
                    className="text-xl font-bold text-gray-800 mt-6 mb-3"
                  >
                    {line.replace("## ", "")}
                  </h2>
                );
              }
              if (line.startsWith("### ")) {
                return (
                  <h3
                    key={index}
                    className="text-lg font-semibold text-gray-800 mt-4 mb-2"
                  >
                    {line.replace("### ", "")}
                  </h3>
                );
              }
              if (line.trim()) {
                return (
                  <p key={index} className="text-gray-600 mb-3 leading-relaxed">
                    {line}
                  </p>
                );
              }
              return null;
            })}
          </div>

          {/* İstatistikler */}
          <div className="flex items-center gap-6 mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500">
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
      <section className="mt-6">
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
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Yorum Yap
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Yorum Listesi */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
            >
              <div className="flex gap-3">
                <Avatar name={comment.authorName} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800 text-sm">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <button className="flex items-center gap-1 hover:text-red-500">
                      <span>{comment.isLiked ? "❤️" : "🤍"}</span>
                      <span>{comment.likeCount}</span>
                    </button>
                    <button className="hover:text-blue-500">Yanıtla</button>
                  </div>

                  {/* Yanıtlar */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar name={reply.authorName} size="sm" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-800 text-sm">
                                {reply.authorName}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm">
                              {reply.content}
                            </p>
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
      </section>
    </div>
  );
}
