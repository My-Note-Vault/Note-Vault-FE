import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type { DocType } from "@/types/common";

export interface WorkspaceChatSource {
  number: number;
  chunkId: number;
  sourceType: "DOCUMENT" | "DAILY_NOTE";
  resourceId: number;
  resourceType: DocType | "daily";
  title: string;
  similarity: number;
  excerpt: string;
}

export interface WorkspaceChatResponse {
  status: "ANSWERED" | "NO_CONTEXT";
  answer: string;
  sources: WorkspaceChatSource[];
}

export async function askWorkspaceChat(question: string): Promise<WorkspaceChatResponse> {
  const { data } = await apiClient.post<WorkspaceChatResponse>(
    endpoints.CHAT,
    { question },
  );
  return data;
}
