import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useMemberProfile } from "@/hooks/useMember";
import ProfileLoadError from "@/components/auth/ProfileLoadError";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export default function ProfileSetupRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, logout } = useAuth();
  const { data: profile, isLoading, isError, refetch } = useMemberProfile();

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !profile) {
    return <ProfileLoadError onRetry={() => void refetch()} onLogout={logout} />;
  }

  // profile 조회는 성공했지만 nickname이 비어있는 경우에만 프로필 설정 페이지 표시
  if (!profile.nickname) {
    return <>{children}</>;
  }

  // 초대 링크에서 로그인한 경우 초대 페이지로 복귀
  const inviteRedirect = sessionStorage.getItem("invite_redirect");
  if (inviteRedirect) {
    sessionStorage.removeItem("invite_redirect");
    return <Navigate to={inviteRedirect} replace />;
  }

  return <Navigate to="/app" replace />;
}
