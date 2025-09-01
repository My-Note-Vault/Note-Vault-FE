import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

const benefits = [
  "무료로 시작, 언제든 업그레이드",
  "클라우드 자동 저장",
  "무제한 PDF 내보내기",
  "프리미엄 템플릿 액세스"
];

export const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-primary-hover">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            지금 시작해서 완벽한 이력서를 만들어보세요
          </h2>
          <p className="text-xl mb-8 opacity-90">
            수천 명의 취준생들이 Note Vault로 꿈의 직장에 합격했습니다.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              무료로 시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-primary">
              데모 보기
            </Button>
          </div>
          
          <p className="mt-6 text-sm opacity-75">
            신용카드 불필요 • 언제든 취소 가능
          </p>
        </div>
      </div>
    </section>
  );
};