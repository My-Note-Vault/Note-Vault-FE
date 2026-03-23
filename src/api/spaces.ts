import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  SpaceDetail,
  CreateSpaceRequest,
  CreateSpaceResponse,
  UpdateSpaceRequest,
} from "@/types/space";

export const fetchSpaceDetail = async (id: string): Promise<SpaceDetail> => {
  const { data } = await apiClient.get<SpaceDetail>(endpoints.SPACE_DETAIL(id));
  return data;
};

export const createSpace = async (req: CreateSpaceRequest): Promise<CreateSpaceResponse> => {
  const { data } = await apiClient.post<CreateSpaceResponse>(endpoints.SPACES, req);
  return data;
};

export const updateSpace = async (id: string, req: Omit<UpdateSpaceRequest, "workSpaceId" | "isPublic">): Promise<void> => {
  await apiClient.patch(endpoints.SPACES, { ...req, workSpaceId: id, isPublic: false });
};

export const deleteSpace = async (id: string): Promise<void> => {
  await apiClient.delete(endpoints.SPACE_DETAIL(id));
};
