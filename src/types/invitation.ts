export interface CreateInviteLinkRequest {
  workspaceId: string;
  expiresAt?: string | null;
}

export interface CreateInviteLinkResponse {
  code: string;
}

export interface InviteInfo {
  workSpaceName: string;
  expiresAt: string | null;
}
