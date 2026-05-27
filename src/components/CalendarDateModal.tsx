import { Loader2, Calendar, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDateEvents, useDailyNoteByDate } from "@/hooks/useCalendar";
import type { DateEventResponse } from "@/types/calendar";
import type { TaskStatus, DocType } from "@/types/common";

const STATUS_MAP: Record<TaskStatus, { label: string; color: string }> = {
  NOT_STARTED: { label: "할 일", color: "bg-gray-400" },
  IN_PROGRESS: { label: "진행 중", color: "bg-blue-500" },
  COMPLETED: { label: "완료", color: "bg-green-500" },
};

interface CalendarDateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string | null; // "YYYY-MM-DD"
  onOpenDocument: (id: string, docType?: DocType) => void;
}

function EventItem({
  event,
  onOpenDocument,
  onClose,
}: {
  event: DateEventResponse;
  onOpenDocument: (id: string, docType?: DocType) => void;
  onClose: () => void;
}) {
  const docType: DocType = event.type === "TASK" ? "task" : "subtask";
  const status = STATUS_MAP[event.status] ?? STATUS_MAP.NOT_STARTED;

  return (
    <button
      onClick={() => {
        onOpenDocument(`${docType}-${event.id}`, docType);
        onClose();
      }}
      className="w-full text-left px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={cn(
            "shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded",
            event.type === "TASK"
              ? "bg-primary/10 text-primary"
              : "bg-orange-500/10 text-orange-600 dark:text-orange-400",
          )}
        >
          {event.type === "TASK" ? "Task" : "SubTask"}
        </span>
        <span className="text-sm font-medium truncate flex-1">{event.title}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground ml-0.5">
        <span className="flex items-center gap-1">
          <span className={cn("h-1.5 w-1.5 rounded-full", status.color)} />
          {status.label}
        </span>
        {event.startDate && (
          <span>{event.startDate}</span>
        )}
        {event.startDate && event.endDate && <span>~</span>}
        {event.endDate && (
          <span>{event.endDate}</span>
        )}
      </div>

      {event.parentTask && (
        <div className="text-[11px] text-muted-foreground/70 mt-1 ml-0.5 truncate">
          Task: {event.parentTask.title}
        </div>
      )}
    </button>
  );
}

export default function CalendarDateModal({
  open,
  onOpenChange,
  date,
  onOpenDocument,
}: CalendarDateModalProps) {
  const { data: events, isLoading: eventsLoading } = useDateEvents(open ? date : null);
  const { data: dailyNote, isLoading: dailyLoading } = useDailyNoteByDate(open ? date : null);

  const isLoading = eventsLoading || dailyLoading;
  const hasEvents = events && events.length > 0;
  const hasDailyNote = !!dailyNote?.dailyNoteId;
  const isEmpty = !hasEvents && !hasDailyNote;

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-lg p-0 gap-0 overflow-hidden",
          hasEvents && hasDailyNote && "sm:max-w-2xl",
        )}
      >
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {date}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {date} 일정
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Calendar className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">일정이 없습니다</p>
          </div>
        ) : (
          <div className={cn("flex", hasEvents && hasDailyNote ? "divide-x divide-border" : "")}>
            {/* Task/SubTask 목록 */}
            {hasEvents && (
              <div className={cn(
                "flex-1 min-w-0 px-3 pb-4",
                hasDailyNote ? "max-h-[400px] overflow-y-auto" : "max-h-[400px] overflow-y-auto",
              )}>
                <div className="sticky top-0 bg-background pt-1 pb-2 px-1">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    일정 ({events.length})
                  </h3>
                </div>
                <div className="space-y-0.5">
                  {events.map((event) => (
                    <EventItem
                      key={`${event.type}-${event.id}`}
                      event={event}
                      onOpenDocument={onOpenDocument}
                      onClose={handleClose}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* DailyNote 영역 */}
            {hasDailyNote && (
              <div className={cn(
                "flex-1 min-w-0 px-3 pb-4 max-h-[400px] overflow-y-auto",
                !hasEvents && "w-full",
              )}>
                <div className="sticky top-0 bg-background pt-1 pb-2 px-1">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Daily Note
                  </h3>
                </div>
                <button
                  onClick={() => {
                    onOpenDocument(`daily-${date}`);
                    handleClose();
                  }}
                  className="w-full text-left px-3 py-3 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start gap-1">
                    {dailyNote.content ? (
                      <p className="flex-1 text-xs text-muted-foreground line-clamp-6 whitespace-pre-wrap break-words">
                        {dailyNote.content}
                      </p>
                    ) : (
                      <p className="flex-1 text-xs text-muted-foreground/50 italic">
                        내용 없음
                      </p>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                  </div>
                  {(() => {
                    const pending = dailyNote.plans?.filter((p) => p.type === "PENDING").length ?? 0;
                    const todo = dailyNote.plans?.filter((p) => p.type === "TODO").length ?? 0;
                    if (!pending && !todo) return null;
                    return (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground/70">
                        {pending > 0 && <span>Pending {pending}건</span>}
                        {todo > 0 && <span>Todo {todo}건</span>}
                      </div>
                    );
                  })()}
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
