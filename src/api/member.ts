import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  MemberProfile,
  UpdateProfileRequest,
  GenerateProfileImageUploadUrlResponse,
  ProfileImageResponse,
  UpdateProfileImageRequest,
} from "@/types/member";

export const fetchMemberProfile = async (): Promise<MemberProfile> => {
  const { data } = await apiClient.get<MemberProfile>(endpoints.MEMBER_PROFILE);
  return data;
};

export const updateMemberProfile = async (req: UpdateProfileRequest): Promise<void> => {
  await apiClient.patch(endpoints.MEMBER_PROFILE, req);
};

export const fetchProfileImage = async (): Promise<ProfileImageResponse> => {
  const { data } = await apiClient.get<ProfileImageResponse>(endpoints.MEMBER_PROFILE_IMAGE);
  return data;
};

export const generateProfileImageUploadUrl = async (
  contentType: string
): Promise<GenerateProfileImageUploadUrlResponse> => {
  const { data } = await apiClient.post<GenerateProfileImageUploadUrlResponse>(
    endpoints.MEMBER_PROFILE_IMAGE_UPLOAD_URL,
    { contentType }
  );
  return data;
};

export const updateProfileImage = async (req: UpdateProfileImageRequest): Promise<void> => {
  await apiClient.patch(endpoints.MEMBER_PROFILE_IMAGE, req);
};

export const deleteProfileImage = async (): Promise<void> => {
  await apiClient.delete(endpoints.MEMBER_PROFILE_IMAGE);
};

export const uploadFileToPresignedUrl = async (presignedUrl: string, file: File): Promise<void> => {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload profile image to presigned URL");
  }
};
