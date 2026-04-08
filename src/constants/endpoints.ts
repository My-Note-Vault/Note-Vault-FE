export const API_BASE = "/api/v1";

export const endpoints = {

// Auth Endpoints
LOGIN_GOOGLE: `${API_BASE}/oauth/login/google`,
CALLBACK_FROM_GOOGLE: `${API_BASE}/oauth/callback/google`,
REFRESH_TOKEN: `${API_BASE}/oauth/refresh`,

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

// Calendar Endpoints
CALENDAR_STATS: `${API_BASE}/calendar/stats`,

// Last Visited
LAST_VISITED: `${API_BASE}/members/last-visited-path`,

// Member Profile
MEMBER_PROFILE: `${API_BASE}/members/profile`,

// File Upload
FILES: `${API_BASE}/files`,

};
