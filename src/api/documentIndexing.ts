import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";

export interface DocumentIndexingResponse {
  status: "ACCEPTED" | "ALREADY_INDEXED" | "STALE";
  currentRevision: number;
  jobId: number | null;
}

export async function requestDocumentIndexing(
  documentType: string,
  resourceId: number,
  revision: number,
): Promise<void> {
  await apiClient.post(
    endpoints.DOCUMENT_INDEXING(documentType, resourceId),
    { revision },
    { validateStatus: (status) => (status >= 200 && status < 300) || status === 409 },
  );
}
