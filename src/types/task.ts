import type { TaskStatus } from "./common";

export interface TaskDetail {
  id: string;
  name: string;
  status: TaskStatus | null;
  startDateTime: string | null;
  endDateTime: string | null;
  children?: { id: string; name: string }[];
}

export interface CreateTaskRequest {
  workSpaceId: string;
  title: string;
  status?: TaskStatus;
  startDateTime?: string | null;
  endDateTime?: string | null;
}

export interface CreateTaskResponse {
  id: string;
  name: string;
}

export interface UpdateTaskRequest {
  title?: string;
  status?: TaskStatus;
  startDateTime?: string | null;
  endDateTime?: string | null;
}
