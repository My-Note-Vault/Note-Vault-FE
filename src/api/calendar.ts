import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type { DateEventResponse } from "@/types/calendar";

export const fetchDateEvents = async (date: string): Promise<DateEventResponse[]> => {
  const { data } = await apiClient.get<DateEventResponse[]>(endpoints.CALENDAR_EVENTS, {
    params: { date },
  });
  return data;
};
