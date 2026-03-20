import { useQuery } from "@tanstack/react-query";
import {
  fetchDocumentTree,
  searchDocuments,
  fetchDailyNotes,
  fetchDailyNoteDetail,
  fetchCalendarStats,
} from "@/api/documents";

// Query key 팩토리
export const documentKeys = {
  all: ["documents"] as const,
  tree: () => [...documentKeys.all, "tree"] as const,
  search: (query: string) => [...documentKeys.all, "search", query] as const,
  dailyNotes: () => ["daily-notes"] as const,
  dailyNoteDetail: (date: string) => ["daily-notes", "detail", date] as const,
  calendarStats: (year: number, month: number) =>
    [...documentKeys.all, "calendar-stats", year, month] as const,
};

// 통합 트리 조회 (사이드바)
export const useDocumentTree = () => {
  return useQuery({
    queryKey: documentKeys.tree(),
    queryFn: fetchDocumentTree,
    staleTime: 1000 * 60,
  });
};

// Daily Notes 트리 조회
export const useDailyNotes = () => {
  return useQuery({
    queryKey: documentKeys.dailyNotes(),
    queryFn: fetchDailyNotes,
    staleTime: 1000 * 60 * 5,
  });
};

// Daily Note 상세 조회
export const useDailyNoteDetail = (date: string | null) => {
  return useQuery({
    queryKey: documentKeys.dailyNoteDetail(date!),
    queryFn: () => fetchDailyNoteDetail(date!),
    enabled: !!date,
    staleTime: 1000 * 30,
  });
};

// 통합 검색
export const useSearchDocuments = (query: string) => {
  return useQuery({
    queryKey: documentKeys.search(query),
    queryFn: ({ signal }) => searchDocuments(query, signal),
    enabled: query.length > 0,
    staleTime: 1000 * 10,
  });
};

// 캘린더 월별 통계 조회
export const useCalendarStats = (year: number, month: number) => {
  return useQuery({
    queryKey: documentKeys.calendarStats(year, month),
    queryFn: () => fetchCalendarStats(year, month),
    staleTime: 1000 * 60 * 2,
  });
};
