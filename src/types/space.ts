export interface SpaceDetail {
  id: string;
  name: string;
  content: string;
  children?: { id: string; name: string }[];
}

export interface CreateSpaceRequest {
  parentId: string | null;
  name: string;
  content: string | null;
  isPublic: boolean;
}

export interface CreateSpaceResponse {
  id: string;
  name: string;
}

export interface UpdateSpaceRequest {
  workSpaceId: string;
  parentId?: string | null;
  name?: string;
  content?: string;
  isPublic: boolean;
}
