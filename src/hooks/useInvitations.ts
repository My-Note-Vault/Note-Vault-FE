import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getInviteLinks,
  createInviteLink,
  revokeInviteLink,
  getInviteInfo,
  acceptInvite,
} from "@/api/invitations";
import type { CreateInviteLinkRequest } from "@/types/invitation";

export const invitationKeys = {
  all: ["invitations"] as const,
  workspace: (workspaceId: string) => [...invitationKeys.all, "workspace", workspaceId] as const,
  info: (code: string) => [...invitationKeys.all, "info", code] as const,
};

export const useInviteLinks = (workspaceId: string | null) => {
  return useQuery({
    queryKey: invitationKeys.workspace(workspaceId!),
    queryFn: () => getInviteLinks(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 1000 * 30,
  });
};

export const useCreateInviteLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateInviteLinkRequest) => createInviteLink(req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: invitationKeys.workspace(variables.workspaceId),
      });
      toast.success("초대 링크가 생성되었습니다");
    },
  });
};

export const useRevokeInviteLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, code }: { workspaceId: string; code: string }) =>
      revokeInviteLink(workspaceId, code),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: invitationKeys.workspace(variables.workspaceId),
      });
      toast.success("초대 링크가 삭제되었습니다");
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
