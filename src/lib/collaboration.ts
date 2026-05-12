import type { CollaborationConfig } from "@/collab/types";
import type { DocType } from "@/types/common";

export interface CollaborationUser {
  name: string;
  color: string;
  colorLight: string;
  profileImageUrl: string | null;
}

const USER_COLORS = [
  { color: "#2563eb", colorLight: "#2563eb33" },
  { color: "#059669", colorLight: "#05966933" },
  { color: "#dc2626", colorLight: "#dc262633" },
  { color: "#d97706", colorLight: "#d9770633" },
  { color: "#7c3aed", colorLight: "#7c3aed33" },
  { color: "#0891b2", colorLight: "#0891b233" },
  { color: "#65a30d", colorLight: "#65a30d33" },
  { color: "#db2777", colorLight: "#db277733" },
];

function hashString(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }

  return Math.abs(hash);
}

export function buildCollaborationUser(
  preferredName: string | null | undefined,
  seed: string,
  profileImageUrl?: string | null,
): CollaborationUser {
  const palette = USER_COLORS[hashString(seed) % USER_COLORS.length];

  return {
    name: preferredName?.trim() || "Anonymous",
    color: palette.color,
    colorLight: palette.colorLight,
    profileImageUrl: profileImageUrl ?? null,
  };
}

/** docType + entityId 로 CollaborationConfig 를 만든다 */
export function buildCollaborationConfig(
  workspaceId: string,
  docType: DocType,
  documentId: number,
  user: CollaborationUser,
): CollaborationConfig {
  return {
    workspaceId,
    documentType: docType,
    documentId,
    userName: user.name,
    userColor: user.color,
    userColorLight: user.colorLight,
    userProfileImageUrl: user.profileImageUrl,
  };
}
