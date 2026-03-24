import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDocumentTree,
  searchDocuments,
  fetchDailyNotes,
  fetchDailyNoteDetail,
  fetchCalendarStats,
} from "@/api/documents";
import type { SidebarItem } from "@/types/common";

// localStorage 캐시 키
const TREE_CACHE_KEY = "sidebar_tree";
const TREE_CACHE_TS_KEY = "sidebar_tree_ts";
const DAILY_CACHE_KEY = "sidebar_daily";
const DAILY_CACHE_TS_KEY = "sidebar_daily_ts";

function readCache<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, tsKey: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(tsKey, String(Date.now()));
  } catch { /* quota exceeded 등 무시 */ }
}

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

// 통합 트리 조회 (사이드바) — localStorage 캐시 우선 로드
export const useDocumentTree = () => {
  const query = useQuery({
    queryKey: documentKeys.tree(),
    queryFn: fetchDocumentTree,
    staleTime: 1000 * 60,
    initialData: () => readCache<SidebarItem[]>(TREE_CACHE_KEY),
    initialDataUpdatedAt: () =>
      Number(localStorage.getItem(TREE_CACHE_TS_KEY)) || undefined,
  });

  useEffect(() => {
    if (query.data && query.dataUpdatedAt && !query.isPlaceholderData) {
      writeCache(TREE_CACHE_KEY, TREE_CACHE_TS_KEY, query.data);
    }
  }, [query.data, query.dataUpdatedAt, query.isPlaceholderData]);

  return query;
};

// Daily Notes 트리 조회 — localStorage 캐시 우선 로드
export const useDailyNotes = () => {
  const query = useQuery({
    queryKey: documentKeys.dailyNotes(),
    queryFn: fetchDailyNotes,
    staleTime: 1000 * 60 * 5,
    initialData: () => readCache<SidebarItem>(DAILY_CACHE_KEY),
    initialDataUpdatedAt: () =>
      Number(localStorage.getItem(DAILY_CACHE_TS_KEY)) || undefined,
  });

  useEffect(() => {
    if (query.data && query.dataUpdatedAt && !query.isPlaceholderData) {
      writeCache(DAILY_CACHE_KEY, DAILY_CACHE_TS_KEY, query.data);
    }
  }, [query.data, query.dataUpdatedAt, query.isPlaceholderData]);

  return query;
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
