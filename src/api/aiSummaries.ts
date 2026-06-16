import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";

export const AI_SUMMARY_MAX_CONTENT_LENGTH = 24000;

export interface AiSummaryRequest {
  title?: string;
  sectionTitle?: string;
  content: string;
}

export interface AiSummaryResponse {
  summary: string;
  remainingToday: number;
}

export async function summarizeMarkdown(
  request: AiSummaryRequest,
): Promise<AiSummaryResponse> {
  const { data } = await apiClient.post<AiSummaryResponse>(
    endpoints.AI_SUMMARIES,
    request,
  );
  return data;
}
