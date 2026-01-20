import api from "./axios";
import { config } from "../config";

interface Team {
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
  createdAt: string;
}

interface CreateTeamRequest {
  name: string;
  description?: string;
  code?: string;
  unitId: string;
  displayOrder?: number;
}

interface GetTeamsParams {
  unitId?: string;
  isActive?: boolean;
  searchTerm?: string;
}

export const teamsApi = {
  getAll: async (params?: GetTeamsParams): Promise<Team[]> => {
    const response = await api.get<Team[]>(config.endpoints.teams, { params });
    return response.data;
  },

  getById: async (id: string): Promise<Team> => {
    const response = await api.get<Team>(`${config.endpoints.teams}/${id}`);
    return response.data;
  },

  create: async (data: CreateTeamRequest): Promise<Team> => {
    const response = await api.post<Team>(config.endpoints.teams, data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateTeamRequest>,
  ): Promise<Team> => {
    const response = await api.put<Team>(`${config.endpoints.teams}/${id}`, {
      id,
      ...data,
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${config.endpoints.teams}/${id}`);
  },
};
