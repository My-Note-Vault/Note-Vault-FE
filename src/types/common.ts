export type DocType = "space" | "task" | "subtask" | "trivia";
export type TaskStatus = "todo" | "in_progress" | "done" | "hold";

// 백엔드 NoteType (대문자)
export type NoteType = "WORKSPACE" | "TASK" | "SUBTASK" | "TRIVIA";

// NoteInfo (flat list) — /api/v1/unfolded-notes/note-info
export interface NoteInfo {
  id: number;
  type: NoteType;
  parentId: number | null;
  name?: string;   // WORKSPACE
  title?: string;  // TASK, SUBTASK, TRIVIA
}

// TaskOverview — /api/v1/unfolded-notes/note-info?workspace={id}
export interface TaskOverview {
  id: number;
  title: string;
  subTaskSummaries: SubTaskSummary[];
}

export interface SubTaskSummary {
  id: number;
  title: string;
  triviaSummaries: TriviaSummary[];
}

export interface TriviaSummary {
  id: number;
  title: string;
}

// UnfoldedNote — /api/v1/unfolded-notes
export interface UnfoldedNote {
  type: NoteType;
  noteId: number;
}

// NoteType ↔ DocType 매핑
const NOTE_TO_DOC: Record<NoteType, DocType> = {
  WORKSPACE: "space",
  TASK: "task",
  SUBTASK: "subtask",
  TRIVIA: "trivia",
};
const DOC_TO_NOTE: Record<DocType, NoteType> = {
  space: "WORKSPACE",
  task: "TASK",
  subtask: "SUBTASK",
  trivia: "TRIVIA",
};
export const noteTypeToDocType = (nt: NoteType): DocType => NOTE_TO_DOC[nt];
export const docTypeToNoteType = (dt: DocType): NoteType => DOC_TO_NOTE[dt];

// 사이드바 트리 구조에서 사용하는 아이템 타입
export interface SidebarItem {
  id: string;
  name: string;
  type?: DocType;
  children?: SidebarItem[];
}

// 검색 결과
export interface SearchResult {
  id: string;
  name: string;
  type?: DocType;
  content?: string;
}

// 캘린더 날짜별 통계
export interface CalendarDateStat {
  date: string;
  startCount: number;
  endCount: number;
}

export type CalendarStatsResponse = CalendarDateStat[];
