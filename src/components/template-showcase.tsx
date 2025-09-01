import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Download, Eye } from "lucide-react";

const templates = [
  {
    id: 1,
    title: "모던 개발자 이력서",
    description: "깔끔하고 전문적인 개발자를 위한 이력서 템플릿",
    price: "5,000원",
    rating: 4.8,
    downloads: 1234,
    category: "개발자",
    image: "/api/placeholder/300/400"
  },
  {
    id: 2,
    title: "신입 마케터 자소서",
    description: "마케팅 직무에 최적화된 자기소개서 템플릿",
    price: "3,000원",
    rating: 4.9,
    downloads: 856,
    category: "마케팅",
    image: "/api/placeholder/300/400"
  },
  {
    id: 3,
    title: "디자이너 포트폴리오",
    description: "창의적이고 시각적인 디자이너 이력서 템플릿",
    price: "7,000원",
    rating: 4.7,
    downloads: 643,
    category: "디자인",
    image: "/api/placeholder/300/400"
  },
  {
    id: 4,
    title: "대기업 지원용 이력서",
    description: "대기업 HR이 선호하는 깔끔한 이력서 포맷",
    price: "4,000원",
    rating: 4.8,
    downloads: 1567,
    category: "일반",
    image: "/api/placeholder/300/400"
  }
];

export const TemplateShowcase = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            인기 <span className="text-primary">템플릿</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            검증된 템플릿으로 합격률을 높이세요
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <Eye className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary">{template.category}</Badge>
                  </div>
                  <div className="absolute top-3 right-3 bg-background rounded-full px-2 py-1 text-sm font-medium">
                    {template.price}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                  {template.title}
                </CardTitle>
                <CardDescription className="mb-4">
                  {template.description}
                </CardDescription>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{template.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Download className="h-4 w-4" />
                    <span className="text-sm">{template.downloads.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    미리보기
                  </Button>
                  <Button size="sm" className="flex-1">
                    구매하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            모든 템플릿 보기
          </Button>
        </div>
      </div>
    </section>
  );
};