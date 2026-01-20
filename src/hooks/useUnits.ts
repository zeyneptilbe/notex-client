import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unitsApi } from "../api/units.api";

interface UpdateUnitData {
  name?: string;
  description?: string;
  code?: string;
  displayOrder?: number;
}

export function useUnits() {
  return useQuery({
    queryKey: ["units"],
    queryFn: () => unitsApi.getAll(),
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unitsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUnitData }) =>
      unitsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unitsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
}
