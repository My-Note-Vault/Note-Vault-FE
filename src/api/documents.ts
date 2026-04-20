import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  NoteInfo,
  UnfoldedNote,
  SearchResult,
  CalendarStatsResponse,
} from "@/types/common";

// DailyNote 아이템 타입
export interface DailyNoteItem {
  id: number;
  type: "PENDING" | "TODO";
  content: string;
  completed: boolean;
}

// DailyNote 상세 타입
export interface DailyNoteDetail {
  dailyNoteId: number;
  date: string;
  logicalDate: string;
  items: DailyNoteItem[];
  content: string;
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

// Daily Notes 목록 조회
export const fetchDailyNotes = async (): Promise<DailyNoteDetail[]> => {
  const { data } = await apiClient.get<DailyNoteDetail[]>(endpoints.DAILY_NOTES_ALL);
  return data;
};

// Daily Note 상세 조회 (오늘 날짜 기준)
export const fetchDailyNoteDetail = async (): Promise<DailyNoteDetail> => {
  const { data } = await apiClient.get<DailyNoteDetail>(endpoints.DAILY_NOTE);
  return data;
};

// Daily Note PK로 조회
export const fetchDailyNoteByPk = async (pk: number): Promise<DailyNoteDetail> => {
  const { data } = await apiClient.get<DailyNoteDetail>(endpoints.DAILY_NOTE_DETAIL(pk));
  return data;
};

// Daily Note 날짜로 조회
export const fetchDailyNoteByDate = async (date: string): Promise<DailyNoteDetail> => {
  const { data } = await apiClient.get<DailyNoteDetail>(endpoints.DAILY_NOTE_DETAIL(date));
  return data;
};

// Daily Note content 수정
export const updateDailyNote = async (
  dailyNoteId: number,
  body: { content: string },
): Promise<DailyNoteDetail> => {
  const { data } = await apiClient.patch<DailyNoteDetail>(`${endpoints.DAILY_NOTE}/${dailyNoteId}`, body);
  return data;
};

// Daily Note 아이템 추가
export const addDailyNoteItem = async (
  dailyNoteId: number,
  body: { type: "PENDING" | "TODO"; content: string },
): Promise<DailyNoteItem> => {
  const { data } = await apiClient.post<DailyNoteItem>(endpoints.DAILY_NOTE_ITEMS(dailyNoteId), body);
  return data;
};

// Daily Note 아이템 수정 (완료 토글, 타입 변경, 내용 수정)
export const updateDailyNoteItem = async (
  dailyNoteId: number,
  itemId: number,
  body: Partial<Pick<DailyNoteItem, "type" | "content" | "completed">>,
): Promise<DailyNoteItem> => {
  const { data } = await apiClient.patch<DailyNoteItem>(endpoints.DAILY_NOTE_ITEM(dailyNoteId, itemId), body);
  return data;
};

// Daily Note 삭제
export const deleteDailyNote = async (dailyNoteId: number): Promise<void> => {
  await apiClient.delete(endpoints.DAILY_NOTE_DETAIL(dailyNoteId));
};

// Daily Note 아이템 삭제
export const deleteDailyNoteItem = async (
  dailyNoteId: number,
  itemId: number,
): Promise<void> => {
  await apiClient.delete(endpoints.DAILY_NOTE_ITEM(dailyNoteId, itemId));
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
