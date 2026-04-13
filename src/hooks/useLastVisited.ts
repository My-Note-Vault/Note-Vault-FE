import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchLastVisited, updateLastVisited } from "@/api/lastVisited";

const LAST_VISITED_KEY = "last_visited";

function readLastVisitedCache(): string | undefined {
  try {
    const raw = localStorage.getItem(LAST_VISITED_KEY);
    return raw ?? undefined;
  } catch {
    return undefined;
  }
}

export const lastVisitedKeys = {
  all: ["last-visited-path"] as const,
};

export const useLastVisited = () => {
  return useQuery({
    queryKey: lastVisitedKeys.all,
    queryFn: fetchLastVisited,
    staleTime: 1000 * 60 * 5,
    retry: false,
    initialData: readLastVisitedCache,
  });
};

export const useUpdateLastVisited = () => {
  return useMutation({
    mutationFn: (path: string) => {
      try {
        localStorage.setItem(LAST_VISITED_KEY, path);
      } catch { /* 무시 */ }
      return updateLastVisited(path);
    },
  });
};
