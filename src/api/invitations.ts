import apiClient from "./client";
import axios from "axios";
import { endpoints } from "@/constants/endpoints";
import type {
  InviteLink,
  CreateInviteLinkRequest,
  CreateInviteLinkResponse,
  InviteInfo,
} from "@/types/invitation";

export const getInviteLinks = async (workspaceId: string): Promise<InviteLink[]> => {
  const { data } = await apiClient.get<InviteLink[]>(endpoints.INVITE_LINKS(workspaceId));
  return data;
};

export const createInviteLink = async (req: CreateInviteLinkRequest): Promise<CreateInviteLinkResponse> => {
  const { data } = await apiClient.post<CreateInviteLinkResponse>(
    endpoints.INVITE_LINKS(req.workspaceId),
    { expiresAt: req.expiresAt ?? null },
  );
  return data;
};

export const revokeInviteLink = async (workspaceId: string, code: string): Promise<void> => {
  await apiClient.delete(endpoints.INVITE_LINK_DETAIL(workspaceId, code));
};

/** 비인증 — 초대 정보 조회 (수락 페이지용) */
export const getInviteInfo = async (code: string): Promise<InviteInfo> => {
  const { data } = await axios.get<InviteInfo>(endpoints.INVITE_INFO(code));
  return data;
};

/** 인증 필요 — 초대 수락 */
export const acceptInvite = async (code: string): Promise<void> => {
  await apiClient.post(endpoints.INVITE_ACCEPT(code));
};

/** 공유 링크 URL 생성 */
export const buildShareUrl = (code: string): string => {
  return `${window.location.origin}/invite/${code}`;
};
