import api from "./axios";
import { config } from "../config";

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
  postCount: number;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
}

export interface UpdateCategoryRequest {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
}

export const categoriesApi = {
  getAll: async (isActive?: boolean): Promise<Category[]> => {
    const response = await api.get<Category[]>(config.endpoints.categories, {
      params: { isActive },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get<Category>(
      `${config.endpoints.categories}/${id}`,
    );
    return response.data;
  },

  create: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await api.post<Category>(
      config.endpoints.categories,
      data,
    );
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateCategoryRequest,
  ): Promise<Category> => {
    const response = await api.put<Category>(
      `${config.endpoints.categories}/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${config.endpoints.categories}/${id}`);
  },
};
