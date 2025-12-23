import { endpoints } from "../constants/endpoints";
import { api } from "./client";


export const writeReview = async (data: {
    noteInfoId: number;
    rating: number;
    content: string;
}) => {
    const response = await api.post(endpoints.REVIEW, data);
    return response.data;
}

export const deleteReview = async (reviewId: number, memberId: number) => {
    const response = await api.delete(endpoints.REVIEW, {
        data: { reviewId }
    });
}

export const findLatest10Reviews = async (infoId: number) => {
    const response = await api.get(endpoints.LATEST_10_REVIEWS(infoId));
    return response.data;
};

export const findAllReviewsByInfoId = async (infoId: number, page: number) => {
    const response = await api.get(endpoints.ALL_REVIEWS_BY_INFO_ID(infoId, page));
    return response.data;
}

export const findTotalReviewsPageCount = async (infoId: number) => {
    const response = await api.get(endpoints.TOTAL_REVIEWS_PAGE_COUNT(infoId));
    return response.data;
}

export const convertReviewerKeyToUrl = async (imageKey: string[]) => {
    const response = await api.post(endpoints.CONVERT_REVIEWER_KEY_TO_URL, {
        imageKey
    });
    return response.data;
};

export const fetchReviewerImage = async (presignedUrl: string) => {
    const response = await api.get(presignedUrl, { responseType: "blob"});
    return URL.createObjectURL(response.data);
};

