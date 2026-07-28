import type { TaskStatus } from "./common";

export interface SubTaskMetadata {
  status: TaskStatus;
  startDate: string | null;
  endDate: string | null;
}

export interface SubTaskDetail {
  id: string;
  name: string;
  status?: TaskStatus;
  startDate?: string | null;
  endDate?: string | null;
  children?: { id: string; name: string }[];
}

export interface CreateSubTaskRequest {
  taskId: string;
  title: string;
  startDateTime?: string | null;
  endDateTime?: string | null;
  status?: TaskStatus;
}

export interface CreateSubTaskResponse {
  id: string;
  name: string;
}

export interface UpdateSubTaskRequest {
  title?: string;
  status?: TaskStatus;
  startDateTime?: string | null;
  endDateTime?: string | null;
}
