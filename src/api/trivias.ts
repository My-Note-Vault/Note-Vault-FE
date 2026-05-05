import apiClient from "./client";
import { endpoints } from "@/constants/endpoints";
import type {
  TriviaDetail,
  CreateTriviaRequest,
  CreateTriviaResponse,
  UpdateTriviaRequest,
} from "@/types/trivia";

export const fetchTriviaDetail = async (id: string): Promise<TriviaDetail> => {
  const { data } = await apiClient.get<TriviaDetail>(endpoints.TRIVIA_DETAIL(id));
  return data;
};

export const createTrivia = async (req: CreateTriviaRequest): Promise<CreateTriviaResponse> => {
  const { data } = await apiClient.post<CreateTriviaResponse>(endpoints.TRIVIAS, req);
  return data;
};

export const updateTrivia = async (id: string, req: UpdateTriviaRequest): Promise<void> => {
  await apiClient.patch(endpoints.TRIVIAS, { ...req, triviaId: id });
};

export const deleteTrivia = async (id: string): Promise<void> => {
  await apiClient.delete(endpoints.TRIVIA_DETAIL(id));
};
