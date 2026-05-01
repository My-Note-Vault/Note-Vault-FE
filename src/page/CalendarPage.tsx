import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
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
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCalendarStats } from "@/hooks/useDocuments";
import type { CalendarDateStat, DocType } from "@/types/common";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface CalendarPageProps {
  onOpenDocument: (id: string, docType?: DocType) => void;
}

export default function CalendarPage({ onOpenDocument }: CalendarPageProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;
  const { data: stats = [], isLoading, isError, refetch } = useCalendarStats(year, month);

  const statsMap = useMemo(() => {
    const map = new Map<string, CalendarDateStat>();
    for (const s of stats) {
      map.set(s.date, s);
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
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">
              {format(currentMonth, "yyyy년 M월", { locale: ko })}
            </h2>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs rounded-md border border-border hover:bg-muted transition-colors"
            >
              오늘
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
          {WEEKDAYS.map((d, i) => (
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
            <p className="text-sm text-muted-foreground">일정을 불러오지 못했습니다</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              다시 시도
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

              return (
                <div
                  key={dateStr}
                  onClick={() => onOpenDocument(`daily-${dateStr}`)}
                  className={cn(
                    "min-h-[90px] p-2 border-r border-b border-border cursor-pointer transition-colors hover:bg-muted/50",
                    !inMonth && "opacity-35 bg-muted/20",
                    today && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                  )}
                >
                  <div
                    className={cn(
                      "text-sm mb-1.5",
                      today && "font-bold text-primary",
                      !today && dayOfWeek === 0 && "text-red-400",
                      !today && dayOfWeek === 6 && "text-blue-400",
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {stat && stat.startCount > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-xs text-blue-600 dark:text-blue-400 truncate">
                          시작 {stat.startCount}
                        </span>
                      </div>
                    )}
                    {stat && stat.endCount > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                        <span className="text-xs text-red-500 dark:text-red-400 truncate">
                          마감 {stat.endCount}
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
    </div>
  );
}
