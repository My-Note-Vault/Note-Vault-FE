import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  fetchNoteInfoList,
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
import { noteTypeToDocType, sidebarUnfoldedId } from "@/types/common";
import type { TaskOverview, SidebarItem, DocType, NoteType } from "@/types/common";

// localStorage 캐시 키
const NOTES_CACHE_KEY = "sidebar_notes";
const NOTES_CACHE_TS_KEY = "sidebar_notes_ts";
const UNFOLDED_CACHE_KEY = "sidebar_unfolded";
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

function unfoldedStorageKey(workspaceId: number | null): string {
  return workspaceId === null ? UNFOLDED_CACHE_KEY : `${UNFOLDED_CACHE_KEY}:${workspaceId}`;
}

function isLegacyUnfoldedNote(value: unknown): value is { type: NoteType; noteId: number } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { type?: unknown; noteId?: unknown };
  return typeof candidate.type === "string" && typeof candidate.noteId === "number";
}

function normalizeUnfoldedIds(value: unknown): Set<string> {
  if (!Array.isArray(value)) return new Set();

  return new Set(
    value
      .map((item) => {
        if (typeof item === "string") return item;
        if (isLegacyUnfoldedNote(item)) {
          return sidebarUnfoldedId(noteTypeToDocType(item.type), item.noteId);
        }
        return null;
      })
      .filter((item): item is string => item !== null),
  );
}

function readUnfoldedIds(workspaceId: number | null): Set<string> {
  try {
    const scopedRaw = localStorage.getItem(unfoldedStorageKey(workspaceId));
    if (scopedRaw !== null) return normalizeUnfoldedIds(JSON.parse(scopedRaw));
  } catch {
    return new Set();
  }

  const legacy = readCache<unknown>(UNFOLDED_CACHE_KEY);
  return normalizeUnfoldedIds(legacy);
}

function writeUnfoldedIds(workspaceId: number | null, ids: Set<string>) {
  try {
    localStorage.setItem(unfoldedStorageKey(workspaceId), JSON.stringify([...ids]));
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

// Query key 팩토리
export const documentKeys = {
  all: ["documents"] as const,
  noteInfos: (workspaceId?: number | null) => [...documentKeys.all, "note-info", workspaceId] as const,
  search: (query: string) => [...documentKeys.all, "search", query] as const,
  dailyNotes: () => ["daily-notes"] as const,
  dailyNoteDetail: (pk: number) => ["daily-notes", "detail", pk] as const,
  calendarStats: (year: number, month: number) =>
    [...documentKeys.all, "calendar-stats", year, month] as const,
};

// 사이드바 문서 트리 invalidate
export function invalidateSidebar(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: [...documentKeys.all, "note-info"] });
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

  const [unfoldedIds, setUnfoldedIds] = useState<Set<string>>(() => readUnfoldedIds(workspaceId));

  useEffect(() => {
    setUnfoldedIds(readUnfoldedIds(workspaceId));
  }, [workspaceId]);

  // localStorage 캐시 저장
  useEffect(() => {
    if (noteInfoQuery.data && noteInfoQuery.dataUpdatedAt && !noteInfoQuery.isPlaceholderData) {
      writeCache(NOTES_CACHE_KEY, NOTES_CACHE_TS_KEY, noteInfoQuery.data);
    }
  }, [noteInfoQuery.data, noteInfoQuery.dataUpdatedAt, noteInfoQuery.isPlaceholderData]);

  const docs = useMemo(
    () => (noteInfoQuery.data ? buildTree(noteInfoQuery.data) : []),
    [noteInfoQuery.data],
  );

  const setUnfolded = useCallback((noteId: string, docType: DocType, expanded: boolean) => {
    if (docType === "space") return;

    setUnfoldedIds((prev) => {
      const next = new Set(prev);
      const key = sidebarUnfoldedId(docType, noteId);
      if (expanded) {
        next.add(key);
      } else {
        next.delete(key);
      }
      writeUnfoldedIds(workspaceId, next);
      return next;
    });
  }, [workspaceId]);

  return {
    data: docs,
    unfoldedIds,
    setUnfolded,
    isLoading: noteInfoQuery.isLoading,
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
    onSuccess: (updatedDailyNote, variables) => {
      queryClient.setQueryData(
        documentKeys.dailyNoteDetail(variables.dailyNoteId),
        updatedDailyNote,
      );

      queryClient.setQueryData<DailyNoteDetail[] | undefined>(
        documentKeys.dailyNotes(),
        (current) => {
          if (!current) return current;

          return current.map((note) =>
            note.dailyNoteId === updatedDailyNote.dailyNoteId
              ? { ...note, content: updatedDailyNote.content }
              : note,
          );
        },
      );
    },
  });
};

// Plan 추가
export const useAddPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dailyNoteId, body }: { dailyNoteId: number; body: { type: "TODO" | "PENDING"; content: string } }) =>
      addPlan(dailyNoteId, body),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: documentKeys.dailyNoteDetail(variables.dailyNoteId) });

      const previous = queryClient.getQueryData<DailyNoteDetail>(
        documentKeys.dailyNoteDetail(variables.dailyNoteId),
      );

      if (previous) {
        queryClient.setQueryData<DailyNoteDetail>(
          documentKeys.dailyNoteDetail(variables.dailyNoteId),
          {
            ...previous,
            plans: [
              ...previous.plans,
              {
                planId: -Date.now(),
                type: variables.body.type,
                content: variables.body.content,
                isDone: false,
              },
            ],
          },
        );
      }

      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          documentKeys.dailyNoteDetail(variables.dailyNoteId),
          context.previous,
        );
      }
    },
    onSettled: (_data, _error, variables) => {
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
