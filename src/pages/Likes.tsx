import { useState, useEffect } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getLikedTemplates } from "@/api/template";   // ⭐ 서버 연동

export default function Likes() {
  const [likedTemplates, setLikedTemplates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const list = await getLikedTemplates();   // ⭐ 서버로부터 좋아요한 템플릿 가져오기
      setLikedTemplates(list);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 pt-[120px]">
        <h1 className="text-3xl font-bold mb-2">좋아요한 템플릿</h1>
        <p className="text-muted-foreground mb-6">
          내가 좋아요한 템플릿들을 한눈에 볼 수 있습니다 👍
        </p>

        {likedTemplates.length === 0 ? (
          <p className="text-center text-muted-foreground mt-20">
            아직 좋아요한 템플릿이 없습니다.
          </p>
        ) : (
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
            {likedTemplates.map((template) => (
              <Card
                key={template.id}
                onClick={() => navigate(`/template/${template.id}`)}  // ⭐ 상세 페이지 이동
                className="group hover:shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader className="p-0">
                  <div className="w-full h-48 bg-gradient-to-br from-vault-blue-light to-muted flex items-center justify-center">
                    <Eye className="h-12 w-12 text-muted-foreground" />
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                    <ThumbsUp className="h-4 w-4 fill-blue-500 text-blue-500" />
                  </div>

                  <CardTitle className="text-lg mb-2">{template.title}</CardTitle>
                  <CardDescription className="mb-3 line-clamp-2 text-sm">
                    {template.description}
                  </CardDescription>

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-primary">
                      {template.price ? `${template.price.toLocaleString()}원` : "무료"}
                    </span>
                    <span className="text-xs text-muted-foreground">by {template.author}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
