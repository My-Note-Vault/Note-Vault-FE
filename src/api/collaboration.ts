import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";

export interface CollaborationBootstrap {
  state: Uint8Array | null;
  updates: {
    revision: number;
    update: Uint8Array;
  }[];
  cursor: number;
}

interface RawCollaborationBootstrap {
  state: string | null;
  updates: {
    revision: number;
    update: string;
  }[];
  cursor: number;
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function fetchCollaborationBootstrap(
  workspaceId: string,
  documentType: string,
  documentId: number,
  signal?: AbortSignal,
): Promise<CollaborationBootstrap> {
  const { data } = await apiClient.get<RawCollaborationBootstrap>(
    endpoints.DOCUMENT_COLLABORATION_BOOTSTRAP(documentType, documentId),
    {
      params: { workspaceId },
      signal,
    },
  );

  return {
    state: data.state ? decodeBase64(data.state) : null,
    updates: data.updates.map(({ revision, update }) => ({
      revision,
      update: decodeBase64(update),
    })),
    cursor: data.cursor,
  };
}
