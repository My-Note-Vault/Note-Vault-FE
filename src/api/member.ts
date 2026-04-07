import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  MemberProfile,
  UpdateProfileRequest,
  PresignedUrlResponse,
} from "@/types/member";

export const fetchMemberProfile = async (): Promise<MemberProfile> => {
  const { data } = await apiClient.get<MemberProfile>(endpoints.MEMBER_PROFILE);
  return data;
};

export const updateMemberProfile = async (req: UpdateProfileRequest): Promise<void> => {
  await apiClient.post(endpoints.MEMBER_PROFILE, req);
};

export const getPresignedUrl = async (fileName: string, contentType: string): Promise<PresignedUrlResponse> => {
  const { data } = await apiClient.post<PresignedUrlResponse>(endpoints.FILES, { fileName, contentType });
  return data;
};

export const uploadFileToPresignedUrl = async (presignedUrl: string, file: File): Promise<void> => {
  await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
};
