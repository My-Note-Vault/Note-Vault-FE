import { CalendarDays, PanelLeft, PanelLeftClose, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import ProfilePopover from "./ProfilePopover";

interface ActivityBarProps {
  onSelectItem?: (id: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function ActivityBar({ onSelectItem, sidebarOpen, onToggleSidebar }: ActivityBarProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

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
        onClick={() => onSelectItem?.("daily-notes")}
        className="p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
        title="오늘의 DailyNote"
      >
        <CalendarDays className="h-5 w-5" />
      </button>

      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
          title={isDark ? "라이트 모드" : "다크 모드"}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <ProfilePopover />
      </div>
    </aside>
  );
}
