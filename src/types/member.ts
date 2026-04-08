export interface MemberProfile {
  nickname: string | null;
  profileImageUrl: string | null;
  dayStartHour: number;
  dayStartMinute: number;
}

export interface UpdateProfileRequest {
  nickname?: string;
  dayStartHour?: number;
  dayStartMinute?: number;
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  fileUrl: string;
  fileKey: string;
}
