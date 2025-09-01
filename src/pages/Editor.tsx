import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Eye, Save, Settings } from "lucide-react";
import { Navigation } from "@/components/ui/navigation";

const defaultMarkdown = `# 김철수
**이메일**: kimcs@email.com | **전화**: 010-1234-5678  
**주소**: 서울시 강남구 | **LinkedIn**: linkedin.com/in/kimcs

---

## 경력 요약
5년차 프론트엔드 개발자로서 React, TypeScript, Next.js를 활용한 웹 애플리케이션 개발 경험이 있습니다. 사용자 경험을 중시하며 성능 최적화에 관심이 많습니다.

---

## 기술 스택
- **Frontend**: React, TypeScript, Next.js, Vue.js
- **Styling**: Tailwind CSS, Styled-components, SCSS
- **Tools**: Git, Docker, Webpack, Vite
- **Backend**: Node.js, Express, MongoDB

---

## 경력 사항

### ABC 테크 | 시니어 프론트엔드 개발자
*2022.03 - 현재*
- React 기반 B2B SaaS 플랫폼 개발 및 유지보수
- 사용자 중심의 UI/UX 개선으로 사용자 만족도 30% 향상
- TypeScript 도입으로 코드 품질 및 개발 생산성 20% 개선

### XYZ 스타트업 | 프론트엔드 개발자
*2019.06 - 2022.02*
- E-commerce 웹사이트 개발 및 성능 최적화
- 모바일 반응형 웹 구현으로 모바일 전환율 25% 증가
- Redux 상태 관리 시스템 구축

---

## 프로젝트

### 온라인 쇼핑몰 플랫폼 개발
*2023.01 - 2023.06*
- **기술 스택**: React, TypeScript, Next.js, Tailwind CSS
- **주요 성과**: 페이지 로딩 속도 40% 개선, SEO 점수 95점 달성
- **담당 업무**: 프론트엔드 아키텍처 설계, 컴포넌트 라이브러리 구축

---

## 학력
**OO 대학교** | 컴퓨터공학과 졸업  
*2015.03 - 2019.02*

---

## 자격증
- 정보처리기사 (2019)
- AWS Certified Developer (2022)
`;

export default function Editor() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleExportPDF = () => {
    // PDF 내보내기 기능 (추후 구현)
    console.log("PDF Export triggered");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex h-[calc(100vh-73px)]">
        {/* 에디터 섹션 */}
        <div className="flex-1 flex flex-col border-r">
          {/* 툴바 */}
          <div className="border-b p-4 flex items-center justify-between bg-muted/30">
            <h2 className="text-lg font-semibold">마크다운 에디터</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                저장
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                설정
              </Button>
            </div>
          </div>
          
          {/* 에디터 */}
          <div className="flex-1 p-4">
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-full resize-none border-0 focus-visible:ring-0 font-mono text-sm"
              placeholder="마크다운으로 문서를 작성해보세요..."
            />
          </div>
        </div>
        
        {/* A4 미리보기 섹션 */}
        <div className="w-1/2 flex flex-col">
          {/* 미리보기 툴바 */}
          <div className="border-b p-4 flex items-center justify-between bg-muted/30">
            <h2 className="text-lg font-semibold">A4 미리보기</h2>
            <div className="flex items-center space-x-2">
              <Button 
                variant={isPreviewMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? "편집 모드" : "미리보기"}
              </Button>
              <Button onClick={handleExportPDF} size="sm">
                <Download className="h-4 w-4 mr-2" />
                PDF 내보내기
              </Button>
            </div>
          </div>
          
          {/* A4 미리보기 */}
          <div className="flex-1 p-4 bg-vault-gray-light overflow-auto">
            <div className="mx-auto bg-white shadow-lg" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: markdown
                    .replace(/^# (.+)$/gm, '<h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">$1</h1>')
                    .replace(/^## (.+)$/gm, '<h2 style="font-size: 18px; font-weight: bold; margin: 16px 0 8px 0; border-bottom: 1px solid #ddd; padding-bottom: 4px;">$2</h2>')
                    .replace(/^### (.+)$/gm, '<h3 style="font-size: 16px; font-weight: bold; margin: 12px 0 4px 0;">$3</h3>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/^- (.+)$/gm, '<li style="margin: 2px 0;">$1</li>')
                    .replace(/---/g, '<hr style="margin: 16px 0; border: none; border-top: 1px solid #ddd;">')
                    .replace(/\n/g, '<br>')
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}