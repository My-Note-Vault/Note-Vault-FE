import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import {
  uploadFileWithProgress,
  type UploadProgressHandler,
} from "@/api/uploadProgress";

export type ContentImageTarget =
  | "daily-note"
  | "workspace"
  | "task"
  | "subtask"
  | "note"
  | "trivia";

export interface GenerateContentImageUploadUrlResponse {
  presignedUrl: string;
  key: string;
}

export interface ContentImageAccessResponse {
  cloudFrontEnabled: boolean;
  cdnBaseUrl: string;
  expiresInSeconds: number;
}

export interface ContentImageUrlResponse {
  presignedUrl: string;
  key: string;
}

export const generateContentImageUploadUrl = async (
  targetType: ContentImageTarget,
  contentType: string,
): Promise<GenerateContentImageUploadUrlResponse> => {
  const { data } = await apiClient.post<GenerateContentImageUploadUrlResponse>(
    endpoints.CONTENT_IMAGE_UPLOAD_URL,
    { targetType, contentType },
  );
  return data;
};

export const issueContentImageCookies = async (): Promise<ContentImageAccessResponse> => {
  const { data } = await apiClient.get<ContentImageAccessResponse>(
    endpoints.CONTENT_IMAGE_COOKIES,
  );
  return data;
};

export const fetchContentImageUrl = async (
  key: string,
): Promise<ContentImageUrlResponse> => {
  const { data } = await apiClient.get<ContentImageUrlResponse>(
    endpoints.CONTENT_IMAGE_URL,
    { params: { key } },
  );
  return data;
};

export const uploadContentImage = async (
  file: File,
  targetType: ContentImageTarget,
  onProgress?: UploadProgressHandler,
): Promise<string> => {
  const contentType = normalizeImageContentType(file.type);
  const { presignedUrl, key } = await generateContentImageUploadUrl(
    targetType,
    contentType,
  );

  try {
    await uploadFileWithProgress({
      presignedUrl,
      file,
      contentType,
      onProgress,
    });
  } catch {
    throw new Error("이미지 업로드에 실패했습니다.");
  }

  return key;
};

function normalizeImageContentType(contentType: string): "image/png" | "image/jpeg" {
  if (contentType === "image/png") return "image/png";
  if (contentType === "image/jpeg" || contentType === "image/jpg") return "image/jpeg";
  throw new Error("PNG 또는 JPEG 이미지만 업로드할 수 있습니다.");
}
