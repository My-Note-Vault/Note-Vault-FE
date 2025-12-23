import { useState } from "react";
import { convertReviewerKeyToUrl } from "@/api/review-api";

export default function ReviewerImageUploader(reviewerImageKeys: string[]) {
    const [urls, setUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        setLoading(true);
        try {
            const data = await convertReviewerKeyToUrl(reviewerImageKeys);
            setUrls(data.urls);
        } catch (error) {
            console.error("Error uploading images:", error);
        } finally {
            setLoading(false);
        }
    };

    return { urls, loading, handleUpload };
}