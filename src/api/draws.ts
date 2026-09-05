import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type { DrawOverview } from "@/types/draw";

export async function fetchDrawOverview(): Promise<DrawOverview> {
  const { data } = await apiClient.get<DrawOverview>(endpoints.DAILY_DRAWS);
  return data;
}
