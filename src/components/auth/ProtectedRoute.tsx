import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useMemberProfile } from "@/hooks/useMember";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const { data: profile, isLoading } = useMemberProfile();

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

  // nickname이 null이거나 빈 문자열인 경우 프로필 설정으로 이동
  if (profile && !profile.nickname) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <>{children}</>;
}
