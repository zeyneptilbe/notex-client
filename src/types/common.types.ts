export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
  postCount: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
}

export interface Unit {
  id: string;
  name: string;
  description?: string;
  code?: string;
  isActive: boolean;
  displayOrder: number;
  teamCount: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  code?: string;
  isActive: boolean;
  displayOrder: number;
  unitId: string;
  unitName: string;
  userCount: number;
  postCount: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: (typeof NotificationType)[keyof typeof NotificationType];
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  triggeredByUserName?: string;
}

export const NotificationType = {
  NewComment: 0,
  CommentReply: 1,
  PostLiked: 2,
  CommentLiked: 3,
  Mention: 4,
  NewFollowerPost: 5,
} as const;

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
