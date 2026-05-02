export interface InviteLink {
  code: string;
  workspaceId: string;
  workspaceName: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface CreateInviteLinkRequest {
  workspaceId: string;
  expiresAt?: string | null;
}

export interface CreateInviteLinkResponse {
  code: string;
}

export interface InviteInfo {
  code: string;
  workspaceName: string;
  inviterName: string;
  expiresAt: string | null;
}
