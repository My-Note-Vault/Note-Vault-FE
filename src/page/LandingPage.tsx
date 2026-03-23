import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FileText, Columns3, CalendarDays, Search, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "계층형 문서 관리",
    description: "Space, Task, SubTask, Trivia로 이어지는 계층 구조로 생각을 체계적으로 정리하세요.",
  },
  {
    icon: Columns3,
    title: "칸반 보드",
    description: "할 일, 진행 중, 완료, 보류 상태로 업무 현황을 한눈에 파악하세요.",
  },
  {
    icon: CalendarDays,
    title: "캘린더 & 데일리 노트",
    description: "일정 기반으로 작업을 관리하고, 매일의 기록을 남기세요.",
  },
  {
    icon: Search,
    title: "전체 검색",
    description: "모든 문서를 빠르게 검색해 필요한 정보를 즉시 찾으세요.",
  },
];

export default function LandingPage() {
  const { login, redirectToGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    redirectToGoogle();
  };

  const handleDevLogin = () => {
    login("MOCK_DEV_JWT_TOKEN");
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-32 pb-24">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center leading-tight">
          생각을 정리하고,
          <br />
          <span className="text-primary">업무를 관리하세요</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground text-center max-w-md">
          문서, 일정, 칸반 보드를 하나의 공간에서.
          <br />
          가볍고 빠른 워크스페이스를 경험해 보세요.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center gap-3 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-base shadow-sm hover:opacity-90 transition-opacity"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 시작하기
            <ArrowRight className="h-4 w-4" />
          </button>

          {import.meta.env.DEV && (
            <button
              onClick={handleDevLogin}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              Dev 로그인
            </button>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
            >
              <feature.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-base mb-1.5">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border py-16 text-center">
        <p className="text-muted-foreground text-sm">
          지금 바로 시작하세요 — 무료로 이용할 수 있습니다.
        </p>
      </section>
    </div>
  );
}
