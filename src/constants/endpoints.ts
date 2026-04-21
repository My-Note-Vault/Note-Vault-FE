export const API_BASE = "/api/v1";

export const endpoints = {

// Auth Endpoints
LOGIN_GOOGLE: `${API_BASE}/oauth/login/google`,
CALLBACK_FROM_GOOGLE: `${API_BASE}/oauth/callback/google`,
REFRESH_TOKEN: `${API_BASE}/oauth/refresh`,
DEV_LOGIN: `${API_BASE}/oauth/dev`,

// Space Endpoints
SPACES: `${API_BASE}/workspaces`,
SPACE_DETAIL: (id: string) => `${API_BASE}/workspaces/${id}`,

// Task Endpoints
TASKS: `${API_BASE}/tasks`,
TASK_DETAIL: (id: string) => `${API_BASE}/tasks/${id}`,

// SubTask Endpoints
SUBTASKS: `${API_BASE}/subtasks`,
SUBTASK_DETAIL: (id: string) => `${API_BASE}/subtasks/${id}`,

// Trivia Endpoints
TRIVIAS: `${API_BASE}/trivia`,
TRIVIA_DETAIL: (id: string) => `${API_BASE}/trivia/${id}`,

// 사이드바: note-info + unfolded
NOTE_INFO_LIST: `${API_BASE}/unfolded-notes/note-info`,
UNFOLDED_NOTES: `${API_BASE}/unfolded-notes`,
DOCUMENT_SEARCH: `${API_BASE}/search`,

// Daily Note Endpoints
DAILY_NOTES_ALL: `${API_BASE}/daily-notes/all`,
DAILY_NOTE: `${API_BASE}/daily-notes`,
DAILY_NOTE_DETAIL: (id: string | number) => `${API_BASE}/daily-notes/${id}`,
DAILY_NOTE_PLANS: (dailyNoteId: number) => `${API_BASE}/daily-notes/${dailyNoteId}/plans`,

// Calendar Endpoints
CALENDAR_STATS: `${API_BASE}/calendar/stats`,

// Last Visited
LAST_VISITED: `${API_BASE}/members/last-visited-path`,

// Member Profile
MEMBER_PROFILE: `${API_BASE}/members/profile`,
MEMBER_PROFILE_IMAGE_UPLOAD_URL: `${API_BASE}/members/profile-image/upload-url`,
MEMBER_PROFILE_IMAGE: `${API_BASE}/members/profile-image`,

};
