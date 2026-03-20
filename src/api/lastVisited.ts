import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type { DocType } from "@/types/common";

export interface LastVisitedResponse {
  documentId: string;
  docType: DocType;
  name: string;
}

export const fetchLastVisited = async (): Promise<LastVisitedResponse | null> => {
  try {
    const { data } = await apiClient.get<LastVisitedResponse>(endpoints.LAST_VISITED);
    return data;
  } catch {
    return null;
  }
};

export const updateLastVisited = async (documentId: string, docType: DocType): Promise<void> => {
  await apiClient.put(endpoints.LAST_VISITED, { documentId, docType });
};
