import { useQuery } from "@tanstack/react-query";
import { searchApi } from "../api/search.api";

export function useSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () =>
      searchApi.search({
        q: query,
        postPageSize: 5,
        userPageSize: 5,
        tagPageSize: 5,
      }),
    enabled: enabled && query.trim().length >= 2,
  });
}
