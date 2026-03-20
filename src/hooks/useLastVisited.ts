import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchLastVisited, updateLastVisited } from "@/api/lastVisited";
import type { DocType } from "@/types/common";

export const lastVisitedKeys = {
  all: ["last-visited"] as const,
};

export const useLastVisited = () => {
  return useQuery({
    queryKey: lastVisitedKeys.all,
    queryFn: fetchLastVisited,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

export const useUpdateLastVisited = () => {
  return useMutation({
    mutationFn: ({ documentId, docType }: { documentId: string; docType: DocType }) =>
      updateLastVisited(documentId, docType),
  });
};
