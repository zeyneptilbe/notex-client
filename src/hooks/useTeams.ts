import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamsApi } from "../api/teams.api";

interface GetTeamsParams {
  unitId?: string;
  isActive?: boolean;
  searchTerm?: string;
}

interface UpdateTeamData {
  name?: string;
  description?: string;
  code?: string;
  unitId?: string;
  displayOrder?: number;
}

export function useTeams(params?: GetTeamsParams) {
  return useQuery({
    queryKey: ["teams", params],
    queryFn: () => teamsApi.getAll(params),
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: ["team", id],
    queryFn: () => teamsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teamsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamData }) =>
      teamsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teamsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}
