import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit3, Eye, Download, ShoppingCart, Users, Zap } from "lucide-react";

const features = [
  {
    icon: Edit3,
    title: "실시간 마크다운 편집",
    description: "직관적인 마크다운 에디터로 빠르고 편리하게 문서를 작성하세요."
  },
  {
    icon: Eye,
    title: "A4 실시간 미리보기",
    description: "A4 포맷으로 실시간 미리보기를 통해 최종 결과물을 확인하세요."
  },
  {
    icon: Download,
    title: "완벽한 PDF 내보내기",
    description: "편집 화면과 동일한 포맷으로 고품질 PDF를 생성합니다."
  },
  {
    icon: ShoppingCart,
    title: "템플릿 마켓플레이스",
    description: "전문적인 이력서 템플릿을 구매하거나 직접 제작한 템플릿을 판매하세요."
  },
  {
    icon: Users,
    title: "커뮤니티 기반",
    description: "취준생들이 서로 도움을 주고받는 활발한 커뮤니티입니다."
  },
  {
    icon: Zap,
    title: "빠른 시작",
    description: "복잡한 설치 없이 웹브라우저에서 바로 시작할 수 있습니다."
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-vault-primary-light/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            취준생을 위한 <span className="text-primary">완벽한 도구</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            이력서 작성부터 PDF 내보내기, 템플릿 거래까지 모든 기능을 한 곳에서
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};