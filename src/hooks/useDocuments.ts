import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  fetchNoteInfoList,
  fetchUnfoldedNotes,
  searchDocuments,
  fetchDailyNotes,
  fetchDailyNoteByPk,
  updateDailyNote,
  deleteDailyNote,
  fetchCalendarStats,
  addPlan,
  updatePlan,
  deletePlan,
} from "@/api/documents";
import type { DailyNoteDetail } from "@/api/documents";
import type { TaskOverview, UnfoldedNote, SidebarItem, DocType } from "@/types/common";

// localStorage 캐시 키
const NOTES_CACHE_KEY = "sidebar_notes";
const NOTES_CACHE_TS_KEY = "sidebar_notes_ts";
const UNFOLDED_CACHE_KEY = "sidebar_unfolded";
const UNFOLDED_CACHE_TS_KEY = "sidebar_unfolded_ts";
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

// TaskOverview[] → SidebarItem[] 변환
function buildTree(overviews: TaskOverview[]): SidebarItem[] {
  return overviews.map((task) => ({
    id: String(task.id),
    name: task.title,
    type: "task" as DocType,
    children: (task.subTaskSummaries ?? []).map((sub) => ({
      id: String(sub.id),
      name: sub.title,
      type: "subtask" as DocType,
      children: (sub.triviaSummaries ?? []).map((trivia) => ({
        id: String(trivia.id),
        name: trivia.title,
        type: "trivia" as DocType,
        children: [],
      })),
    })),
  }));
}

// UnfoldedNote[] → Set<string> (펼쳐진 노트 ID 집합)
function buildUnfoldedSet(unfoldedNotes: UnfoldedNote[]): Set<string> {
  return new Set(unfoldedNotes.map((n) => String(n.noteId)));
}

// Query key 팩토리
export const documentKeys = {
  all: ["documents"] as const,
  noteInfos: (workspaceId?: number | null) => [...documentKeys.all, "note-info", workspaceId] as const,
  unfolded: () => [...documentKeys.all, "unfolded"] as const,
  search: (query: string) => [...documentKeys.all, "search", query] as const,
  dailyNotes: () => ["daily-notes"] as const,
  dailyNoteDetail: (pk: number) => ["daily-notes", "detail", pk] as const,
  calendarStats: (year: number, month: number) =>
    [...documentKeys.all, "calendar-stats", year, month] as const,
};

// 사이드바 데이터 (noteInfos + unfolded) 동시 invalidate
export function invalidateSidebar(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: [...documentKeys.all, "note-info"] });
  qc.invalidateQueries({ queryKey: documentKeys.unfolded() });
}

// 사이드바 트리 조회 — workspace별 TaskOverview 계층 구조
export const useDocumentTree = (workspaceId: number | null) => {
  const noteInfoQuery = useQuery({
    queryKey: documentKeys.noteInfos(workspaceId),
    queryFn: () => fetchNoteInfoList(workspaceId!),
    enabled: workspaceId !== null,
    staleTime: 1000 * 60,
    initialData: () => {
      const cached = readCache<TaskOverview[]>(NOTES_CACHE_KEY);
      // 이전 NoteInfo 형식 캐시 무시
      if (cached && cached.length > 0 && !("title" in cached[0])) return undefined;
      return cached;
    },
    initialDataUpdatedAt: () =>
      Number(localStorage.getItem(NOTES_CACHE_TS_KEY)) || undefined,
  });

  const unfoldedQuery = useQuery({
    queryKey: documentKeys.unfolded(),
    queryFn: fetchUnfoldedNotes,
    staleTime: 1000 * 60,
    initialData: () => readCache<UnfoldedNote[]>(UNFOLDED_CACHE_KEY),
    initialDataUpdatedAt: () =>
      Number(localStorage.getItem(UNFOLDED_CACHE_TS_KEY)) || undefined,
  });

  // localStorage 캐시 저장
  useEffect(() => {
    if (noteInfoQuery.data && noteInfoQuery.dataUpdatedAt && !noteInfoQuery.isPlaceholderData) {
      writeCache(NOTES_CACHE_KEY, NOTES_CACHE_TS_KEY, noteInfoQuery.data);
    }
  }, [noteInfoQuery.data, noteInfoQuery.dataUpdatedAt, noteInfoQuery.isPlaceholderData]);

  useEffect(() => {
    if (unfoldedQuery.data && unfoldedQuery.dataUpdatedAt && !unfoldedQuery.isPlaceholderData) {
      writeCache(UNFOLDED_CACHE_KEY, UNFOLDED_CACHE_TS_KEY, unfoldedQuery.data);
    }
  }, [unfoldedQuery.data, unfoldedQuery.dataUpdatedAt, unfoldedQuery.isPlaceholderData]);

  const docs = useMemo(
    () => (noteInfoQuery.data ? buildTree(noteInfoQuery.data) : []),
    [noteInfoQuery.data],
  );

  const unfoldedIds = useMemo(
    () => (unfoldedQuery.data ? buildUnfoldedSet(unfoldedQuery.data) : new Set<string>()),
    [unfoldedQuery.data],
  );

  return {
    data: docs,
    unfoldedIds,
    isLoading: noteInfoQuery.isLoading || unfoldedQuery.isLoading,
  };
};

// Daily Notes 목록 조회 — localStorage 캐시 우선 로드
export const useDailyNotes = () => {
  const query = useQuery({
    queryKey: documentKeys.dailyNotes(),
    queryFn: fetchDailyNotes,
    staleTime: 1000 * 60 * 5,
    initialData: () => readCache<DailyNoteDetail[]>(DAILY_CACHE_KEY),
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

// Daily Note 상세 조회 (PK 기반)
export const useDailyNoteDetail = (pk: number | null) => {
  return useQuery({
    queryKey: documentKeys.dailyNoteDetail(pk!),
    queryFn: () => fetchDailyNoteByPk(pk!),
    enabled: pk !== null,
    staleTime: 1000 * 30,
  });
};

type UpdateDailyNoteRequest = {
  dailyNoteId: number;
  body: { content: string };
};

// Daily Note 삭제
export const useDeleteDailyNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dailyNoteId: number) => deleteDailyNote(dailyNoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.dailyNotes() });
    },
  });
};

// Daily Note content 수정
export const useUpdateDailyNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({dailyNoteId, body}: UpdateDailyNoteRequest) =>
      updateDailyNote(dailyNoteId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.dailyNotes() });
    },
  });
};

// Plan 추가
export const useAddPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dailyNoteId, body }: { dailyNoteId: number; body: { type: "TODO" | "PENDING"; content: string } }) =>
      addPlan(dailyNoteId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.dailyNoteDetail(variables.dailyNoteId) });
    },
  });
};

// Plan 수정
export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dailyNoteId, body }: {
      dailyNoteId: number;
      body: { planId: number; type?: "TODO" | "PENDING"; content?: string; isDone?: boolean };
    }) => updatePlan(dailyNoteId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.dailyNoteDetail(variables.dailyNoteId) });
    },
  });
};

// Plan 삭제
export const useDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dailyNoteId, planId }: { dailyNoteId: number; planId: number }) =>
      deletePlan(dailyNoteId, { planId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.dailyNoteDetail(variables.dailyNoteId) });
    },
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
