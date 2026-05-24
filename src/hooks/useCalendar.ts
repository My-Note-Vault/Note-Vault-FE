import { useQuery } from "@tanstack/react-query";
import { fetchDateEvents } from "@/api/calendar";
import { fetchDailyNoteByDate } from "@/api/documents";

export const calendarKeys = {
  dateEvents: (date: string) => ["calendar", "events", date] as const,
  dailyNoteByDate: (date: string) => ["daily-notes", "by-date", date] as const,
};

export const useDateEvents = (date: string | null) => {
  return useQuery({
    queryKey: calendarKeys.dateEvents(date!),
    queryFn: () => fetchDateEvents(date!),
    enabled: date !== null,
    staleTime: 1000 * 30,
  });
};

export const useDailyNoteByDate = (date: string | null) => {
  return useQuery({
    queryKey: calendarKeys.dailyNoteByDate(date!),
    queryFn: () => fetchDailyNoteByDate(date!),
    enabled: date !== null,
    staleTime: 1000 * 30,
    retry: false,
    throwOnError: false,
  });
};
