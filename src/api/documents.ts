import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  NoteInfo,
  UnfoldedNote,
  SearchResult,
  CalendarStatsResponse,
} from "@/types/common";

// DailyNote Plan 타입
export interface DailyNotePlan {
  id: number;
  type: "PENDING" | "TODO";
  content: string;
  isDone: boolean;
}

// DailyNote 상세 타입
export interface DailyNoteDetail {
  dailyNoteId: number;
  date: string;
  logicalDate: number[]; // [year, month, day] from Java LocalDate
  plans: DailyNotePlan[];
  content: string;
}

// logicalDate 배열을 YYYY-MM-DD 문자열로 변환
export function formatLogicalDate(logicalDate: number[]): string {
  const [y, m, d] = logicalDate;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
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

// Daily Note 삭제
export const deleteDailyNote = async (dailyNoteId: number): Promise<void> => {
  await apiClient.delete(endpoints.DAILY_NOTE_DETAIL(dailyNoteId));
};

// Plan 타입
export interface PlanResponse {
  planId: number;
  type: "TODO" | "PENDING";
  content: string;
}

// Plan 추가
export const addPlan = async (
  dailyNoteId: number,
  body: { type: "TODO" | "PENDING"; content: string },
): Promise<number> => {
  const { data } = await apiClient.post<number>(endpoints.DAILY_NOTE_PLANS(dailyNoteId), body);
  return data;
};

// Plan 수정
export const updatePlan = async (
  dailyNoteId: number,
  body: { planId: number; type?: "TODO" | "PENDING"; content?: string; isDone?: boolean },
): Promise<void> => {
  await apiClient.patch(endpoints.DAILY_NOTE_PLANS(dailyNoteId), body);
};

// Plan 삭제
export const deletePlan = async (
  dailyNoteId: number,
  body: { planId: number },
): Promise<void> => {
  await apiClient.delete(endpoints.DAILY_NOTE_PLANS(dailyNoteId), { data: body });
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
