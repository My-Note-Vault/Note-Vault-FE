import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTaskDetail, createTask, updateTask, deleteTask } from "@/api/tasks";
import type { CreateTaskRequest, UpdateTaskRequest } from "@/types/task";
import { documentKeys } from "./useDocuments";

export const taskKeys = {
  all: ["tasks"] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

export const useTaskDetail = (id: string | null) => {
  return useQuery({
    queryKey: taskKeys.detail(id!),
    queryFn: () => fetchTaskDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateTaskRequest) => createTask(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.tree() });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdateTaskRequest & { id: string }) => updateTask(id, req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) });
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

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.tree() });
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
    },
  });
};
