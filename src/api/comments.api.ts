import api from "./axios";
import { config } from "../config";

export interface CommentAttachment {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  contentType: string;
}

export interface Comment {
  id: string;
  content: string;
  postId?: string;
  authorId: string;
  authorName: string;
  authorTitle?: string;
  authorProfileImage?: string;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
  isOwner: boolean;
  parentCommentId?: string;
  replies?: Comment[];
  attachments?: CommentAttachment[];
}

export interface CreateCommentRequest {
  postId: string;
  content: string;
  parentCommentId?: string; // parentId değil, parentCommentId
}

export const commentsApi = {
  // Post'un yorumlarını getir
  getByPostId: async (postId: string): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(
      `${config.endpoints.posts}/${postId}/comments`,
    );
    return response.data;
  },

  // Yorum ekle
  create: async (data: CreateCommentRequest): Promise<Comment> => {
    const response = await api.post<Comment>(config.endpoints.comments, data);
    return response.data;
  },

  // Yorum sil
  delete: async (id: string): Promise<void> => {
    await api.delete(`${config.endpoints.comments}/${id}`);
  },

  // Yorum beğen
  like: async (commentId: string) => {
    const response = await api.post(
      `${config.endpoints.comments}/${commentId}/like`,
    );
    return response.data;
  },
};

export const commentAttachmentsApi = {
  upload: async (commentId: string, file: File): Promise<CommentAttachment> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<CommentAttachment>(
      `${config.endpoints.comments}/${commentId}/attachments`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  download: (id: string) => {
    const token = localStorage.getItem(config.tokenKey);
    const url = `${config.apiUrl}/comment-attachments/${id}/download`;
    window.open(`${url}?access_token=${token}`, "_blank");
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/comment-attachments/${id}`);
  },
};
