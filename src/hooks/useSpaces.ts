import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSpaces, fetchSpaceDetail, createSpace, updateSpace, deleteSpace } from "@/api/spaces";
import type { CreateSpaceRequest } from "@/types/space";
import { invalidateSidebar } from "./useDocuments";

export const spaceKeys = {
  all: ["spaces"] as const,
  list: () => [...spaceKeys.all, "list"] as const,
  details: () => [...spaceKeys.all, "detail"] as const,
  detail: (id: string) => [...spaceKeys.details(), id] as const,
};

export const useSpaceList = () => {
  return useQuery({
    queryKey: spaceKeys.list(),
    queryFn: fetchSpaces,
    staleTime: 1000 * 60,
  });
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
      invalidateSidebar(queryClient);
    },
  });
};

export const useUpdateSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: { id: string; name?: string; content?: string; parentId?: string | null }) => updateSpace(id, req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: spaceKeys.detail(variables.id) });
    },
  });
};

export const useDeleteSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSpace(id),
    onSuccess: (_data, id) => {
      invalidateSidebar(queryClient);
      queryClient.removeQueries({ queryKey: spaceKeys.detail(id) });
    },
  });
};
