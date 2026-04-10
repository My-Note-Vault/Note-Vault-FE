import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSpaceDetail, createSpace, updateSpace, deleteSpace } from "@/api/spaces";
import type { CreateSpaceRequest } from "@/types/space";
import { documentKeys } from "./useDocuments";

export const spaceKeys = {
  all: ["spaces"] as const,
  details: () => [...spaceKeys.all, "detail"] as const,
  detail: (id: string) => [...spaceKeys.details(), id] as const,
};

export const useSpaceDetail = (id: string | null) => {
  return useQuery({
    queryKey: spaceKeys.detail(id!),
    queryFn: () => fetchSpaceDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
};

export const useCreateSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateSpaceRequest) => createSpace(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.noteInfos() });
    },
  });
};

export const useUpdateSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: { id: string; name?: string; content?: string; parentId?: string | null }) => updateSpace(id, req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: spaceKeys.detail(variables.id) });
      if (variables.name) {
        queryClient.invalidateQueries({ queryKey: documentKeys.noteInfos() });
      }
    },
  });
};

export const useDeleteSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSpace(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.noteInfos() });
      queryClient.removeQueries({ queryKey: spaceKeys.detail(id) });
    },
  });
};
