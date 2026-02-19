import { useNavigate } from "react-router-dom";
import { Avatar } from "../common/Avatar";
import { formatDate, formatNumber } from "../../utils/helpers";

interface Post {
  id: string;
  title: string;
  summary?: string;
  authorId?: string;
  authorName: string;
  authorProfileImage?: string;
  teamName: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  tags: string[];
  isPinned: boolean;
  isLiked: boolean;
  isFavorited: boolean;
}

interface PostCardProps {
  post: Post;
  onClick?: () => void;
  onLike?: () => void;
  onFavorite?: () => void;
}

export function PostCard({ post, onClick, onLike, onFavorite }: PostCardProps) {
  const navigate = useNavigate();

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.authorId) {
      navigate(`/profile/${post.authorId}`);
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer min-w-0"
    >
      {/* Üst Kısım - Yazar ve Kategori */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80"
          onClick={handleAuthorClick}
        >
          <Avatar name={post.authorName} imageUrl={post.authorProfileImage} />
          <div>
            <p className="font-semibold text-gray-800 text-sm hover:text-blue-600 transition-colors">
              {post.authorName}
            </p>
            <p className="text-xs text-gray-500">
              {post.teamName} • {formatDate(post.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {post.isPinned && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
              📌 Sabit
            </span>
          )}
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
      </div>

      {/* Başlık */}
      <h2 className="text-lg font-bold text-gray-800 mb-2 hover:text-blue-600 transition-colors break-words">
        {post.title}
      </h2>

      {/* Özet */}
      {post.summary && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 break-words">
          {post.summary}
        </p>
      )}

      {/* Etiketler */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-gray-200"
            >
              #{tag}
            </span>
          ))}
          {post.tags.length > 4 && (
            <span className="text-xs text-gray-400">
              +{post.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Alt Kısım - İstatistikler */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike?.();
            }}
            className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
              post.isLiked ? "text-red-500" : ""
            }`}
          >
            <span>{post.isLiked ? "❤️" : "🤍"}</span>
            <span>{formatNumber(post.likeCount)}</span>
          </button>

          <span className="flex items-center gap-1">
            <span>💬</span>
            <span>{formatNumber(post.commentCount)}</span>
          </span>

          <span className="flex items-center gap-1">
            <span>👁️</span>
            <span>{formatNumber(post.viewCount)}</span>
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite?.();
          }}
          className={`text-lg hover:scale-110 transition-transform ${
            post.isFavorited ? "text-yellow-500" : "text-gray-300"
          }`}
        >
          {post.isFavorited ? "⭐" : "☆"}
        </button>
      </div>
    </div>
  );
}
