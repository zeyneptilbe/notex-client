import api from "./axios";
import { config } from "../config";

export interface SearchPostItem {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  authorName: string;
  authorProfileImage?: string;
  teamName?: string | null;
  categoryName?: string;
  categoryColor?: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  publishedAt?: string;
  tags: string[];
}

export interface SearchUserItem {
  id: string;
  fullName: string;
  email: string;
  title?: string;
  profileImageUrl?: string;
  teamName?: string | null;
  unitName: string;
  postCount: number;
}

export interface SearchTagItem {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
}

export interface SearchResult {
  posts: { items: SearchPostItem[]; totalCount: number };
  users: { items: SearchUserItem[]; totalCount: number };
  tags: { items: SearchTagItem[]; totalCount: number };
}

interface SearchParams {
  q: string;
  postPage?: number;
  postPageSize?: number;
  userPage?: number;
  userPageSize?: number;
  tagPage?: number;
  tagPageSize?: number;
}

export const searchApi = {
  search: async (params: SearchParams): Promise<SearchResult> => {
    const response = await api.get<SearchResult>(config.endpoints.search, {
      params,
    });
    return response.data;
  },
};
