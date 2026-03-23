export const API_BASE = "/api/v1";

export const endpoints = {

// Auth Endpoints
LOGIN_GOOGLE: `${API_BASE}/oauth/login/google`,
CALLBACK_FROM_GOOGLE: `${API_BASE}/oauth/callback/google`,

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

// 통합 트리 & 검색
DOCUMENT_TREE: `${API_BASE}/documents/tree`,
DOCUMENT_SEARCH: `${API_BASE}/search`,

// Daily Note Endpoints
DAILY_NOTES: `${API_BASE}/daily-notes`,
DAILY_NOTE_DETAIL: (date: string) => `${API_BASE}/daily-notes/${date}`,

// Calendar Endpoints
CALENDAR_STATS: `${API_BASE}/calendar/stats`,

// Last Visited
LAST_VISITED: `${API_BASE}/users/last-visited`,

};
