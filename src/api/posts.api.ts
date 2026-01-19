import api from "./axios";
import { config } from "../config";

interface Post {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorTitle?: string;
  authorProfileImage?: string;
  teamId: string;
  teamName: string;
  unitName?: string;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  tags: string[];
  isLiked: boolean;
  isFavorited: boolean;
}

interface PostListResponse {
  items: Post[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
}

interface GetPostsParams {
  pageNumber?: number;
  pageSize?: number;
  categoryId?: string;
  searchTerm?: string;
}

export const postsApi = {
  getAll: async (params?: GetPostsParams): Promise<PostListResponse> => {
    const response = await api.get<PostListResponse>(config.endpoints.posts, {
      params,
    });
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Post> => {
    const response = await api.get<Post>(`${config.endpoints.posts}/${slug}`);
    return response.data;
  },

  like: async (postId: string) => {
    const response = await api.post(
      `${config.endpoints.interactions}/posts/${postId}/like`
    );
    return response.data;
  },

  favorite: async (postId: string) => {
    const response = await api.post(
      `${config.endpoints.interactions}/posts/${postId}/favorite`
    );
    return response.data;
  },
};
