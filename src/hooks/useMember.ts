import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMemberProfile,
  updateMemberProfile,
  completeProfile,
  getPresignedUrl,
  uploadFileToPresignedUrl,
} from "@/api/member";
import type { UpdateProfileRequest, CompleteProfileRequest } from "@/types/member";

export const memberKeys = {
  all: ["member"] as const,
  profile: () => [...memberKeys.all, "profile"] as const,
};

export const useMemberProfile = () => {
  return useQuery({
    queryKey: memberKeys.profile(),
    queryFn: fetchMemberProfile,
    staleTime: 1000 * 60 * 5,
    retry: false, // 회원가입 직후 profile이 없을 수 있으므로 retry 하지 않음
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

export const useCompleteProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CompleteProfileRequest) => completeProfile(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.profile() });
    },
  });
};

export const useUploadProfileImage = () => {
  return useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const { presignedUrl, fileUrl, fileKey } = await getPresignedUrl(file.name, file.type);
      await uploadFileToPresignedUrl(presignedUrl, file);
      return { fileUrl, fileKey };
    },
  });
};
