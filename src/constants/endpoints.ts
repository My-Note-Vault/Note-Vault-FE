export const API_BASE = "/api/v1";

export const endpoints = {

// Auth Endpoints
REDIRECT_TO_GOOGLE: `${API_BASE}/oauth/google`,
CALLBACK_FROM_GOOGLE: `${API_BASE}/oauth/callback/google`,
LOGIN_GOOGLE: `/oauth/login/google`,

// Space Endpoints
SPACES: `${API_BASE}/spaces`,
SPACE_DETAIL: (id: string) => `${API_BASE}/spaces/${id}`,

// Task Endpoints
TASKS: `${API_BASE}/tasks`,
TASK_DETAIL: (id: string) => `${API_BASE}/tasks/${id}`,

// SubTask Endpoints
SUBTASKS: `${API_BASE}/subtasks`,
SUBTASK_DETAIL: (id: string) => `${API_BASE}/subtasks/${id}`,

// Trivia Endpoints
TRIVIAS: `${API_BASE}/trivias`,
TRIVIA_DETAIL: (id: string) => `${API_BASE}/trivias/${id}`,

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
