import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, type AdminUpdateUserRequest } from "../api/users.api";

interface GetUsersParams {
  pageNumber?: number;
  pageSize?: number;
  teamId?: string;
  unitId?: string;
  searchTerm?: string;
}

export function useUsers(params?: GetUsersParams) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => usersApi.getAll(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

export function useTopAuthors(count: number = 5) {
  return useQuery({
    queryKey: ["users", "top-authors", count],
    queryFn: () => usersApi.getTopAuthors(count),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUpdateUserRequest }) =>
      usersApi.adminUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
