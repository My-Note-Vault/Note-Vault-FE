import type { TaskStatus } from "./common";

export interface SubTaskMetadata {
  status: TaskStatus;
  startDate: string | null;
  endDate: string | null;
}

export interface SubTaskDetail {
  id: string;
  name: string;
  content: string;
  metadata?: SubTaskMetadata;
  children?: { id: string; name: string }[];
}

export interface CreateSubTaskRequest {
  taskId: string;
  title: string;
  content?: string;
  startDateTime?: string | null;
  endDateTime?: string | null;
  status?: TaskStatus;
}

export interface CreateSubTaskResponse {
  id: string;
  name: string;
}

export interface UpdateSubTaskRequest {
  name?: string;
  content?: string;
  metadata?: SubTaskMetadata;
}
