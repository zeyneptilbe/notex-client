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
  teamId?: string | null;
  teamName?: string | null;
  unitName?: string;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  tags: string[];
  isLiked: boolean;
  isFavorited: boolean;
  attachments?: PostAttachment[];
  reviewedByUserId?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

export interface PostAttachment {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  contentType: string;
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
  followingOnly?: boolean;
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

export interface RevisionAttachment {
  fileName: string;
  originalFileName: string;
  fileSize: number;
  contentType: string;
}

export interface PostRevision {
  id: string;
  revisionNumber: number;
  title: string;
  content: string;
  summary: string;
  status: number;
  visibility: number;
  categoryId: string | null;
  categoryName: string | null;
  tags: string[];
  attachments: RevisionAttachment[];
  changeNote: string | null;
  editedByUserId: string;
  editedByName: string;
  createdAt: string;
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
  getFavorites: async (params?: { pageNumber?: number; pageSize?: number }): Promise<PostListResponse> => {
    const response = await api.get<PostListResponse>(
      `${config.endpoints.interactions}/favorites`,
      { params },
    );
    return response.data;
  },

  getPendingApproval: async (params?: { pageNumber?: number; pageSize?: number }): Promise<PostListResponse> => {
    const response = await api.get<PostListResponse>(
      `${config.endpoints.posts}/pending-approval`,
      { params },
    );
    return response.data;
  },

  approve: async (id: string): Promise<Post> => {
    const response = await api.post<Post>(
      `${config.endpoints.posts}/${id}/approve`,
    );
    return response.data;
  },

  reject: async (id: string, rejectionReason: string): Promise<Post> => {
    const response = await api.post<Post>(
      `${config.endpoints.posts}/${id}/reject`,
      { rejectionReason },
    );
    return response.data;
  },

  getRevisions: async (postId: string): Promise<PostRevision[]> => {
    const response = await api.get<PostRevision[]>(
      `${config.endpoints.posts}/${postId}/revisions`,
    );
    return response.data;
  },
};

export const attachmentsApi = {
  upload: async (
    postId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<PostAttachment> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<PostAttachment>(
      `${config.endpoints.posts}/${postId}/attachments`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      },
    );
    return response.data;
  },

  download: (id: string) => {
    const token = localStorage.getItem(config.tokenKey);
    const url = `${config.apiUrl}/attachments/${id}/download`;
    window.open(`${url}?access_token=${token}`, "_blank");
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/attachments/${id}`);
  },
};
