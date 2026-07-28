import type {
  TaskDetail,
  CreateTaskRequest,
  CreateTaskResponse,
  UpdateTaskRequest,
} from "@/types/task";
import {
  createWorkspaceDocument,
  deleteWorkspaceDocument,
  fetchWorkspaceDocumentDetail,
  updateWorkspaceDocument,
} from "./workspaceDocuments";

export const fetchTaskDetail = async (id: string): Promise<TaskDetail> => {
  return fetchWorkspaceDocumentDetail("task", id);
};

export const createTask = async (req: CreateTaskRequest): Promise<CreateTaskResponse> => {
  return createWorkspaceDocument(
    {
      type: "TASK",
      workSpaceId: req.workSpaceId,
      title: req.title,
      status: req.status,
      startDateTime: req.startDateTime,
      endDateTime: req.endDateTime,
    },
    req.title,
  );
};

export const updateTask = async (id: string, req: UpdateTaskRequest): Promise<void> => {
  await updateWorkspaceDocument("task", id, req);
};

export const deleteTask = async (id: string): Promise<void> => {
  await deleteWorkspaceDocument("task", id);
};
