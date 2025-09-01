import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Search, User, ShoppingBag } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
              Note Vault
            </span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/editor" className="text-muted-foreground hover:text-foreground transition-colors">
              에디터
            </Link>
            <Link to="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors">
              마켓플레이스
            </Link>
            <Link to="/templates" className="text-muted-foreground hover:text-foreground transition-colors">
              템플릿
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-5 w-5" />
            </Button>
            <Button variant="outline">
              로그인
            </Button>
            <Button variant="default">
              시작하기
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};