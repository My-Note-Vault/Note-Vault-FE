import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

type Review = {
  id: number;
  content: string;
  createdAt: string;
};

export const ReviewList = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // TODO: 실제 API 연동
    setReviews([
      { id: 1, content: "노트 정말 유용합니다!", createdAt: "2025-01-02" },
      { id: 2, content: "템플릿 디자인이 깔끔하네요.", createdAt: "2025-01-10" },
      { id: 3, content: "공부할 때 도움 많이 됩니다.", createdAt: "2025-02-03" },
    ]);
  }, []);

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">내 리뷰 전체</h1>

      <Card>
        <CardHeader>
          <CardTitle>작성한 리뷰</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="border-b pb-3 cursor-pointer hover:bg-gray-50 p-1 rounded transition"
              onClick={() => navigate(`/reviews/${r.id}`)}
            >
              <p className="text-gray-900 font-medium">{r.content}</p>
              <p className="text-sm text-gray-500 mt-1">{r.createdAt}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
