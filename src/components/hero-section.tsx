import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Download, DollarSign } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-vault-primary-light via-vault-secondary-light to-background">
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                완벽한 <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">PDF</span>를 위한
                <br />
                마크다운 에디터
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                A4 포맷에 최적화된 에디터로 이력서와 자소서를 작성하고, 
                완성된 템플릿을 판매하거나 구매하세요.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8 py-6">
                무료로 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                템플릿 둘러보기
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold">A4 최적화</h3>
                <p className="text-sm text-muted-foreground">정확한 PDF 출력</p>
              </div>
              <div className="text-center">
                <Download className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold">PDF 내보내기</h3>
                <p className="text-sm text-muted-foreground">원클릭 다운로드</p>
              </div>
              <div className="text-center">
                <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold">템플릿 거래</h3>
                <p className="text-sm text-muted-foreground">판매 & 구매</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative z-10">
              <img 
                src={heroImage} 
                alt="Note Vault 마크다운 에디터" 
                className="w-full h-auto rounded-2xl shadow-2xl shadow-primary/20"
              />
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary-hover/20 rounded-3xl blur-3xl -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};