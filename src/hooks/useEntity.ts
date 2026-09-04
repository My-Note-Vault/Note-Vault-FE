import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DocType } from "@/types/common";
import type { SpaceDetail } from "@/types/space";
import type { TaskDetail, UpdateTaskRequest } from "@/types/task";
import type { NoteDetail, UpdateNoteRequest } from "@/types/note";

import { fetchSpaceDetail, createSpace, updateSpace, deleteSpace } from "@/api/spaces";
import { fetchTaskDetail, createTask, updateTask, deleteTask } from "@/api/tasks";
import { fetchNoteDetail, createNote, updateNote, deleteNote } from "@/api/notes";

import { invalidateSidebar } from "./useDocuments";
import { spaceKeys } from "./useSpaces";
import { taskKeys } from "./useTasks";
import { noteKeys } from "./useNotes";

// --- 통합 타입 ---

export type EntityDetail = SpaceDetail | TaskDetail | NoteDetail;

export interface EntityMetadata {
  status: import("@/types/common").TaskStatus;
  startDate?: string | null;
  endDate?: string | null;
}

interface CreateEntityRequest {
  type: DocType;
  name: string;
  parentId?: string;
  workspaceId?: string;
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
  content: string;
}

// --- 디스패치 맵 ---

const detailFetchers: Record<DocType, (id: string) => Promise<EntityDetail>> = {
  space: fetchSpaceDetail,
  task: fetchTaskDetail,
  note: fetchNoteDetail,
};

const entityKeyMap = {
  space: spaceKeys,
  task: taskKeys,
  note: noteKeys,
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
    mutationFn: async ({ type, name, parentId, workspaceId }: CreateEntityRequest): Promise<CreateEntityResponse> => {
      switch (type) {
        case "space":
          return createSpace({ parentId: parentId ?? null, name, content: null, isPublic: false });
        case "task":
          return createTask({ title: name, workSpaceId: workspaceId!, parentId });
        case "note":
          return createNote({ workSpaceId: workspaceId!, parentId });
      }
    },
    onSuccess: () => {
      invalidateSidebar(queryClient);
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
          const payload: { name?: string; content?: string } = {};
          if (req.name !== undefined) payload.name = req.name;
          if (req.content !== undefined) payload.content = req.content;
          return updateSpace(id, payload);
        }
        case "task": {
          const taskReq: UpdateTaskRequest = {};
          if (req.name !== undefined) taskReq.title = req.name;
          if (req.metadata) {
            const meta = req.metadata;
            taskReq.status = meta.status;
            taskReq.startDateTime = meta.startDate;
            taskReq.endDateTime = meta.endDate;
          }
          return updateTask(id, taskReq);
        }
        case "note":
          return updateNote(id, req.name === undefined ? {} : { name: req.name });
      }
    },
    onSuccess: (_data, variables) => {
      const keys = entityKeyMap[variables.type];
      queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
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
        case "note":
          return deleteNote(id);
      }
    },
    onSuccess: (_data, variables) => {
      const keys = entityKeyMap[variables.type];
      invalidateSidebar(queryClient);
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
    mutationFn: async ({ id, content }: AutoSaveEntityRequest): Promise<void> =>
      updateSpace(id, { content }),
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<EntityDetail | undefined>(
        spaceKeys.detail(variables.id),
        (current) => current ? { ...current, content: variables.content } : current,
      );
    },
    onError: () => {
      toast.error("자동 저장에 실패했습니다");
    },
  });
};
