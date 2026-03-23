import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2, AlertTriangle } from "lucide-react";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { loginWithOAuthCode } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state") ?? "";

    if (!code) {
      setError("인증 코드가 없습니다");
      return;
    }

    loginWithOAuthCode(code, state)
      .then(() => {
        window.history.replaceState({}, document.title, "/");
        navigate("/", { replace: true });
      })
      .catch(() => {
        setError("로그인에 실패했습니다. 다시 시도해주세요.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-md border border-border text-sm hover:bg-muted transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">로그인 중...</p>
      </div>
    </div>
  );
}
