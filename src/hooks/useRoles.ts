import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesApi, permissionsApi } from "../api/roles.api";
import type { CreateRoleRequest, UpdateRoleRequest } from "../api/roles.api";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: rolesApi.getAll,
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: ["roles", id],
    queryFn: () => rolesApi.getById(id),
    enabled: !!id,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: permissionsApi.getAll,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleRequest }) =>
      rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}
