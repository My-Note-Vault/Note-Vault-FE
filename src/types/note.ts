export interface NoteDetail {
  id: string;
  name: string;
}

export interface CreateNoteRequest {
  subTaskId: string;
}

export interface CreateNoteResponse {
  id: string;
  name: string;
}

export interface UpdateNoteRequest {
  name?: string;
}
