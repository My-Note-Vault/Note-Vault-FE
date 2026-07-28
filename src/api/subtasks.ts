import type {
  SubTaskDetail,
  CreateSubTaskRequest,
  CreateSubTaskResponse,
  UpdateSubTaskRequest,
} from "@/types/subtask";
import {
  createWorkspaceDocument,
  deleteWorkspaceDocument,
  fetchWorkspaceDocumentDetail,
  updateWorkspaceDocument,
} from "./workspaceDocuments";

export const fetchSubTaskDetail = async (id: string): Promise<SubTaskDetail> => {
  const data = await fetchWorkspaceDocumentDetail("subtask", id);
  return {
    id: data.id,
    name: data.name,
    status: data.status ?? "NOT_STARTED",
    startDate: data.startDateTime,
    endDate: data.endDateTime,
    children: data.children,
  };
};

export const createSubTask = async (req: CreateSubTaskRequest): Promise<CreateSubTaskResponse> => {
  return createWorkspaceDocument(
    {
      type: "SUBTASK",
      parentId: req.taskId,
      title: req.title,
      status: req.status,
      startDateTime: req.startDateTime,
      endDateTime: req.endDateTime,
    },
    req.title,
  );
};

export const updateSubTask = async (id: string, req: UpdateSubTaskRequest): Promise<void> => {
  await updateWorkspaceDocument("subtask", id, req);
};

export const deleteSubTask = async (id: string): Promise<void> => {
  await deleteWorkspaceDocument("subtask", id);
};
