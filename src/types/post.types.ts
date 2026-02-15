// Status constants
export const PostStatus = {
  Draft: 0,
  Published: 1,
  Archived: 2,
  PendingApproval: 3,
  Rejected: 4,
} as const;

export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

// Visibility constants
export const PostVisibility = {
  Team: 0,
  Unit: 1,
  Company: 2,
} as const;

export type PostVisibility =
  (typeof PostVisibility)[keyof typeof PostVisibility];

// Attachment
export interface PostAttachment {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  contentType: string;
}

// Entities
export interface Post {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  status: PostStatus;
  visibility: PostVisibility;
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
  unitName: string;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  tags: string[];
  isLiked: boolean;
  isFavorited: boolean;
  attachments?: PostAttachment[];
  reviewedByUserId?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

// Responses
export interface PostListResponse {
  items: Post[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Requests
export interface CreatePostRequest {
  title: string;
  content: string;
  summary?: string;
  status: PostStatus;
  visibility: PostVisibility;
  categoryId?: string;
  tags: string[];
}
