import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  SubTaskDetail,
  CreateSubTaskRequest,
  CreateSubTaskResponse,
  UpdateSubTaskRequest,
} from "@/types/subtask";

function toDateString(arr: number[] | null | undefined): string | null {
  if (!arr || arr.length < 3) return null;
  const [y, m, d, h = 0, min = 0, s = 0] = arr;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const fetchSubTaskDetail = async (id: string): Promise<SubTaskDetail> => {
  const { data } = await apiClient.get(endpoints.SUBTASK_DETAIL(id));
  return {
    id: String(data.id),
    name: data.title,
    content: data.content ?? "",
    status: data.schedule?.status ?? "NOT_STARTED",
    startDate: toDateString(data.schedule?.startDateTime),
    endDate: toDateString(data.schedule?.endDateTime),
    children: data.children,
  };
};

export const createSubTask = async (req: CreateSubTaskRequest): Promise<CreateSubTaskResponse> => {
  const { data } = await apiClient.post<number>(endpoints.SUBTASKS, req);
  return { id: String(data), name: req.title };
};

export const updateSubTask = async (id: string, req: UpdateSubTaskRequest): Promise<void> => {
  const { name, content, status, startDate, endDate } = req;
  const body: Record<string, unknown> = { subTaskId: id };
  if (name !== undefined) body.title = name;
  if (content !== undefined) body.content = content;
  if (status !== undefined) body.status = status;
  if (startDate !== undefined) body.startDateTime = startDate;
  if (endDate !== undefined) body.endDateTime = endDate;
  await apiClient.patch(endpoints.SUBTASKS, body);
};

export const deleteSubTask = async (id: string): Promise<void> => {
  await apiClient.delete(endpoints.SUBTASK_DETAIL(id));
};
