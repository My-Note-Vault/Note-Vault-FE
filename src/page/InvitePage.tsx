import { useParams, useNavigate } from "react-router-dom";
import { Layout, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useInviteInfo, useAcceptInvite } from "@/hooks/useInvitations";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, redirectToGoogle } = useAuth();
  const { data: info, isLoading, isError } = useInviteInfo(code ?? null);
  const acceptMutation = useAcceptInvite();

  const handleAccept = () => {
    if (!code) return;
    acceptMutation.mutate(code, {
      onSuccess: () => navigate("/app"),
    });
  };

  const handleLogin = async () => {
    // 현재 경로를 저장 후 로그인 리다이렉트
    sessionStorage.setItem("invite_redirect", window.location.pathname);
    await redirectToGoogle();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !info) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <h2 className="text-lg font-semibold">유효하지 않은 초대 링크</h2>
          <p className="text-sm text-muted-foreground">
            초대 링크가 만료되었거나 존재하지 않습니다.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm p-8 rounded-lg border bg-card">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10">
          <Layout className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold">워크스페이스 초대</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{info.workSpaceName}</span>{" "}
            워크스페이스에 초대되었습니다.
          </p>
          {info.expiresAt && (
            <p className="text-xs text-muted-foreground">
              만료: {new Date(info.expiresAt).toLocaleDateString("ko-KR")}
            </p>
          )}
        </div>

        {isLoggedIn ? (
          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            참여하기
          </Button>
        ) : (
          <div className="space-y-3 w-full">
            <p className="text-sm text-muted-foreground">
              참여하려면 먼저 로그인이 필요합니다.
            </p>
            <Button className="w-full" onClick={handleLogin}>
              Google로 로그인
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
