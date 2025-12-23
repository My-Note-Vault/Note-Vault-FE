import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Star, Download, Eye, ThumbsUp } from "lucide-react";
import { Navigate } from "react-router-dom";
import { getTemplates, toggleLike } from "@/api/template";


const categories = ["전체", "무료", "유료"];
const sortOptions = [
  { value: "popular", label: "인기순" },
  { value: "price-low", label: "낮은 가격순" },
  { value: "price-high", label: "높은 가격순" },
];
const tagOptions = [
  { value: "all", label: "전체" },
  { value: "이력서", label: "이력서" },
  { value: "자소서", label: "자소서" },
  { value: "포트폴리오", label: "포트폴리오" },
];

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedTag, setSelectedTag] = useState("all");
  const [likes, setLikes] = useState<number[]>([]);

  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getTemplates();
      setTemplates(data);
    })();
  }, []);

  const handleLike = async (id) => {
    await toggleLike(id);
    const updated = await getTemplates();
    setTemplates(updated);
  };

  // ✅ LocalStorage에서 좋아요 불러오기
  useEffect(() => {
    const stored = localStorage.getItem("likes");
    if (stored) setLikes(JSON.parse(stored));
  }, []);

  // ✅ 좋아요 토글
  const toggleLike = (id: number) => {
    const updated = likes.includes(id)
      ? likes.filter((lid) => lid !== id)
      : [...likes, id];
    setLikes(updated);
    localStorage.setItem("likes", JSON.stringify(updated));
  };

  // ✅ 필터링 로직
  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (selectedCategory === "무료") result = result.filter((t) => t.price === 0);
    if (selectedCategory === "유료") result = result.filter((t) => t.price > 0);
    if (selectedTag !== "all") result = result.filter((t) => t.tags.includes(selectedTag));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    if (sortBy === "price-low") result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === "popular") result = [...result].sort((a, b) => b.downloads - a.downloads);

    return result;
  }, [selectedCategory, selectedTag, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 pt-[120px]">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">템플릿 마켓플레이스</h1>
          <p className="text-muted-foreground">
            마음에 드는 템플릿을 찾아 <span className="text-primary font-semibold">좋아요</span>를 눌러보세요 👍
          </p>
        </div>

        {/* 검색 + 필터 */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="템플릿 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="정렬 기준" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="태그 선택" />
              </SelectTrigger>
              <SelectContent>
                {tagOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

        {/* 카드 리스트 */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              onClick={() => navigate(`/template/${template.id}`)}   // ⭐ 상세 페이지 이동
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleLike(template.id)}
                  >
                    <ThumbsUp
                      className={`h-4 w-4 transition ${
                        likes.includes(template.id)
                          ? "fill-blue-500 text-blue-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </Button>
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
      </div>
    </div>
  );
}
