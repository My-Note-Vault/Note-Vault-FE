export interface TriviaDetail {
  id: string;
  name: string;
  content: string;
}

export interface CreateTriviaRequest {
  name: string;
  parentId: string;
}

export interface CreateTriviaResponse {
  id: string;
  name: string;
}

export interface UpdateTriviaRequest {
  name?: string;
  content?: string;
}
