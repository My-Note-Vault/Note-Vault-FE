import { authStorage } from "@/lib/authStorage";
import type { DocType } from "@/types/common";

export interface CollaborationUser {
  name: string;
  color: string;
  colorLight: string;
}

const DEFAULT_COLLAB_PATH = "/api/v1/collaboration";

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

export function resolveCollaborationServerUrl(): string | null {
  if (typeof window === "undefined") return null;

  const url = new URL(DEFAULT_COLLAB_PATH, window.location.origin);
  url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return url.toString();
}

export function buildEntityCollaborationRoom(
  docType: DocType,
  id: string | number,
): string {
  return `${docType}:${id}`;
}

export function buildDailyNoteCollaborationRoom(id: string | number): string {
  return `daily-note:${id}`;
}

export function buildCollaborationParams(
  extra?: Record<string, string | number | null | undefined>,
): Record<string, string> {
  const params: Record<string, string> = {};
  const accessToken = authStorage.getAccessToken();

  if (accessToken) {
    params.token = accessToken;
  }

  if (!extra) return params;

  Object.entries(extra).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params[key] = String(value);
    }
  });

  return params;
}

export function buildCollaborationUser(
  preferredName: string | null | undefined,
  seed: string,
): CollaborationUser {
  const palette = USER_COLORS[hashString(seed) % USER_COLORS.length];

  return {
    name: preferredName?.trim() || "Anonymous",
    color: palette.color,
    colorLight: palette.colorLight,
  };
}
