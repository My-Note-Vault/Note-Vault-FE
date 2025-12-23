import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type Review = {
  id: number;
  content: string;
  createdAt: string;
};

export const ReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [review, setReview] = useState<Review | null>(null);

  useEffect(() => {
    // TODO: 실제 API
    setReview({
      id: Number(id),
      content: "노트 정말 유용합니다!",
      createdAt: "2025-01-02",
    });
  }, [id]);

  if (!review) return null;

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">리뷰 상세</h1>

      <Card>
        <CardHeader>
          <CardTitle>리뷰 #{review.id}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="text-gray-500 mb-1">작성일</p>
            <p className="font-medium">{review.createdAt}</p>
          </div>

          <div>
            <p className="text-gray-500 mb-1">내용</p>
            <p className="text-lg">{review.content}</p>
          </div>

          <Button className="w-full mt-6" onClick={() => navigate(-1)}>
            뒤로가기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
