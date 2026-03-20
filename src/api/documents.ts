import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  SidebarItem,
  SearchResult,
  CalendarStatsResponse,
} from "@/types/common";

// DailyNote 상세 타입
export interface DailyNoteDetail {
  id: string;
  name: string;
  content: string;
}

// 통합 트리 조회 (사이드바용)
export const fetchDocumentTree = async (): Promise<SidebarItem[]> => {
  const { data } = await apiClient.get<SidebarItem[]>(endpoints.DOCUMENT_TREE);
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
  const { data } = await apiClient.get<SidebarItem>(endpoints.DAILY_NOTES);
  return data;
};

// Daily Note 상세 조회
export const fetchDailyNoteDetail = async (date: string): Promise<DailyNoteDetail> => {
  const { data } = await apiClient.get<DailyNoteDetail>(endpoints.DAILY_NOTE_DETAIL(date));
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
