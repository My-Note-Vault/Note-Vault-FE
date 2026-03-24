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
  const { data } = await apiClient.post<CreateSubTaskResponse>(endpoints.SUBTASKS, req);
  return data;
};

export const updateSubTask = async (id: string, req: UpdateSubTaskRequest): Promise<void> => {
  await apiClient.patch(endpoints.SUBTASKS, { ...req, workSpaceId: id });
};

export const deleteSubTask = async (id: string): Promise<void> => {
  await apiClient.delete(endpoints.SUBTASK_DETAIL(id));
};
