import { useState } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKanban, type KanbanItem } from "@/hooks/useKanban";
import type { DocType, TaskStatus } from "@/types/common";

const COLUMN_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: "할 일", color: "bg-gray-400" },
  in_progress: { label: "진행 중", color: "bg-blue-500" },
  done: { label: "완료", color: "bg-green-500" },
  hold: { label: "보류", color: "bg-yellow-500" },
};

const COLUMN_ORDER: TaskStatus[] = ["todo", "in_progress", "done", "hold"];

const TYPE_LABEL: Record<string, string> = {
  task: "Task",
  subtask: "SubTask",
};

interface KanbanPageProps {
  onOpenDocument: (id: string, docType?: DocType) => void;
}

function KanbanCard({
  item,
  onClick,
}: {
  item: KanbanItem;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="border border-border rounded-lg p-3 bg-card hover:bg-accent/50 cursor-pointer transition-colors shadow-sm"
    >
      <p className="text-sm font-medium truncate">{item.name}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
          {TYPE_LABEL[item.type]}
        </span>
        {item.parentName && (
          <span className="text-[11px] text-muted-foreground truncate">
            {item.parentName}
          </span>
        )}
      </div>
    </div>
  );
}

export default function KanbanPage({ onOpenDocument }: KanbanPageProps) {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const { columns, isLoading, isError, refetchAll, spaces } = useKanban(selectedSpaceId);

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-lg font-semibold shrink-0">Kanban</h2>
          <Select
            value={selectedSpaceId ?? ""}
            onValueChange={(v) => setSelectedSpaceId(v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Space 선택" />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((space) => (
                <SelectItem key={space.id} value={space.id}>
                  {space.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Board */}
        {!selectedSpaceId ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Space를 선택하세요
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">칸반 데이터를 불러오지 못했습니다</p>
            <button
              onClick={refetchAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              다시 시도
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
            {COLUMN_ORDER.map((status) => {
              const config = COLUMN_CONFIG[status];
              const items = columns[status];

              return (
                <div
                  key={status}
                  className="flex flex-col min-h-0 rounded-lg bg-muted/30 border border-border"
                >
                  {/* Column header */}
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${config.color}`}
                    />
                    <span className="text-sm font-medium">{config.label}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        항목 없음
                      </p>
                    ) : (
                      items.map((item) => (
                        <KanbanCard
                          key={item.id}
                          item={item}
                          onClick={() => onOpenDocument(item.id, item.type as DocType)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
