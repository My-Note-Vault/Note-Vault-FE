import type { TaskStatus } from "./common";

export interface TaskMetadata {
  status: TaskStatus;
  startDate: string | null;
  endDate: string | null;
}

export interface TaskDetail {
  id: string;
  name: string;
  content: string;
  metadata?: TaskMetadata;
  children?: { id: string; name: string }[];
}

export interface CreateTaskRequest {
  workSpaceId: string;
  title: string;
  content?: string;
  status?: TaskStatus;
  startDateTime?: string | null;
  endDateTime?: string | null;
}

export interface CreateTaskResponse {
  id: string;
  name: string;
}

export interface UpdateTaskRequest {
  name?: string;
  content?: string;
  metadata?: TaskMetadata;
}
