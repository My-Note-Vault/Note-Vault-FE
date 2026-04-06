import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  NoteInfo,
  UnfoldedNote,
  SidebarItem,
  SearchResult,
  CalendarStatsResponse,
} from "@/types/common";

// DailyNote 상세 타입
export interface DailyNoteDetail {
  dailyNoteId: number;
  todayTodo: string;
  tomorrowTodo: string;
  memo: string;
}

// 전체 NoteInfo 조회 (flat list)
export const fetchNoteInfoList = async (): Promise<NoteInfo[]> => {
  const { data } = await apiClient.get<NoteInfo[]>(endpoints.NOTE_INFO_LIST);
  return data;
};

// 펼쳐진 노트 ID 조회
export const fetchUnfoldedNotes = async (): Promise<UnfoldedNote[]> => {
  const { data } = await apiClient.get<UnfoldedNote[]>(endpoints.UNFOLDED_NOTES);
  return data;
};

// 통합 검색
export const searchDocuments = async (
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> => {
  const { data } = await apiClient.get<SearchResult[]>(endpoints.DOCUMENT_SEARCH, {
    params: { q: query },
    signal,
  });
  return data;
};

// Daily Notes 트리 조회
export const fetchDailyNotes = async (): Promise<SidebarItem> => {
  const { data } = await apiClient.get<SidebarItem>(endpoints.DAILY_NOTES_ALL);
  return data;
};

// Daily Note 상세 조회 (오늘 날짜 기준)
export const fetchDailyNoteDetail = async (): Promise<DailyNoteDetail> => {
  const { data } = await apiClient.get<DailyNoteDetail>(endpoints.DAILY_NOTE);
  return data;
};

// Daily Note 수정
export const updateDailyNote = async (
  dailyNoteId: number,
  body: Partial<Pick<DailyNoteDetail, "todayTodo" | "tomorrowTodo" | "memo">>,
): Promise<DailyNoteDetail> => {
  const { data } = await apiClient.patch<DailyNoteDetail>(`${endpoints.DAILY_NOTE}/${dailyNoteId}`, body);
  return data;
};

// 캘린더 월별 통계 조회
export const fetchCalendarStats = async (
  year: number,
  month: number,
): Promise<CalendarStatsResponse> => {
  const { data } = await apiClient.get<CalendarStatsResponse>(
    endpoints.CALENDAR_STATS,
    { params: { year, month } },
  );
  return data;
};
