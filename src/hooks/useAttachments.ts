import { useMutation, useQueryClient } from "@tanstack/react-query";
import { attachmentsApi } from "../api/posts.api";

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      file,
      onProgress,
    }: {
      postId: string;
      file: File;
      onProgress?: (percent: number) => void;
    }) => attachmentsApi.upload(postId, file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post"] });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => attachmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post"] });
    },
  });
}
