import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  CreateDocumentRequest,
  CreateDocumentResponse,
  DocumentDetail,
  UpdateDocumentRequest,
  WorkspaceDocumentKind,
  WorkspaceDocumentType,
} from "@/types/document";

interface RawDocumentResponse {
  id: number;
  type: WorkspaceDocumentType;
  title: string;
  content: string | null;
  schedule: {
    status: string | null;
    startDateTime: number[] | string | null;
    endDateTime: number[] | string | null;
  } | null;
  children?: { id: number; name: string }[];
}

const API_TYPE: Record<WorkspaceDocumentKind, WorkspaceDocumentType> = {
  task: "TASK",
  subtask: "SUBTASK",
  note: "NOTE",
};

const KIND: Record<WorkspaceDocumentType, WorkspaceDocumentKind> = {
  TASK: "task",
  SUBTASK: "subtask",
  NOTE: "note",
};

function toDateTimeString(value: number[] | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;

  const [y, m, d, h = 0, min = 0, s = 0] = value;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function mapDocumentResponse(raw: RawDocumentResponse): DocumentDetail {
  return {
    id: String(raw.id),
    type: KIND[raw.type],
    name: raw.title,
    content: raw.content ?? "",
    status: (raw.schedule?.status as DocumentDetail["status"]) ?? null,
    startDateTime: toDateTimeString(raw.schedule?.startDateTime),
    endDateTime: toDateTimeString(raw.schedule?.endDateTime),
    children: raw.children?.map((c) => ({ id: String(c.id), name: c.name })),
  };
}

export const fetchWorkspaceDocumentDetail = async (
  type: WorkspaceDocumentKind,
  id: string,
): Promise<DocumentDetail> => {
  const { data } = await apiClient.get<RawDocumentResponse>(
    endpoints.DOCUMENT_DETAIL(API_TYPE[type], id),
  );
  return mapDocumentResponse(data);
};

export const createWorkspaceDocument = async (
  req: CreateDocumentRequest,
  displayName: string,
): Promise<CreateDocumentResponse> => {
  const { data } = await apiClient.post<number>(endpoints.DOCUMENTS, {
    type: req.type,
    workSpaceId: req.workSpaceId ? Number(req.workSpaceId) : undefined,
    parentId: req.parentId ? Number(req.parentId) : undefined,
    title: req.title,
    content: req.content,
    status: req.status,
    startDateTime: req.startDateTime,
    endDateTime: req.endDateTime,
    isPublic: req.isPublic,
  });
  return { id: String(data), name: displayName };
};

export const updateWorkspaceDocument = async (
  type: WorkspaceDocumentKind,
  id: string,
  req: UpdateDocumentRequest,
): Promise<void> => {
  const { name, parentId, ...rest } = req;
  await apiClient.patch(endpoints.DOCUMENT_DETAIL(API_TYPE[type], id), {
    ...rest,
    title: req.title ?? name,
    parentId: parentId ? Number(parentId) : parentId,
  });
};

export const deleteWorkspaceDocument = async (
  type: WorkspaceDocumentKind,
  id: string,
): Promise<void> => {
  await apiClient.delete(endpoints.DOCUMENT_DETAIL(API_TYPE[type], id));
};
