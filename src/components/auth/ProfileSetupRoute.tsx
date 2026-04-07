import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useMemberProfile } from "@/hooks/useMember";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export default function ProfileSetupRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const { data: profile, isLoading, isError } = useMemberProfile();

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

  // 회원가입 직후 profile이 없거나 에러인 경우 프로필 설정 페이지 표시
  if (isError || !profile || profile.nickname === null) {
    return <>{children}</>;
  }

  return <Navigate to="/app" replace />;
}
