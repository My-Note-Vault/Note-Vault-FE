import { Bot, NotebookPen, PanelLeft, PanelLeftClose, Sun, Moon, Search, FolderOpen } from "lucide-react";
import { useTheme } from "next-themes";
import ProfilePopover from "./ProfilePopover";
import { Tooltip } from "@/components/ui/tooltip";

interface ActivityBarProps {
  onSelectItem?: (id: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  searchMode?: boolean;
  onToggleSearch?: () => void;
  onToggleDocs?: () => void;
  chatOpen?: boolean;
  onToggleChat?: () => void;
}

export default function ActivityBar({ onSelectItem, sidebarOpen, onToggleSidebar, searchMode, onToggleSearch, onToggleDocs, chatOpen, onToggleChat }: ActivityBarProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const docsActive = sidebarOpen && !searchMode;
  const searchActive = sidebarOpen && !!searchMode;

  return (
    <aside className="h-screen w-12 bg-sidebar-background border-r border-sidebar-border flex flex-col items-center py-3 gap-2 shrink-0">
      <Tooltip content={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}><button
        onClick={onToggleSidebar}
        className="p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
        aria-label={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
      >
        {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
      </button></Tooltip>
      <Tooltip content="Note 목록"><button
        onClick={onToggleDocs}
        className={`p-2 rounded-md hover:bg-sidebar-accent transition-colors ${docsActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
        aria-label="Note 목록"
      >
        <FolderOpen className="h-5 w-5" />
      </button></Tooltip>
      <Tooltip content="Note 검색"><button
        onClick={onToggleSearch}
        className={`p-2 rounded-md hover:bg-sidebar-accent transition-colors ${searchActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
        aria-label="Note 검색"
      >
        <Search className="h-5 w-5" />
      </button></Tooltip>
      <Tooltip content="오늘의 Daily Note"><button
        onClick={() => onSelectItem?.("daily-notes")}
        className="p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
        aria-label="오늘의 Daily Note"
      >
        <NotebookPen className="h-5 w-5" />
      </button></Tooltip>
      <Tooltip content="Workspace Assistant"><button
        onClick={onToggleChat}
        className={`p-2 rounded-md hover:bg-sidebar-accent transition-colors ${chatOpen ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
        aria-label="Workspace Assistant"
      >
        <Bot className="h-5 w-5" />
      </button></Tooltip>

      <div className="mt-auto flex flex-col items-center gap-2">
        <Tooltip content={isDark ? "라이트 모드" : "다크 모드"}><button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
          aria-label={isDark ? "라이트 모드" : "다크 모드"}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button></Tooltip>
        <ProfilePopover />
      </div>
    </aside>
  );
}
