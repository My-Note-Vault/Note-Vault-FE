import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, RefreshCw, NotebookPen } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useCalendarStats, useDailyNotes } from "@/hooks/useDocuments";
import CalendarDateModal from "@/components/CalendarDateModal";
import type { CalendarDateStat, DocType } from "@/types/common";
import { useTranslation } from "react-i18next";

interface CalendarPageProps {
  onOpenDocument: (id: string, docType?: DocType) => void;
}

export default function CalendarPage({ onOpenDocument }: CalendarPageProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const { t, i18n } = useTranslation();
  const weekdays = t("calendar.weekdays", { returnObjects: true }) as string[];
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;
  const { data: stats = {}, isLoading, isError, refetch } = useCalendarStats(year, month);
  const { data: dailyNotes = [] } = useDailyNotes();

  const dailyNoteDates = useMemo(() => {
    const set = new Set<string>();
    for (const dn of dailyNotes) {
      const [y, m, d] = dn.logicalDate;
      set.add(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return set;
  }, [dailyNotes]);

  const statsMap = useMemo(() => {
    const map = new Map<string, CalendarDateStat>();
    for (const [date, stat] of Object.entries(stats)) {
      map.set(date, stat);
    }
    return map;
  }, [stats]);

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

    const result: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      result.push(allDays.slice(i, i + 7));
    }
    return result;
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const handleToday = () => setCurrentMonth(new Date());

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-4xl p-3 sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-base font-semibold sm:text-lg">
              {new Intl.DateTimeFormat(i18n.resolvedLanguage, { year: "numeric", month: "long" }).format(currentMonth)}
            </h2>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs rounded-md border border-border hover:bg-muted transition-colors"
            >
              {t("calendar.today")}
            </button>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {weekdays.map((d, i) => (
            <div
              key={d}
              className={cn(
                "text-center text-sm font-medium py-2",
                i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-muted-foreground",
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{t("calendar.loadFailed")}</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("common.retry")}
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-7 border-t border-l border-border">
            {weeks.flat().map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const stat = statsMap.get(dateStr);
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const dayOfWeek = day.getDay();
              const hasDailyNote = dailyNoteDates.has(dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    "min-h-[54px] p-1 border-r border-b border-border cursor-pointer transition-colors hover:bg-muted/50 sm:min-h-[90px] sm:p-2",
                    !inMonth && "opacity-35 bg-muted/20",
                    today && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between sm:mb-1.5">
                    <span
                      className={cn(
                        "text-sm",
                        today && "font-bold text-primary",
                        !today && dayOfWeek === 0 && "text-red-400",
                        !today && dayOfWeek === 6 && "text-blue-400",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {hasDailyNote && (
                      <NotebookPen className="h-3 w-3 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {stat && (stat.START ?? 0) > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        <span className="hidden truncate text-xs text-blue-600 dark:text-blue-400 sm:inline">
                          {t("calendar.start", { count: stat.START })}
                        </span>
                      </div>
                    )}
                    {stat && (stat.END ?? 0) > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                        <span className="hidden truncate text-xs text-red-500 dark:text-red-400 sm:inline">
                          {t("calendar.end", { count: stat.END })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CalendarDateModal
        open={selectedDate !== null}
        onOpenChange={(open) => { if (!open) setSelectedDate(null); }}
        date={selectedDate}
        onOpenDocument={onOpenDocument}
      />
    </div>
  );
}
