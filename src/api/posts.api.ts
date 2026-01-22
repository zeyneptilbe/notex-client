import api from "./axios";
import { config } from "../config";

export interface Post {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  status: number;
  visibility: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
  publishedAt?: string;
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
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface GetPostsParams {
  pageNumber?: number;
  pageSize?: number;
  categoryId?: string;
  tagSlug?: string;
  authorId?: string;
  teamId?: string;
  status?: number;
  searchTerm?: string;
  sortBy?: string;
}

interface CreatePostRequest {
  title: string;
  content: string;
  summary?: string;
  status: number;
  visibility: number;
  categoryId?: string;
  tags: string[];
}

interface UpdatePostRequest {
  id: string;
  title: string;
  content: string;
  summary?: string;
  status: number;
  visibility: number;
  categoryId?: string;
  tags: string[];
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

  create: async (data: CreatePostRequest): Promise<Post> => {
    const response = await api.post<Post>(config.endpoints.posts, data);
    return response.data;
  },

  update: async (data: UpdatePostRequest): Promise<Post> => {
    const response = await api.put<Post>(
      `${config.endpoints.posts}/${data.id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${config.endpoints.posts}/${id}`);
  },

  like: async (postId: string) => {
    const response = await api.post(
      `${config.endpoints.interactions}/posts/${postId}/like`,
    );
    return response.data;
  },

  favorite: async (postId: string) => {
    const response = await api.post(
      `${config.endpoints.interactions}/posts/${postId}/favorite`,
    );
    return response.data;
  },

  getComments: async (postId: string) => {
    const response = await api.get(
      `${config.endpoints.posts}/${postId}/comments`,
    );
    return response.data;
  },
};
