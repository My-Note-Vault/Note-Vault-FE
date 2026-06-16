import { AlertTriangle, LogOut, RefreshCw } from "lucide-react";

interface ProfileLoadErrorProps {
  onRetry: () => void;
  onLogout: () => void;
}

export default function ProfileLoadError({
  onRetry,
  onLogout,
}: ProfileLoadErrorProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">프로필을 불러오지 못했습니다</h2>
          <p className="text-sm text-muted-foreground">
            로그인 상태가 만료되었거나 일시적으로 서버에 연결할 수 없습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
