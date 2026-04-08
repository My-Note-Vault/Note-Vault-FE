export interface MemberProfile {
  nickname: string | null;
  profileImageUrl: string | null;
  dayStartHour: number;
  dayStartMinute: number;
}

export interface UpdateProfileRequest {
  nickname: string;
  profileImageUrl: string | null;
  dayStartHour: number;
  dayStartMinute: number;
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  fileUrl: string;
  fileKey: string;
}

export interface DayStartTime {
  hour: number;
  minute: number;
}

export interface CompleteProfileRequest {
  nickname: string;
  profileImageKey?: string;
  dayStartTime?: DayStartTime;
}
