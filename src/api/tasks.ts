import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  TaskDetail,
  CreateTaskRequest,
  CreateTaskResponse,
  UpdateTaskRequest,
} from "@/types/task";

export const fetchTaskDetail = async (id: string): Promise<TaskDetail> => {
  const { data } = await apiClient.get<TaskDetail>(endpoints.TASK_DETAIL(id));
  return data;
};

export const createTask = async (req: CreateTaskRequest): Promise<CreateTaskResponse> => {
  const { data } = await apiClient.post<number>(endpoints.TASKS, req);
  return { id: String(data), name: req.name };
};

export const updateTask = async (id: string, req: UpdateTaskRequest): Promise<void> => {
  await apiClient.patch(endpoints.TASKS, { ...req, workSpaceId: id });
};

export const deleteTask = async (id: string): Promise<void> => {
  await apiClient.delete(endpoints.TASK_DETAIL(id));
};
