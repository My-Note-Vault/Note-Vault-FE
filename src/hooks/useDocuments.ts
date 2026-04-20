import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNoteInfoList,
  fetchUnfoldedNotes,
  searchDocuments,
  fetchDailyNotes,
  fetchDailyNoteByPk,
  updateDailyNote,
  deleteDailyNote,
  addDailyNoteItem,
  updateDailyNoteItem,
  deleteDailyNoteItem,
  fetchCalendarStats,
} from "@/api/documents";
import type { DailyNoteDetail, DailyNoteItem } from "@/api/documents";
import type { NoteInfo, UnfoldedNote, SidebarItem } from "@/types/common";
import { noteTypeToDocType } from "@/types/common";

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

// flat NoteInfo[] → SidebarItem[] 트리 구성
function buildTree(notes: NoteInfo[]): SidebarItem[] {
  const map = new Map<number, SidebarItem & { _parentId: number | null }>();

  for (const note of notes) {
    map.set(note.id, {
      id: String(note.id),
      name: note.title,
      type: noteTypeToDocType(note.type),
      children: [],
      _parentId: note.parentId,
    });
  }

  const roots: SidebarItem[] = [];
  for (const [, item] of map) {
    if (item._parentId === null) {
      roots.push(item);
    } else {
      map.get(item._parentId)?.children?.push(item);
    }
    delete (item as any)._parentId;
  }
  return roots;
}

// UnfoldedNote[] → Set<string> (펼쳐진 노트 ID 집합)
function buildUnfoldedSet(unfoldedNotes: UnfoldedNote[]): Set<string> {
  return new Set(unfoldedNotes.map((n) => String(n.noteId)));
}

// Query key 팩토리
export const documentKeys = {
  all: ["documents"] as const,
  noteInfos: () => [...documentKeys.all, "note-info"] as const,
  unfolded: () => [...documentKeys.all, "unfolded"] as const,
  search: (query: string) => [...documentKeys.all, "search", query] as const,
  dailyNotes: () => ["daily-notes"] as const,
  dailyNoteDetail: (pk: number) => ["daily-notes", "detail", pk] as const,
  calendarStats: (year: number, month: number) =>
    [...documentKeys.all, "calendar-stats", year, month] as const,
};

// 사이드바 트리 조회 — note-info flat list를 받아 클라이언트에서 트리 구성
export const useDocumentTree = () => {
  const noteInfoQuery = useQuery({
    queryKey: documentKeys.noteInfos(),
    queryFn: fetchNoteInfoList,
    staleTime: 1000 * 60,
    initialData: () => readCache<NoteInfo[]>(NOTES_CACHE_KEY),
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

// Daily Note 아이템 추가
export const useAddDailyNoteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dailyNoteId, body }: { dailyNoteId: number; body: { type: "PENDING" | "TODO"; content: string } }) =>
      addDailyNoteItem(dailyNoteId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.dailyNoteDetail(variables.dailyNoteId) });
    },
  });
};

// Daily Note 아이템 수정 (완료 토글, 타입 변경, 내용 수정)
export const useUpdateDailyNoteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dailyNoteId, itemId, body }: {
      dailyNoteId: number;
      itemId: number;
      body: Partial<Pick<DailyNoteItem, "type" | "content" | "completed">>;
    }) => updateDailyNoteItem(dailyNoteId, itemId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.dailyNoteDetail(variables.dailyNoteId) });
    },
  });
};

// Daily Note 아이템 삭제
export const useDeleteDailyNoteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dailyNoteId, itemId }: { dailyNoteId: number; itemId: number }) =>
      deleteDailyNoteItem(dailyNoteId, itemId),
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
