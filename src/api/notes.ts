import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  NoteDetail,
  CreateNoteRequest,
  CreateNoteResponse,
  UpdateNoteRequest,
} from "@/types/note";

export const fetchNoteDetail = async (id: string): Promise<NoteDetail> => {
  const { data } = await apiClient.get<NoteDetail>(endpoints.NOTE_DETAIL(id));
  return data;
};

export const createNote = async (req: CreateNoteRequest): Promise<CreateNoteResponse> => {
  const { data } = await apiClient.post<number>(endpoints.NOTES, req);
  return { id: String(data), name: "새 Note" };
};

export const updateNote = async (id: string, req: UpdateNoteRequest): Promise<void> => {
  await apiClient.patch(endpoints.NOTES, { ...req, noteId: id });
};

export const deleteNote = async (id: string): Promise<void> => {
  await apiClient.delete(endpoints.NOTE_DETAIL(id));
};
