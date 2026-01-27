export const API_BASE = "/api/v1";

export const endpoints = {

    // Auth Endpoints
    REDIRECT_TO_GOOGLE: `${API_BASE}/oauth/google`,
    CALLBACK_FROM_GOOGLE: `${API_BASE}/oauth/callback/google`,
    LOGIN_GOOGLE: '${API_BASE}/oauth/login/google',    

    // Like Endpoints
    LIKE: `${API_BASE}/like`,

    // Memo Endpoints
    MEMBER: `${API_BASE}/members`,
    COMPLETE_PROFILE: `${API_BASE}/members/profile`,

    // NoteInfo Endpoints
    NOTE_INFO: `${API_BASE}/note-info`,
    NOTE_INFO_IMAGE: `${API_BASE}/note-info/image`,
    NOTE_INFO_DETAIL: (id: string) => `${API_BASE}/note-info/${id}`,
    CONVERT_DETAIL_KEY_TO_URL: `${API_BASE}/note-info/image/detail`,
    NOTE_INFO_SUMMARIES: (page: number) => `${API_BASE}/note-info/${page}`,
    SUMMARIES_BY_CATEGORY: (category: string, page: number) => `${API_BASE}/note-info/${category}/${page}`,
    BEST_SUMMARIES_BY_CATEGORY: (category: string) => `${API_BASE}/note-info/${category}`,
    HIS_BEST_SUMMARIES: (authorId: number, category: string) => `${API_BASE}/note-info/author/${authorId}/${category}`,
    CONVERT_SUMMARY_KEY_TO_URL: `${API_BASE}/note-info/image/summary`,

    // Review Endpoints
    REVIEW: `${API_BASE}/review`,
    LATEST_10_REVIEWS: (infoId: number) => `${API_BASE}/review/${infoId}`,
    ALL_REVIEWS_BY_INFO_ID: (infoId: number, page: number) => `${API_BASE}/review/${infoId}/${page}`,
    TOTAL_REVIEWS_PAGE_COUNT: (infoId: number) => `${API_BASE}/review/${infoId}/total`,
    CONVERT_REVIEWER_KEY_TO_URL: `${API_BASE}/review/image/reviewer`,

    


    };