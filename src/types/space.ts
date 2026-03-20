export interface SpaceDetail {
  id: string;
  name: string;
  content: string;
  children?: { id: string; name: string }[];
}

export interface CreateSpaceRequest {
  name: string;
}

export interface CreateSpaceResponse {
  id: string;
  name: string;
}

export interface UpdateSpaceRequest {
  name?: string;
  content?: string;
}
