export interface CreateInviteLinkRequest {
  workspaceId: string;
  expiresAt?: string | null;
}

export type CreateInviteLinkResponse = string;

export interface InviteInfo {
  workSpaceName: string;
  expiresAt: string | null;
}
