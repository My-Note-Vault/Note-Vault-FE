import apiClient from "./client";
import axios from "axios";
import { endpoints } from "@/constants/endpoints";
import type {
  CreateInviteLinkRequest,
  CreateInviteLinkResponse,
  InviteInfo,
} from "@/types/invitation";

export const createInviteLink = async (req: CreateInviteLinkRequest): Promise<CreateInviteLinkResponse> => {
  const { data } = await apiClient.post<CreateInviteLinkResponse>(
    endpoints.WORKSPACE_INVITATIONS(req.workspaceId),
    { expiresAt: req.expiresAt ?? null },
  );
  return data;
};

/** 비인증 — 초대 정보 조회 (수락 페이지용) */
export const getInviteInfo = async (code: string): Promise<InviteInfo> => {
  const { data } = await axios.get<InviteInfo>(endpoints.INVITATIONS, { params: { code } });
  return data;
};

/** 인증 필요 — 초대 수락 */
export const acceptInvite = async (code: string): Promise<void> => {
  await apiClient.post(endpoints.INVITE_ACCEPT, { code });
};

/** 공유 링크 URL 생성 */
export const buildShareUrl = (code: string): string => {
  return `${window.location.origin}/invite/${code}`;
};
