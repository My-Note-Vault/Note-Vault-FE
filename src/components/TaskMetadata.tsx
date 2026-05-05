import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/common";

export type { TaskStatus };

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: "NOT_STARTED", label: "할 일", color: "bg-gray-400" },
  { value: "IN_PROGRESS", label: "진행 중", color: "bg-blue-500" },
  { value: "COMPLETED", label: "완료", color: "bg-green-500" },
];

export interface TaskMetadataValues {
  status: TaskStatus;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface TaskMetadataProps {
  value: TaskMetadataValues;
  onChange: (value: TaskMetadataValues) => void;
}

function DatePicker({
  label,
  date,
  onSelect,
}: {
  label: string;
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex h-8 items-center gap-2 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarDays className="h-3.5 w-3.5 opacity-60" />
          {date ? format(date, "yyyy-MM-dd", { locale: ko }) : label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onSelect(d);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export default function TaskMetadata({ value, onChange }: TaskMetadataProps) {
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === value.status);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-12 pt-3 pb-2">
      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">상태</span>
        <Select
          value={value.status}
          onValueChange={(v) => onChange({ ...value, status: v as TaskStatus })}
        >
          <SelectTrigger className="w-[120px]">
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", currentStatus?.color)} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", opt.color)} />
                  {opt.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Start Date */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">시작일</span>
        <DatePicker
          label="날짜 선택"
          date={value.startDate}
          onSelect={(d) => onChange({ ...value, startDate: d })}
        />
      </div>

      {/* End Date */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">마감일</span>
        <DatePicker
          label="날짜 선택"
          date={value.endDate}
          onSelect={(d) => onChange({ ...value, endDate: d })}
        />
      </div>
    </div>
  );
}
