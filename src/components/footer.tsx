import { FileText, Twitter, Github, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Note Vault</span>
            </Link>
            <p className="text-muted-foreground">
              취준생을 위한 완벽한 마크다운 에디터. 
              이력서 작성부터 PDF 내보내기까지.
            </p>
            <div className="flex space-x-3">
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Github className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Mail className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">제품</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/editor" className="hover:text-primary transition-colors">에디터</Link></li>
              <li><Link to="/templates" className="hover:text-primary transition-colors">템플릿</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">마켓플레이스</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">요금제</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">지원</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/help" className="hover:text-primary transition-colors">도움말</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">문의하기</Link></li>
              <li><Link to="/community" className="hover:text-primary transition-colors">커뮤니티</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors">블로그</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">회사</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">회사소개</Link></li>
              <li><Link to="/careers" className="hover:text-primary transition-colors">채용</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">개인정보처리방침</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">이용약관</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Note Vault. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};