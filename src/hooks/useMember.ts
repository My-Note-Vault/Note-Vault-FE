import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMemberProfile,
  updateMemberProfile,
  getPresignedUrl,
  uploadFileToPresignedUrl,
} from "@/api/member";
import type { UpdateProfileRequest } from "@/types/member";

export const memberKeys = {
  all: ["member"] as const,
  profile: () => [...memberKeys.all, "profile"] as const,
};

export const useMemberProfile = () => {
  return useQuery({
    queryKey: memberKeys.profile(),
    queryFn: fetchMemberProfile,
    staleTime: 1000 * 60 * 5,
    retry: 1,
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
  return useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const { presignedUrl, fileUrl } = await getPresignedUrl(file.name, file.type);
      await uploadFileToPresignedUrl(presignedUrl, file);
      return fileUrl;
    },
  });
};
