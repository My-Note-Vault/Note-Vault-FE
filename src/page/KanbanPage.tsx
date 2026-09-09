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
import { useTranslation } from "react-i18next";

const COLUMN_CONFIG: Record<TaskStatus, { labelKey: string; color: string }> = {
  NOT_STARTED: { labelKey: "kanban.statuses.notStarted", color: "bg-gray-400" },
  IN_PROGRESS: { labelKey: "kanban.statuses.inProgress", color: "bg-blue-500" },
  COMPLETED: { labelKey: "kanban.statuses.completed", color: "bg-green-500" },
};

const COLUMN_ORDER: TaskStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];

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
          Task
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
  const { t } = useTranslation();
  const { columns, isLoading, isError, refetchAll, spaces } = useKanban(selectedSpaceId);

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="flex h-full flex-col p-3 sm:p-6">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-lg font-semibold shrink-0">{t("kanban.title")}</h2>
          <Select
            value={selectedSpaceId ?? ""}
            onValueChange={(v) => setSelectedSpaceId(v)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t("kanban.selectSpace")} />
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
            {t("kanban.selectSpacePrompt")}
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{t("kanban.loadFailed")}</p>
            <button
              onClick={refetchAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("common.retry")}
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-x-visible md:pb-0">
            {COLUMN_ORDER.map((status) => {
              const config = COLUMN_CONFIG[status];
              const items = columns[status];

              return (
                <div
                  key={status}
                  className="flex min-h-0 w-[min(82vw,320px)] shrink-0 flex-col rounded-lg border border-border bg-muted/30 md:w-auto md:shrink"
                >
                  {/* Column header */}
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${config.color}`}
                    />
                    <span className="text-sm font-medium">{t(config.labelKey)}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        {t("common.empty")}
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
