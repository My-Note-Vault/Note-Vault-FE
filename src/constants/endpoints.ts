export const endpoints = {

    // Auth Endpoints
    REDIRECT_TO_GOOGLE: `/api/v1/oauth/google`,
    CALLBACK_FROM_GOOGLE: `/api/v1/oauth/callback/google`,    

    // Like Endpoints
    LIKE: `/api/v1/like`,

    // Memo Endpoints
    MEMBER: `/api/v1/members`,
    COMPLETE_PROFILE: `/api/v1/members/profile`,

    // NoteInfo Endpoints
    NOTE_INFO: `/api/v1/note-info`,
    NOTE_INFO_IMAGE: `/api/v1/note-info/image`,
    NOTE_INFO_DETAIL: (id: string) => `/api/v1/note-info/${id}`,
    CONVERT_DETAIL_KEY_TO_URL: `/api/v1/note-info/image/detail`,
    NOTE_INFO_SUMMARIES: (page: number) => `/api/v1/note-info/${page}`,
    SUMMARIES_BY_CATEGORY: (category: string, page: number) => `/api/v1/note-info/${category}/${page}`,
    BEST_SUMMARIES_BY_CATEGORY: (category: string) => `/api/v1/note-info/${category}`,
    HIS_BEST_SUMMARIES: (authorId: number, category: string) => `/api/v1/note-info/author/${authorId}/${category}`,
    CONVERT_SUMMARY_KEY_TO_URL: `/api/v1/note-info/image/summary`,

    // Review Endpoints
    REVIEW: `/api/v1/review`,
    LATEST_10_REVIEWS: (infoId: number) => `/api/v1/review/${infoId}`,
    ALL_REVIEWS_BY_INFO_ID: (infoId: number, page: number) => `/api/v1/review/${infoId}/${page}`,
    TOTAL_REVIEWS_PAGE_COUNT: (infoId: number) => `/api/v1/review/${infoId}/total`,
    CONVERT_REVIEWER_KEY_TO_URL: `/api/v1/review/image/reviewer`,

    


    };