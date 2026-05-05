export type DocType = "space" | "task" | "subtask" | "trivia";
export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

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

// 탭 ID: docType + entityId → 유일한 탭 식별자 (예: "task-1", "subtask-2")
export function entityTabId(docType: DocType, id: string | number): string {
  return `${docType}-${id}`;
}

// 탭 ID에서 엔티티 ID 추출 (예: "task-1" → "1", "daily-3" → "daily-3")
export function extractEntityId(tabId: string): string {
  const match = tabId.match(/^(?:space|task|subtask|trivia)-(.+)$/);
  return match ? match[1] : tabId;
}
