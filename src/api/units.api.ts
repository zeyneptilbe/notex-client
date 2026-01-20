import api from "./axios";
import { config } from "../config";

interface Unit {
  id: string;
  name: string;
  description?: string;
  code?: string;
  isActive: boolean;
  displayOrder: number;
  teamCount: number;
  createdAt: string;
}

interface CreateUnitRequest {
  name: string;
  description?: string;
  code?: string;
  displayOrder?: number;
}

export const unitsApi = {
  getAll: async (): Promise<Unit[]> => {
    const response = await api.get<Unit[]>(config.endpoints.units);
    return response.data;
  },

  getById: async (id: string): Promise<Unit> => {
    const response = await api.get<Unit>(`${config.endpoints.units}/${id}`);
    return response.data;
  },

  create: async (data: CreateUnitRequest): Promise<Unit> => {
    const response = await api.post<Unit>(config.endpoints.units, data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateUnitRequest>,
  ): Promise<Unit> => {
    const response = await api.put<Unit>(`${config.endpoints.units}/${id}`, {
      id,
      ...data,
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${config.endpoints.units}/${id}`);
  },
};
