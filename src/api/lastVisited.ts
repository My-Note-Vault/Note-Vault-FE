import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type { DocType } from "@/types/common";

export const fetchLastVisited = async (): Promise<string | null> => {
  try {
    const { data } = await apiClient.get<string>(endpoints.LAST_VISITED);
    return data;
  } catch {
    return null;
  }
};

export const updateLastVisited = async (path: string): Promise<void> => {
  await apiClient.put(endpoints.LAST_VISITED, { path });
};

const PATH_TO_DOCTYPE: Record<string, DocType> = {
  workspaces: "space",
  tasks: "task",
  subtasks: "subtask",
  trivia: "trivia",
};

const DOCTYPE_TO_PATH: Record<DocType, string> = {
  space: "workspaces",
  task: "tasks",
  subtask: "subtasks",
  trivia: "trivia",
};

export function pathToTabId(path: string): string {
  const trimmed = path.replace(/^\/api\/v1\//, "");

  if (trimmed === "daily-notes") return "daily-note";

  const dailyMatch = trimmed.match(/^daily-notes\/(.+)$/);
  if (dailyMatch) return `daily-${dailyMatch[1]}`;

  for (const [segment] of Object.entries(PATH_TO_DOCTYPE)) {
    const match = trimmed.match(new RegExp(`^${segment}/(.+)$`));
    if (match) return match[1];
  }

  return path;
}

export function tabIdToPath(id: string, docType?: DocType): string {
  const dailyPkMatch = id.match(/^daily-(\d+)$/);
  if (dailyPkMatch) return `/api/v1/daily-notes/${dailyPkMatch[1]}`;

  if (id === "daily-note") return "/api/v1/daily-notes";

  if (docType) {
    const segment = DOCTYPE_TO_PATH[docType];
    if (segment) return `/api/v1/${segment}/${id}`;
  }

  return `/api/v1/${id}`;
}
