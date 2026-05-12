import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  TaskDetail,
  CreateTaskRequest,
  CreateTaskResponse,
  UpdateTaskRequest,
} from "@/types/task";

interface RawTaskResponse {
  id: number;
  title: string;
  content: string;
  schedule: {
    status: string;
    startDateTime: number[] | null;
    endDateTime: number[] | null;
  } | null;
  children?: { id: number; name: string }[];
}

function toDateTimeString(arr: number[] | null | undefined): string | null {
  if (!arr || arr.length < 3) return null;
  const [y, m, d, h = 0, min = 0, s = 0] = arr;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function mapTaskResponse(raw: RawTaskResponse): TaskDetail {
  return {
    id: String(raw.id),
    name: raw.title,
    content: raw.content ?? "",
    status: (raw.schedule?.status as TaskDetail["status"]) ?? null,
    startDateTime: toDateTimeString(raw.schedule?.startDateTime),
    endDateTime: toDateTimeString(raw.schedule?.endDateTime),
    children: raw.children?.map((c) => ({ id: String(c.id), name: c.name })),
  };
}

export const fetchTaskDetail = async (id: string): Promise<TaskDetail> => {
  const { data } = await apiClient.get<RawTaskResponse>(endpoints.TASK_DETAIL(id));
  return mapTaskResponse(data);
};

export const createTask = async (req: CreateTaskRequest): Promise<CreateTaskResponse> => {
  const { data } = await apiClient.post<number>(endpoints.TASKS, req);
  return { id: String(data), name: req.title };
};

export const updateTask = async (id: string, req: UpdateTaskRequest): Promise<void> => {
  await apiClient.patch(endpoints.TASKS, { ...req, taskId: id });
};

export const deleteTask = async (id: string): Promise<void> => {
  await apiClient.delete(endpoints.TASK_DETAIL(id));
};
