import api from "./axios";
import { config } from "../config";

export interface RolePermission {
  id: string;
  name: string;
  displayName: string;
  group: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissionCount?: number;
  permissions: RolePermission[];
}

export interface Permission {
  id: string;
  name: string;
  displayName: string;
}

export interface PermissionGroup {
  group: string;
  permissions: Permission[];
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  name: string;
  description: string;
  permissionIds: string[];
}

export const rolesApi = {
  getAll: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>(config.endpoints.roles);
    return response.data;
  },

  getById: async (id: string): Promise<Role> => {
    const response = await api.get<Role>(`${config.endpoints.roles}/${id}`);
    return response.data;
  },

  create: async (data: CreateRoleRequest): Promise<Role> => {
    const response = await api.post<Role>(config.endpoints.roles, data);
    return response.data;
  },

  update: async (id: string, data: UpdateRoleRequest): Promise<Role> => {
    const response = await api.put<Role>(
      `${config.endpoints.roles}/${id}`,
      { id, ...data },
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${config.endpoints.roles}/${id}`);
  },
};

export const permissionsApi = {
  getAll: async (): Promise<PermissionGroup[]> => {
    const response = await api.get<PermissionGroup[]>(
      config.endpoints.permissions,
    );
    return response.data;
  },
};
