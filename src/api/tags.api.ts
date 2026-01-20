import api from "./axios";
import { config } from "../config";

interface Tag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
  createdAt: string;
}

export const tagsApi = {
  getAll: async (searchTerm?: string): Promise<Tag[]> => {
    const response = await api.get<Tag[]>(config.endpoints.tags, {
      params: { searchTerm },
    });
    return response.data;
  },

  getPopular: async (count: number = 10): Promise<Tag[]> => {
    const response = await api.get<Tag[]>(`${config.endpoints.tags}/popular`, {
      params: { count },
    });
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Tag> => {
    const response = await api.get<Tag>(`${config.endpoints.tags}/${slug}`);
    return response.data;
  },

  create: async (name: string): Promise<Tag> => {
    const response = await api.post<Tag>(config.endpoints.tags, { name });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${config.endpoints.tags}/${id}`);
  },
};
