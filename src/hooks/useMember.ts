import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMemberProfile,
  fetchProfileImage,
  updateMemberProfile,
  generateProfileImageUploadUrl,
  updateProfileImage,
  deleteProfileImage,
  uploadFileToPresignedUrl,
} from "@/api/member";
import type { UpdateProfileRequest } from "@/types/member";

export const memberKeys = {
  all: ["member"] as const,
  profile: () => [...memberKeys.all, "profile"] as const,
  profileImage: () => [...memberKeys.all, "profile-image"] as const,
};

export const useMemberProfile = () => {
  return useQuery({
    queryKey: memberKeys.profile(),
    queryFn: fetchMemberProfile,
    staleTime: 1000 * 60 * 5,
    retry: false, // 회원가입 직후 profile이 없을 수 있으므로 retry 하지 않음
  });
};

export const useProfileImage = () => {
  return useQuery({
    queryKey: memberKeys.profileImage(),
    queryFn: fetchProfileImage,
    staleTime: 1000 * 60 * 5,
    retry: false,
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
    mutationFn: async ({ file }: { file: File }) => {
      const uploadUrlResponse = await generateProfileImageUploadUrl(file.type);
      console.log("[profile-image] upload-url response:", uploadUrlResponse);
      const { presignedUrl, profileImageKey } = uploadUrlResponse;
      console.log("[profile-image] profileImageKey:", profileImageKey);
      await uploadFileToPresignedUrl(presignedUrl, file);
      await updateProfileImage({ profileImageKey });
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
