import { useState } from "react";
import { Copy, Check, Trash2, Loader2, Link } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInviteLinks, useCreateInviteLink, useRevokeInviteLink } from "@/hooks/useInvitations";
import { buildShareUrl } from "@/api/invitations";

interface InviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

const EXPIRY_OPTIONS = [
  { value: "none", label: "만료 없음" },
  { value: "1d", label: "1일" },
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
] as const;

function getExpiresAt(option: string): string | null {
  if (option === "none") return null;
  const days = parseInt(option);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "만료 없음";
  const date = new Date(expiresAt);
  const now = new Date();
  if (date < now) return "만료됨";
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function InviteDialog({ isOpen, onClose, workspaceId, workspaceName }: InviteDialogProps) {
  const [expiry, setExpiry] = useState("none");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: links = [], isLoading } = useInviteLinks(isOpen ? workspaceId : null);
  const createMutation = useCreateInviteLink();
  const revokeMutation = useRevokeInviteLink();

  const handleCreate = () => {
    createMutation.mutate({
      workspaceId,
      expiresAt: getExpiresAt(expiry),
    });
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(buildShareUrl(code));
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRevoke = (code: string) => {
    revokeMutation.mutate({ workspaceId, code });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>워크스페이스 초대</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{workspaceName}</span>에 멤버를 초대할 링크를 생성합니다.
          </DialogDescription>
        </DialogHeader>

        {/* 링크 생성 */}
        <div className="flex items-center gap-2">
          <Select value={expiry} onValueChange={setExpiry}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPIRY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            size="sm"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link className="h-4 w-4" />
            )}
            <span className="ml-1.5">링크 생성</span>
          </Button>
        </div>

        {/* 링크 목록 */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              불러오는 중...
            </div>
          ) : links.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              생성된 초대 링크가 없습니다
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.code}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate font-mono text-xs text-muted-foreground">
                    {buildShareUrl(link.code)}
                  </div>
                  <div className="text-xs text-muted-foreground/70 mt-0.5">
                    {formatExpiry(link.expiresAt)}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(link.code)}
                  className="p-1.5 rounded-md hover:bg-accent transition-colors shrink-0"
                  title="복사"
                >
                  {copiedCode === link.code ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleRevoke(link.code)}
                  disabled={revokeMutation.isPending}
                  className="p-1.5 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                  title="삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
