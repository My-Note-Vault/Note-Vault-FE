import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";
import type { CollaborationBootstrap } from "@/api/collaboration";

export type ProviderStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface YjsWsProviderOptions {
  /** ws(s)://{BASE}/ws/workspaces/{workspaceId}/{documentType}/{documentId}?token=... */
  url: string;
  doc: Y.Doc;
  awareness: Awareness;
}

export interface YjsWsProvider {
  doc: Y.Doc;
  awareness: Awareness;
  status: ProviderStatus;
  isSynced: boolean;
  recordInsertedCharacters(count: number): void;
  finishLocalRestore(): void;
  connect(): void;
  applyRestBootstrap(bootstrap: CollaborationBootstrap): void;
  disconnect(): void;
  destroy(): void;
  onStatusChange(cb: (status: ProviderStatus) => void): () => void;
  onSync(cb: (isSynced: boolean) => void): () => void;
}

export interface CollaborationConfig {
  workspaceId: string;
  documentType: string;
  documentId: number;
  userName: string;
  userColor: string;
  userColorLight: string;
  userProfileImageUrl: string | null;
}
