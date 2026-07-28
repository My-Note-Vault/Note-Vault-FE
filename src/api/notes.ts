import type {
  NoteDetail,
  CreateNoteRequest,
  CreateNoteResponse,
  UpdateNoteRequest,
} from "@/types/note";
import {
  createWorkspaceDocument,
  deleteWorkspaceDocument,
  fetchWorkspaceDocumentDetail,
  updateWorkspaceDocument,
} from "./workspaceDocuments";

export const fetchNoteDetail = async (id: string): Promise<NoteDetail> => {
  const data = await fetchWorkspaceDocumentDetail("note", id);
  return {
    id: data.id,
    name: data.name,
  };
};

export const createNote = async (req: CreateNoteRequest): Promise<CreateNoteResponse> => {
  return createWorkspaceDocument(
    { type: "NOTE", parentId: req.subTaskId, title: "새 Note" },
    "새 Note",
  );
};

export const updateNote = async (id: string, req: UpdateNoteRequest): Promise<void> => {
  await updateWorkspaceDocument("note", id, req);
};

export const deleteNote = async (id: string): Promise<void> => {
  await deleteWorkspaceDocument("note", id);
};
