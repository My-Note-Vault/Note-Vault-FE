import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ReactNode } from "react";

export default function PublicRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, isOAuthLoading } = useAuth();

  if (isOAuthLoading) {
    return null;
  }

  if (isLoggedIn) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
