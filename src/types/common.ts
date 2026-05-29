export type DocType = "space" | "task" | "subtask" | "note";
export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

// 백엔드 NoteType (대문자)
export type NoteType = "WORKSPACE" | "TASK" | "SUBTASK" | "NOTE";

// NoteInfo (flat list) — /api/v1/unfolded-notes/note-info
export interface NoteInfo {
  id: number;
  type: NoteType;
  parentId: number | null;
  name?: string;   // WORKSPACE
  title?: string;  // TASK, SUBTASK, NOTE
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
  noteSummaries: NoteSummary[];
}

export interface NoteSummary {
  id: number;
  title: string;
}

// NoteType ↔ DocType 매핑
const NOTE_TO_DOC: Record<NoteType, DocType> = {
  WORKSPACE: "space",
  TASK: "task",
  SUBTASK: "subtask",
  NOTE: "note",
};
const DOC_TO_NOTE: Record<DocType, NoteType> = {
  space: "WORKSPACE",
  task: "TASK",
  subtask: "SUBTASK",
  note: "NOTE",
};
export const noteTypeToDocType = (nt: NoteType): DocType => NOTE_TO_DOC[nt];
export const docTypeToNoteType = (dt: DocType): NoteType => DOC_TO_NOTE[dt];
export const sidebarUnfoldedId = (docType: DocType, id: string | number): string =>
  `${docType}:${id}`;

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
  resultType?: DocType | "daily";
}

export type JavaLocalDate = string | number[];
export type JavaLocalDateTime = string | number[];

export interface SearchResponse {
  workSpaces: SearchWorkSpaceResult[];
  dailyNotes: SearchDailyNoteResult[];
}

export interface SearchWorkSpaceResult {
  id: number;
  name: string;
  content: string | null;
  createdAt: JavaLocalDateTime;
  matched: boolean;
  tasks: SearchTaskResult[];
}

export interface SearchTaskResult {
  id: number;
  title: string;
  content: string | null;
  createdAt: JavaLocalDateTime;
  matched: boolean;
  subTasks: SearchSubTaskResult[];
}

export interface SearchSubTaskResult {
  id: number;
  title: string;
  content: string | null;
  createdAt: JavaLocalDateTime;
  matched: boolean;
  notes: SearchNoteResult[];
}

export interface SearchNoteResult {
  id: number;
  title: string;
  content: string | null;
  createdAt: JavaLocalDateTime;
  matched: boolean;
}

export interface SearchDailyNoteResult {
  id: number;
  logicalDate: JavaLocalDate;
  content: string | null;
  createdAt: JavaLocalDateTime;
}

// 캘린더 날짜별 통계
export type CalendarEventType = "START" | "END";
export type CalendarDateStat = Partial<Record<CalendarEventType, number>>;
export type CalendarStatsResponse = Record<string, CalendarDateStat>;

// 탭 ID: docType + entityId → 유일한 탭 식별자 (예: "task-1", "subtask-2")
export function entityTabId(docType: DocType, id: string | number): string {
  return `${docType}-${id}`;
}

// 탭 ID에서 엔티티 ID 추출 (예: "task-1" → "1", "daily-3" → "daily-3")
export function extractEntityId(tabId: string): string {
  const match = tabId.match(/^(?:space|task|subtask|note)-(.+)$/);
  return match ? match[1] : tabId;
}
