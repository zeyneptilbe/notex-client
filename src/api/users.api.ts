import api from "./axios";
import { config } from "../config";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  title?: string;
  profileImageUrl?: string;
  bio?: string;
  roleId: string;
  roleName: string;
  teamId?: string | null;
  teamName?: string | null;
  unitName: string;
  unitId: string;
  createdAt: string;
  postCount: number;
  commentCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isCurrentUser: boolean;
}

interface UserListResponse {
  items: User[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
}

interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  teamId?: string;
  unitId?: string;
  roleId: string;
  title?: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  title?: string;
  bio?: string;
  profileImageUrl?: string;
}

export interface AdminUpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  title?: string;
  roleId: string;
  unitId?: string;
  teamId?: string | null;
}

interface GetUsersParams {
  pageNumber?: number;
  pageSize?: number;
  teamId?: string;
  unitId?: string;
  searchTerm?: string;
}

export const usersApi = {
  getAll: async (params?: GetUsersParams): Promise<UserListResponse> => {
    const response = await api.get<UserListResponse>(config.endpoints.users, {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`${config.endpoints.users}/${id}`);
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>(config.endpoints.users, data);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put<User>(
      `${config.endpoints.users}/profile`,
      data,
    );
    return response.data;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    await api.put(`${config.endpoints.users}/change-password`, {
      currentPassword,
      newPassword,
    });
  },

  adminUpdate: async (id: string, data: AdminUpdateUserRequest): Promise<void> => {
    await api.put(`${config.endpoints.users}/${id}/admin`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${config.endpoints.users}/${id}`);
  },

  updateRole: async (id: string, roleId: string): Promise<void> => {
    await api.put(`${config.endpoints.users}/${id}/role`, { roleId });
  },

  follow: async (id: string): Promise<{ isFollowing: boolean }> => {
    const response = await api.post<{ isFollowing: boolean }>(
      `${config.endpoints.users}/${id}/follow`,
    );
    return response.data;
  },

  getTopAuthors: async (count: number = 5): Promise<User[]> => {
    const response = await api.get<User[]>(
      `${config.endpoints.users}/top-authors`,
      {
        params: { count },
      },
    );
    return response.data;
  },
};
