import { useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Star, Download, Eye, Heart } from "lucide-react";

const templates = [
  {
    id: 1,
    title: "모던 개발자 이력서",
    description: "깔끔하고 전문적인 개발자를 위한 이력서 템플릿입니다. TypeScript, React 개발자에게 최적화되어 있습니다.",
    price: 5000,
    originalPrice: 8000,
    rating: 4.8,
    reviews: 124,
    downloads: 1234,
    category: "개발자",
    tags: ["이력서", "개발자", "모던", "IT"],
    author: "김개발",
    featured: true,
    discount: 38
  },
  {
    id: 2,
    title: "신입 마케터 자소서",
    description: "마케팅 직무에 최적화된 자기소개서 템플릿입니다. 디지털 마케팅 경험을 효과적으로 어필할 수 있습니다.",
    price: 3000,
    rating: 4.9,
    reviews: 89,
    downloads: 856,
    category: "마케팅",
    tags: ["자소서", "마케팅", "신입", "디지털"],
    author: "박마케팅"
  },
  {
    id: 3,
    title: "디자이너 포트폴리오",
    description: "창의적이고 시각적인 디자이너 이력서 템플릿입니다. UI/UX 디자이너의 감각을 보여줄 수 있습니다.",
    price: 7000,
    rating: 4.7,
    reviews: 67,
    downloads: 643,
    category: "디자인",
    tags: ["포트폴리오", "디자이너", "UI/UX", "창의적"],
    author: "이디자인"
  },
  {
    id: 4,
    title: "대기업 지원용 이력서",
    description: "대기업 HR이 선호하는 깔끔하고 정형화된 이력서 포맷입니다. 삼성, LG 등 대기업 지원에 적합합니다.",
    price: 4000,
    rating: 4.8,
    reviews: 156,
    downloads: 1567,
    category: "일반",
    tags: ["이력서", "대기업", "정형", "HR"],
    author: "최취업"
  },
  {
    id: 5,
    title: "스타트업 지원용 이력서",
    description: "스타트업 문화에 맞는 자유롭고 개성 있는 이력서 템플릿입니다.",
    price: 3500,
    rating: 4.6,
    reviews: 78,
    downloads: 432,
    category: "일반",
    tags: ["이력서", "스타트업", "개성", "자유"],
    author: "정스타트"
  },
  {
    id: 6,
    title: "공기업 자소서 템플릿",
    description: "공기업 자기소개서 작성에 최적화된 템플릿입니다. 공공기관의 인재상에 맞춘 구성입니다.",
    price: 4500,
    rating: 4.5,
    reviews: 92,
    downloads: 678,
    category: "공공",
    tags: ["자소서", "공기업", "공공기관", "정형"],
    author: "송공기업"
  }
];

const categories = ["전체", "개발자", "디자인", "마케팅", "일반", "공공"];
const sortOptions = [
  { value: "popular", label: "인기순" },
  { value: "recent", label: "최신순" },
  { value: "price-low", label: "낮은 가격순" },
  { value: "price-high", label: "높은 가격순" },
  { value: "rating", label: "평점순" }
];

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [sortBy, setSortBy] = useState("popular");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">템플릿 마켓플레이스</h1>
          <p className="text-muted-foreground">
            전문가들이 제작한 검증된 이력서 및 자소서 템플릿을 찾아보세요
          </p>
        </div>
        
        {/* 검색 및 필터 */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="템플릿을 검색해보세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        
        {/* 템플릿 그리드 */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              {template.featured && (
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    인기
                  </Badge>
                </div>
              )}
              
              {template.discount && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="destructive">
                    -{template.discount}%
                  </Badge>
                </div>
              )}
              
              <CardHeader className="p-0">
                <div className="relative overflow-hidden">
                  <div className="w-full h-48 bg-gradient-to-br from-vault-blue-light to-muted flex items-center justify-center">
                    <Eye className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                
                <CardTitle className="text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                  {template.title}
                </CardTitle>
                
                <CardDescription className="mb-3 line-clamp-2 text-sm">
                  {template.description}
                </CardDescription>
                
                <div className="flex items-center space-x-1 mb-3">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{template.rating}</span>
                  <span className="text-xs text-muted-foreground">({template.reviews})</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <div className="flex items-center space-x-1">
                    <Download className="h-3 w-3" />
                    <span className="text-xs text-muted-foreground">{template.downloads.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {template.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {template.originalPrice.toLocaleString()}원
                      </span>
                    )}
                    <span className="text-lg font-bold text-primary">
                      {template.price.toLocaleString()}원
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    by {template.author}
                  </span>
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
        
        {/* 더 보기 */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            더 많은 템플릿 보기
          </Button>
        </div>
      </div>
    </div>
  );
}