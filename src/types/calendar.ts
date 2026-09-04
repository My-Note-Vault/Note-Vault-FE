import type { TaskStatus } from "./common";

export interface ParentTask {
  id: number;
  title: string;
  status: TaskStatus;
  startDate: string | null;
  endDate: string | null;
}

export interface DateEventResponse {
  type: "TASK";
  id: number;
  title: string;
  status: TaskStatus;
  startDate: string | null;
  endDate: string | null;
  parentTask: ParentTask | null;
}
