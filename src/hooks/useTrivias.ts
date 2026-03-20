import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTriviaDetail, createTrivia, updateTrivia, deleteTrivia } from "@/api/trivias";
import type { CreateTriviaRequest, UpdateTriviaRequest } from "@/types/trivia";
import { documentKeys } from "./useDocuments";

export const triviaKeys = {
  all: ["trivias"] as const,
  details: () => [...triviaKeys.all, "detail"] as const,
  detail: (id: string) => [...triviaKeys.details(), id] as const,
};

export const useTriviaDetail = (id: string | null) => {
  return useQuery({
    queryKey: triviaKeys.detail(id!),
    queryFn: () => fetchTriviaDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
};

export const useCreateTrivia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateTriviaRequest) => createTrivia(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.tree() });
    },
  });
};

export const useUpdateTrivia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdateTriviaRequest & { id: string }) => updateTrivia(id, req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: triviaKeys.detail(variables.id) });
      if (variables.name) {
        queryClient.invalidateQueries({ queryKey: documentKeys.tree() });
      }
    },
  });
};

export const useDeleteTrivia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTrivia(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.tree() });
      queryClient.removeQueries({ queryKey: triviaKeys.detail(id) });
    },
  });
};
