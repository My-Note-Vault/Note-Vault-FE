import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DocType } from "@/types/common";
import type { SpaceDetail } from "@/types/space";
import type { TaskDetail, TaskMetadata, UpdateTaskRequest } from "@/types/task";
import type { SubTaskDetail, SubTaskMetadata, UpdateSubTaskRequest } from "@/types/subtask";
import type { TriviaDetail, UpdateTriviaRequest } from "@/types/trivia";

import { fetchSpaceDetail, createSpace, updateSpace, deleteSpace } from "@/api/spaces";
import { fetchTaskDetail, createTask, updateTask, deleteTask } from "@/api/tasks";
import { fetchSubTaskDetail, createSubTask, updateSubTask, deleteSubTask } from "@/api/subtasks";
import { fetchTriviaDetail, createTrivia, updateTrivia, deleteTrivia } from "@/api/trivias";

import { documentKeys } from "./useDocuments";
import { spaceKeys } from "./useSpaces";
import { taskKeys } from "./useTasks";
import { subTaskKeys } from "./useSubTasks";
import { triviaKeys } from "./useTrivias";

// --- 통합 타입 ---

export type EntityDetail = SpaceDetail | TaskDetail | SubTaskDetail | TriviaDetail;

export type EntityMetadata = TaskMetadata | SubTaskMetadata;

interface CreateEntityRequest {
  type: DocType;
  name: string;
  parentId?: string;
}

interface CreateEntityResponse {
  id: string;
  name: string;
}

interface UpdateEntityRequest {
  id: string;
  type: DocType;
  name?: string;
  content?: string;
  metadata?: EntityMetadata;
}

interface DeleteEntityRequest {
  id: string;
  type: DocType;
}

interface AutoSaveEntityRequest {
  id: string;
  type: DocType;
  content: string;
}

// --- 디스패치 맵 ---

const detailFetchers: Record<DocType, (id: string) => Promise<EntityDetail>> = {
  space: fetchSpaceDetail,
  task: fetchTaskDetail,
  subtask: fetchSubTaskDetail,
  trivia: fetchTriviaDetail,
};

const entityKeyMap = {
  space: spaceKeys,
  task: taskKeys,
  subtask: subTaskKeys,
  trivia: triviaKeys,
};

// --- 통합 훅 ---

export const useEntityDetail = (id: string | null, type?: DocType) => {
  return useQuery({
    queryKey: type ? entityKeyMap[type].detail(id!) : ["entity", "detail", id],
    queryFn: () => detailFetchers[type!](id!),
    enabled: !!id && !!type,
    staleTime: 1000 * 30,
  });
};

export const useCreateEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, name, parentId }: CreateEntityRequest): Promise<CreateEntityResponse> => {
      switch (type) {
        case "space":
          return createSpace({ parentId: parentId ?? null, name, content: null, isPublic: false });
        case "task":
          return createTask({ name, parentId: parentId! });
        case "subtask":
          return createSubTask({ name, parentId: parentId! });
        case "trivia":
          return createTrivia({ name, parentId: parentId! });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.noteInfo() });
    },
    onError: () => {
      toast.error("생성에 실패했습니다");
    },
  });
};

export const useUpdateEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type, ...req }: UpdateEntityRequest): Promise<void> => {
      switch (type) {
        case "space": {
          const cached = queryClient.getQueryData<SpaceDetail>(spaceKeys.detail(id));
          return updateSpace(id, {
            name: req.name ?? cached?.name ?? "",
            content: req.content ?? cached?.content ?? "",
          });
        }
        case "task":
          return updateTask(id, req as UpdateTaskRequest);
        case "subtask":
          return updateSubTask(id, req as UpdateSubTaskRequest);
        case "trivia":
          return updateTrivia(id, req as UpdateTriviaRequest);
      }
    },
    onSuccess: (_data, variables) => {
      const keys = entityKeyMap[variables.type];
      queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
      if (variables.name) {
        queryClient.invalidateQueries({ queryKey: documentKeys.noteInfo() });
      }
      if (variables.metadata) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === "documents" && query.queryKey[1] === "calendar-stats",
        });
      }
    },
    onError: () => {
      toast.error("저장에 실패했습니다");
    },
  });
};

export const useDeleteEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type }: DeleteEntityRequest): Promise<void> => {
      switch (type) {
        case "space":
          return deleteSpace(id);
        case "task":
          return deleteTask(id);
        case "subtask":
          return deleteSubTask(id);
        case "trivia":
          return deleteTrivia(id);
      }
    },
    onSuccess: (_data, variables) => {
      const keys = entityKeyMap[variables.type];
      queryClient.invalidateQueries({ queryKey: documentKeys.noteInfo() });
      queryClient.removeQueries({ queryKey: keys.detail(variables.id) });
    },
    onError: () => {
      toast.error("삭제에 실패했습니다");
    },
  });
};

export const useAutoSaveEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type, content }: AutoSaveEntityRequest): Promise<void> => {
      switch (type) {
        case "space": {
          const cached = queryClient.getQueryData<SpaceDetail>(spaceKeys.detail(id));
          return updateSpace(id, { name: cached?.name ?? "", content });
        }
        case "task":
          return updateTask(id, { content });
        case "subtask":
          return updateSubTask(id, { content });
        case "trivia":
          return updateTrivia(id, { content });
      }
    },
    onError: () => {
      toast.error("자동 저장에 실패했습니다");
    },
  });
};
