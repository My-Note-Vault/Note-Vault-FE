import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type { DocType } from "@/types/common";
import { authStorage } from "@/lib/authStorage";
import { ensureFreshAccessToken } from "./client";

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

export interface WorkspaceChatStreamHandlers {
  onDelta: (text: string) => void;
  onSources: (sources: WorkspaceChatSource[]) => void;
}

export async function streamWorkspaceChat(
  question: string,
  handlers: WorkspaceChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  await ensureFreshAccessToken();
  const response = await fetch(endpoints.CHAT_STREAM, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${authStorage.getAccessToken() ?? ""}`,
    },
    body: JSON.stringify({ question }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`답변 요청이 실패했습니다. (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const consume = (block: string) => {
    let eventName = "message";
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) eventName = line.slice(6).trim();
      if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
    }
    if (data.length === 0 || eventName === "start" || eventName === "done") return;
    const payload = JSON.parse(data.join("\n")) as unknown;
    if (eventName === "delta") handlers.onDelta((payload as { text: string }).text);
    if (eventName === "sources") handlers.onSources(payload as WorkspaceChatSource[]);
    if (eventName === "error") throw new Error((payload as { message?: string }).message);
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replaceAll("\r\n", "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      consume(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
    if (done) break;
  }
  if (buffer.trim()) consume(buffer);
}
