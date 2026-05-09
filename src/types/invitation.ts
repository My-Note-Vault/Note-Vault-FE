export interface CreateInviteLinkRequest {
  workspaceId: string;
  expiresAt?: string | null;
}

export type CreateInviteLinkResponse = string;

export interface InviteInfo {
  workspaceName: string;
  expiresAt: string | null;
}
