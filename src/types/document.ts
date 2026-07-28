import type { TaskStatus } from "./common";

export type WorkspaceDocumentType = "TASK" | "SUBTASK" | "NOTE";
export type WorkspaceDocumentKind = "task" | "subtask" | "note";

export interface DocumentDetail {
  id: string;
  type: WorkspaceDocumentKind;
  name: string;
  status: TaskStatus | null;
  startDateTime: string | null;
  endDateTime: string | null;
  children?: { id: string; name: string }[];
}

export interface CreateDocumentRequest {
  type: WorkspaceDocumentType;
  workSpaceId?: string;
  parentId?: string;
  title?: string;
  status?: TaskStatus;
  startDateTime?: string | null;
  endDateTime?: string | null;
  isPublic?: boolean;
}

export interface CreateDocumentResponse {
  id: string;
  name: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  name?: string;
  status?: TaskStatus;
  startDateTime?: string | null;
  endDateTime?: string | null;
  isPublic?: boolean;
  parentId?: string | null;
}
