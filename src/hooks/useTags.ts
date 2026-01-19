import { useQuery } from "@tanstack/react-query";
import { tagsApi } from "../api/tags.api";

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => tagsApi.getAll(),
  });
}

export function usePopularTags(count: number = 10) {
  return useQuery({
    queryKey: ["tags", "popular", count],
    queryFn: () => tagsApi.getPopular(count),
  });
}
