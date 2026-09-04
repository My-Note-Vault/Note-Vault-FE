export type DocType = "space" | "task" | "note";
export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

// 백엔드 NoteType (대문자)
export type NoteType = "WORKSPACE" | "TASK" | "NOTE";

// NoteInfo (flat list) — /api/v1/unfolded-notes/note-info
export interface NoteInfo {
  id: number;
  type: NoteType;
  parentId: number | null;
  name?: string;   // WORKSPACE
  title?: string;  // TASK, NOTE
}

// TaskOverview — /api/v1/unfolded-notes/note-info?workspace={id}
export interface TaskOverview {
  id: number;
  type: "TASK" | "NOTE";
  title: string;
  parentId: number | null;
  children: TaskOverview[];
}

// NoteType ↔ DocType 매핑
const NOTE_TO_DOC: Record<NoteType, DocType> = {
  WORKSPACE: "space",
  TASK: "task",
  NOTE: "note",
};
const DOC_TO_NOTE: Record<DocType, NoteType> = {
  space: "WORKSPACE",
  task: "TASK",
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
  resultType: DocType | "daily";
}

export type JavaLocalDate = string | number[];
export type JavaLocalDateTime = string | number[];

export interface SearchResponse {
  results: SearchResultResponse[];
}

export type SearchDocumentType = "WORKSPACE" | "TASK" | "NOTE" | "DAILY_NOTE";

export interface SearchResultResponse {
  id: number;
  type: SearchDocumentType;
  title: string;
  content: string | null;
  createdAt: JavaLocalDateTime;
  logicalDate: JavaLocalDate | null;
}

// 캘린더 날짜별 통계
export type CalendarEventType = "START" | "END";
export type CalendarDateStat = Partial<Record<CalendarEventType, number>>;
export type CalendarStatsResponse = Record<string, CalendarDateStat>;

// 탭 ID: docType + entityId → 유일한 탭 식별자
export function entityTabId(docType: DocType, id: string | number): string {
  return `${docType}-${id}`;
}

// 탭 ID에서 엔티티 ID 추출 (예: "task-1" → "1", "daily-3" → "daily-3")
export function extractEntityId(tabId: string): string {
  const match = tabId.match(/^(?:space|task|note)-(.+)$/);
  return match ? match[1] : tabId;
}
