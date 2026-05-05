import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createInviteLink,
  getInviteInfo,
  acceptInvite,
} from "@/api/invitations";
import type { CreateInviteLinkRequest } from "@/types/invitation";

export const invitationKeys = {
  all: ["invitations"] as const,
  info: (code: string) => [...invitationKeys.all, "info", code] as const,
};

export const useCreateInviteLink = () => {
  return useMutation({
    mutationFn: (req: CreateInviteLinkRequest) => createInviteLink(req),
    onSuccess: () => {
      toast.success("초대 링크가 생성되었습니다");
    },
  });
};

export const useInviteInfo = (code: string | null) => {
  return useQuery({
    queryKey: invitationKeys.info(code!),
    queryFn: () => getInviteInfo(code!),
    enabled: !!code,
    retry: false,
  });
};

export const useAcceptInvite = () => {
  return useMutation({
    mutationFn: (code: string) => acceptInvite(code),
    onSuccess: () => {
      toast.success("워크스페이스에 참여했습니다");
    },
  });
};
