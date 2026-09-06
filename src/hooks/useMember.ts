import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMemberProfile,
  fetchProfileImage,
  updateMemberProfile,
  generateProfileImageUploadUrl,
  updateProfileImage,
  deleteProfileImage,
  uploadFileToPresignedUrl,
  fetchPayoutAccount,
  verifyPayoutAccount,
  saveVerifiedPayoutAccount,
  deletePayoutAccount,
} from "@/api/member";
import type { UploadProgressHandler } from "@/api/uploadProgress";
import type { UpdateProfileRequest, VerifyPayoutAccountRequest } from "@/types/member";

export const memberKeys = {
  all: ["member"] as const,
  profile: () => [...memberKeys.all, "profile"] as const,
  profileImage: () => [...memberKeys.all, "profile-image"] as const,
  payoutAccount: () => [...memberKeys.all, "payout-account"] as const,
};

export const usePayoutAccount = () => useQuery({
  queryKey: memberKeys.payoutAccount(),
  queryFn: fetchPayoutAccount,
  retry: false,
});

export const useVerifyPayoutAccount = () => useMutation({
  mutationFn: (request: VerifyPayoutAccountRequest) => verifyPayoutAccount(request),
});

export const useSaveVerifiedPayoutAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveVerifiedPayoutAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.payoutAccount() });
      queryClient.invalidateQueries({ queryKey: memberKeys.profile() });
    },
  });
};

export const useDeletePayoutAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePayoutAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.payoutAccount() });
      queryClient.invalidateQueries({ queryKey: memberKeys.profile() });
    },
  });
};

export const useMemberProfile = () => {
  return useQuery({
    queryKey: memberKeys.profile(),
    queryFn: fetchMemberProfile,
    staleTime: 1000 * 60 * 5,
    retry: false, // 회원가입 직후 profile이 없을 수 있으므로 retry 하지 않음
    retryOnMount: false,
  });
};

export const useProfileImage = () => {
  return useQuery({
    queryKey: memberKeys.profileImage(),
    queryFn: fetchProfileImage,
    staleTime: 1000 * 60 * 5,
    retry: false,
    retryOnMount: false,
  });
};

export const useUpdateMemberProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: UpdateProfileRequest) => updateMemberProfile(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.profile() });
    },
  });
};


export const useUploadProfileImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: UploadProgressHandler;
    }) => {
      const uploadUrlResponse = await generateProfileImageUploadUrl(file.type);
      const { presignedUrl, key } = uploadUrlResponse;
      await uploadFileToPresignedUrl(presignedUrl, file, onProgress);
      await updateProfileImage({ profileImageKey: key });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.profile() });
      queryClient.invalidateQueries({ queryKey: memberKeys.profileImage() });
    },
  });
};

export const useDeleteProfileImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProfileImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.profile() });
      queryClient.invalidateQueries({ queryKey: memberKeys.profileImage() });
    },
  });
};
