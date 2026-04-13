export interface MemberProfile {
  name: string | null;
  nickname: string | null;
  dayStartHour: number;
  dayStartMinute: number;
}

export interface UpdateProfileRequest {
  nickname?: string;
  dayStartHour?: number;
  dayStartMinute?: number;
}

export interface GenerateProfileImageUploadUrlResponse {
  presignedUrl: string;
  key: string;
}

export interface ProfileImageResponse {
  profileImageUrl: string | null;
}

export interface UpdateProfileImageRequest {
  profileImageKey: string;
}
