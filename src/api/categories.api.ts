import api from "./axios";
import { config } from "../config";

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  postCount: number;
}

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>(config.endpoints.categories);
    return response.data;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get<Category>(
      `${config.endpoints.categories}/${id}`
    );
    return response.data;
  },
};
