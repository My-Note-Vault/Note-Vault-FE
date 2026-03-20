import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSubTaskDetail, createSubTask, updateSubTask, deleteSubTask } from "@/api/subtasks";
import type { CreateSubTaskRequest, UpdateSubTaskRequest } from "@/types/subtask";
import { documentKeys } from "./useDocuments";

export const subTaskKeys = {
  all: ["subtasks"] as const,
  details: () => [...subTaskKeys.all, "detail"] as const,
  detail: (id: string) => [...subTaskKeys.details(), id] as const,
};

export const useSubTaskDetail = (id: string | null) => {
  return useQuery({
    queryKey: subTaskKeys.detail(id!),
    queryFn: () => fetchSubTaskDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
};

export const useCreateSubTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateSubTaskRequest) => createSubTask(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.tree() });
    },
  });
};

export const useUpdateSubTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdateSubTaskRequest & { id: string }) => updateSubTask(id, req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: subTaskKeys.detail(variables.id) });
      if (variables.name) {
        queryClient.invalidateQueries({ queryKey: documentKeys.tree() });
      }
      if (variables.metadata) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.calendarStats(0, 0),
          predicate: (query) => query.queryKey[0] === "documents" && query.queryKey[1] === "calendar-stats",
        });
      }
    },
  });
};

export const useDeleteSubTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubTask(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.tree() });
      queryClient.removeQueries({ queryKey: subTaskKeys.detail(id) });
    },
  });
};
