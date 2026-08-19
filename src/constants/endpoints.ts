export const API_BASE = "/api/v1";

export const endpoints = {

// Auth Endpoints
LOGIN_GOOGLE: `${API_BASE}/oauth/login/google`,
CALLBACK_FROM_GOOGLE: `${API_BASE}/oauth/callback/google`,
REFRESH_TOKEN: `${API_BASE}/oauth/refresh`,
DEV_LOGIN: `${API_BASE}/oauth/dev`,

// Space Endpoints
SPACES: `${API_BASE}/workspaces`,
SPACES_ALL: `${API_BASE}/workspaces/all`,
WORKSPACE: (id: string) => `${API_BASE}/workspaces/${id}`,
CHAT: `${API_BASE}/chat`,
SPACE_INFORMATION: (id: string) => `${API_BASE}/workspaces/information/${id}`,

// Unified Workspace Document Endpoints
DOCUMENTS: `${API_BASE}/documents`,
DOCUMENT_DETAIL: (type: string, id: string) => `${API_BASE}/documents/${type}/${id}`,
DOCUMENT_COLLABORATION_BOOTSTRAP: (type: string, id: number) =>
  `${API_BASE}/documents/${type}/${id}/collaboration-bootstrap`,
DOCUMENT_INDEXING: (type: string, id: number) =>
  `${API_BASE}/documents/${type}/${id}/indexing`,

// 사이드바 문서 트리
NOTE_INFO_LIST: `${API_BASE}/unfolded-notes/note-info`,
DOCUMENT_SEARCH: `${API_BASE}/search`,

// AI
AI_SUMMARIES: `${API_BASE}/ai/summaries`,

// Daily Note Endpoints
DAILY_NOTES_ALL: `${API_BASE}/daily-notes/all`,
DAILY_NOTE: `${API_BASE}/daily-notes`,
DAILY_NOTE_BY_DATE: (date: string) => `${API_BASE}/daily-notes/date/${date}`,
DAILY_NOTE_DETAIL: (id: string | number) => `${API_BASE}/daily-notes/${id}`,
DAILY_NOTE_PLANS: (dailyNoteId: number) => `${API_BASE}/daily-notes/${dailyNoteId}/plans`,
DAILY_NOTE_INDEXING: (dailyNoteId: number) => `${API_BASE}/daily-notes/${dailyNoteId}/indexing`,

// Calendar Endpoints
CALENDAR_SCHEDULES: `${API_BASE}/calendar/schedules`,
CALENDAR_EVENTS: `${API_BASE}/calendar/events`,

// Last Visited
LAST_VISITED: `${API_BASE}/members/last-visited-path`,

// Member Profile
MEMBER_PROFILE: `${API_BASE}/members/profile`,
MEMBER_PROFILE_IMAGE_UPLOAD_URL: `${API_BASE}/members/profile-image/upload-url`,
MEMBER_PROFILE_IMAGE: `${API_BASE}/members/profile-image`,

// Content Images
CONTENT_IMAGE_UPLOAD_URL: `${API_BASE}/content-images/upload-url`,
CONTENT_IMAGE_COOKIES: `${API_BASE}/content-images/cookies`,
CONTENT_IMAGE_URL: `${API_BASE}/content-images/url`,

// Invitation
WORKSPACE_INVITATIONS: (workSpaceId: string) => `${API_BASE}/workspaces/${workSpaceId}/invitations`,
INVITATIONS: `${API_BASE}/workspaces/invitations`,
INVITE_ACCEPT: `${API_BASE}/workspaces/invitations/accept`,

};
