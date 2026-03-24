import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchLastVisited, updateLastVisited } from "@/api/lastVisited";
import type { LastVisitedResponse } from "@/api/lastVisited";
import type { DocType } from "@/types/common";

const LAST_VISITED_KEY = "last_visited";

function readLastVisitedCache(): LastVisitedResponse | undefined {
  try {
    const raw = localStorage.getItem(LAST_VISITED_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export const lastVisitedKeys = {
  all: ["last-visited"] as const,
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
    mutationFn: ({ documentId, docType }: { documentId: string; docType: DocType }) => {
      // localStorage에 즉시 저장 (세션 종료 시 전송용)
      try {
        localStorage.setItem(LAST_VISITED_KEY, JSON.stringify({ documentId, docType }));
      } catch { /* 무시 */ }
      return updateLastVisited(documentId, docType);
    },
  });
};
