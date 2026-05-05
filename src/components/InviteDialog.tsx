import { useState } from "react";
import { Copy, Check, Loader2, Link } from "lucide-react";
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
import { useCreateInviteLink } from "@/hooks/useInvitations";
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

export default function InviteDialog({ isOpen, onClose, workspaceId, workspaceName }: InviteDialogProps) {
  const [expiry, setExpiry] = useState("none");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createMutation = useCreateInviteLink();

  const handleCreate = () => {
    createMutation.mutate(
      { workspaceId, expiresAt: getExpiresAt(expiry) },
      { onSuccess: (data) => setGeneratedCode(data.code) },
    );
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(buildShareUrl(generatedCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {generatedCode && (
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <div className="flex-1 min-w-0 truncate font-mono text-xs text-muted-foreground">
              {buildShareUrl(generatedCode)}
            </div>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-accent transition-colors shrink-0"
              title="복사"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
