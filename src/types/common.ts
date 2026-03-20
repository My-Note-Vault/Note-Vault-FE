export type DocType = "space" | "task" | "subtask" | "trivia";
export type TaskStatus = "todo" | "in_progress" | "done" | "hold";

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
