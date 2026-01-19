import api from "./axios";
import { config } from "../config";

interface Tag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
}

export const tagsApi = {
  getAll: async (): Promise<Tag[]> => {
    const response = await api.get<Tag[]>(config.endpoints.tags);
    return response.data;
  },

  getPopular: async (count: number = 10): Promise<Tag[]> => {
    const response = await api.get<Tag[]>(`${config.endpoints.tags}/popular`, {
      params: { count },
    });
    return response.data;
  },
};
