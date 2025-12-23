import { Search, Star, Download, Eye, ThumbsUp } from "lucide-react";
import { useParams } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";
import { useEffect, useState } from "react";
import { getTemplateDetail } from "@/api/template";
import { findAllReviewsByInfoId } from "@/api/review-api";


export default function TemplateDetail() {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(0);


    useEffect(() => {
    if (!id) return;

    (async () => {
      const t = await getTemplateDetail(id);
      setTemplate(t);

      const r = await findAllReviewsByInfoId(Number(id), page);
      setReviews(r);
    })();
  }, [id, page]);

  if (!template) return <div>템플릿을 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12 pt-[120px]">
        <h1 className="text-4xl font-bold mb-4">{template.title}</h1>

        <p className="text-muted-foreground mb-4">{template.description}</p>

        <div className="flex gap-4 items-center mb-6">
          <span className="text-lg font-semibold text-primary">
            {template.price ? `${template.price.toLocaleString()}원` : "무료"}
          </span>
          <span className="text-sm text-gray-500">작성자: {template.author}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div>⭐ 평점: {template.rating}</div>
          <div>💬 리뷰: {template.reviews}</div>
          <div>⬇ 다운로드: {template.downloads}</div>
          <div>🏷 태그: {template.tags.join(", ")}</div>
        </div>

        <div className="mt-10 p-6 border rounded-lg bg-white shadow">
          <h3 className="font-semibold text-2xl mb-4">템플릿 미리보기</h3>
          <div className="w-full h-80 bg-muted flex items-center justify-center">
            <Eye className="h-16 w-16 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
