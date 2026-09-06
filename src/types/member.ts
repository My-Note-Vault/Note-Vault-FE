export interface MemberProfile {
  name: string | null;
  nickname: string | null;
  memberTag: string | null;
  dayStartTime: {
    hour: number;
    minute: number;
  };
  payoutAccount: PayoutAccount;
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

export type BankCode = "KB" | "SHINHAN" | "HANA" | "KAKAO" | "TOSS" | "K_BANK";

export interface PayoutAccount {
  configured: boolean;
  verified: boolean;
  bankCode: BankCode | null;
  bankName: string | null;
  maskedAccountNumber: string | null;
  maskedHolderName: string | null;
}

export interface VerifyPayoutAccountRequest {
  bankCode: BankCode;
  accountNumber: string;
}

export interface PayoutAccountVerification {
  verificationToken: string;
  bankName: string;
  maskedAccountNumber: string;
  maskedHolderName: string;
  expiresAt: string;
}
