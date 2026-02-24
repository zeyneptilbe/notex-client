import { PostCard } from "./PostCard";
import { Loading } from "../common/Loading";

interface Post {
  id: string;
  title: string;
  summary?: string;
  authorName: string;
  authorProfileImage?: string;
  teamName?: string | null;
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

interface PostListProps {
  posts: Post[];
  loading?: boolean;
  emptyMessage?: string;
  onPostClick?: (post: Post) => void;
  onLike?: (postId: string) => void;
  onFavorite?: (postId: string) => void;
}

export function PostList({
  posts,
  loading = false,
  emptyMessage = "Henüz post yok.",
  onPostClick,
  onLike,
  onFavorite,
}: PostListProps) {
  if (loading) {
    return (
      <div className="py-12">
        <Loading text="Postlar yükleniyor..." />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <span className="text-4xl mb-4 block">📭</span>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onClick={() => onPostClick?.(post)}
          onLike={() => onLike?.(post.id)}
          onFavorite={() => onFavorite?.(post.id)}
        />
      ))}
    </div>
  );
}
