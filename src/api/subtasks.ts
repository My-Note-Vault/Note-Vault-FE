import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  SubTaskDetail,
  CreateSubTaskRequest,
  CreateSubTaskResponse,
  UpdateSubTaskRequest,
} from "@/types/subtask";

export const fetchSubTaskDetail = async (id: string): Promise<SubTaskDetail> => {
  const { data } = await apiClient.get<SubTaskDetail>(endpoints.SUBTASK_DETAIL(id));
  return data;
};

export const createSubTask = async (req: CreateSubTaskRequest): Promise<CreateSubTaskResponse> => {
  const { data } = await apiClient.post<number>(endpoints.SUBTASKS, req);
  return { id: String(data), name: req.title };
};

export const updateSubTask = async (id: string, req: UpdateSubTaskRequest): Promise<void> => {
  await apiClient.patch(endpoints.SUBTASKS, { ...req, subTaskId: id });
};

export const deleteSubTask = async (id: string): Promise<void> => {
  await apiClient.delete(endpoints.SUBTASK_DETAIL(id));
};
