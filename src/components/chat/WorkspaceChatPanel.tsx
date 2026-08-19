import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Bot, FileText, LoaderCircle, Send, X } from "lucide-react";
import { askWorkspaceChat, type WorkspaceChatSource } from "@/api/workspaceChat";
import type { DocType } from "@/types/common";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: WorkspaceChatSource[];
}

interface WorkspaceChatPanelProps {
  onClose: () => void;
  onOpenDocument: (id: string, type?: DocType) => void;
}

export default function WorkspaceChatPanel({ onClose, onOpenDocument }: WorkspaceChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setQuestion("");
    setError(null);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isSending) return;

    setQuestion("");
    setError(null);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: trimmed }]);
    setIsSending(true);
    try {
      const response = await askWorkspaceChat(trimmed);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.answer,
        sources: response.sources,
      }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "답변을 가져오지 못했습니다.");
      setQuestion(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <aside className="flex h-screen w-[380px] shrink-0 flex-col border-l border-border bg-background">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
        <Bot className="h-4 w-4 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium">Workspace Assistant</h2>
          <p className="text-[11px] text-muted-foreground">인덱싱된 문서를 기준으로 답변합니다</p>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="챗봇 닫기">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center px-5 text-center">
            <div className="mb-3 rounded-xl border border-border bg-muted/40 p-3">
              <Bot className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">문서에 관해 질문해 보세요</p>
            <p className="mt-1.5 max-w-[260px] text-xs leading-5 text-muted-foreground">
              참여 중인 워크스페이스와 Daily Note에서 관련 내용을 찾아 출처와 함께 답변합니다.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={message.role === "user"
                ? "max-w-[88%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm text-primary-foreground"
                : "max-w-full text-sm text-foreground"}>
                <p className="whitespace-pre-wrap leading-6">{message.content}</p>
                {!!message.sources?.length && (
                  <div className="mt-3 space-y-1.5 border-t border-border pt-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sources</p>
                    {message.sources.map((source) => (
                      <button
                        key={`${message.id}-${source.chunkId}`}
                        onClick={() => source.sourceType === "DAILY_NOTE"
                          ? onOpenDocument(`daily-${source.resourceId}`)
                          : onOpenDocument(String(source.resourceId), source.resourceType as DocType)}
                        className="flex w-full items-start gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2 text-left hover:bg-muted"
                      >
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium">[{source.number}] {source.title}</span>
                          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-muted-foreground">{source.excerpt}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              문서를 검색하고 답변을 작성하는 중...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={submit} className="shrink-0 border-t border-border p-3">
        {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
        <div className="rounded-xl border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            maxLength={4000}
            rows={3}
            placeholder="워크스페이스 문서에 질문하기"
            className="w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="flex items-center justify-between px-2.5 pb-2">
            <span className="text-[10px] text-muted-foreground">Enter 전송 · Shift+Enter 줄바꿈</span>
            <button
              type="submit"
              disabled={!question.trim() || isSending}
              className="rounded-md bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="질문 전송"
            >
              {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </form>
    </aside>
  );
}
