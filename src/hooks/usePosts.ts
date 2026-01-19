import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postsApi } from "../api/posts.api";

interface GetPostsParams {
  pageNumber?: number;
  pageSize?: number;
  categoryId?: string;
  searchTerm?: string;
}

export function usePosts(params?: GetPostsParams) {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: () => postsApi.getAll(params),
  });
}

export function usePostBySlug(slug: string) {
  return useQuery({
    queryKey: ["post", slug],
    queryFn: () => postsApi.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postsApi.like(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useFavoritePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postsApi.favorite(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
