import { CalendarDays, PanelLeft, PanelLeftClose } from "lucide-react";
import ProfilePopover from "./ProfilePopover";

interface ActivityBarProps {
  onSelectItem?: (id: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function ActivityBar({ onSelectItem, sidebarOpen, onToggleSidebar }: ActivityBarProps) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  return (
    <aside className="h-screen w-12 bg-sidebar-background border-r border-sidebar-border flex flex-col items-center py-3 gap-2 shrink-0">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
        title={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
      >
        {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
      </button>
      <button
        onClick={() => onSelectItem?.(`daily-${today}`)}
        className="p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
        title="오늘의 DailyNote"
      >
        <CalendarDays className="h-5 w-5" />
      </button>

      <div className="mt-auto">
        <ProfilePopover />
      </div>
    </aside>
  );
}
