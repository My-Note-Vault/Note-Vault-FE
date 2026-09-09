import { Bot, NotebookPen, PanelLeft, PanelLeftClose, Sun, Moon, Search, FolderOpen, Trophy } from "lucide-react";
import { useTheme } from "next-themes";
import ProfilePopover from "./ProfilePopover";
import { Tooltip } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const docsActive = sidebarOpen && !searchMode;
  const searchActive = sidebarOpen && !!searchMode;

  return (
    <aside className="z-50 flex h-dvh w-12 shrink-0 flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar-background py-3 md:h-screen">
      <Tooltip content={sidebarOpen ? t("activity.collapseSidebar") : t("activity.expandSidebar")}><button
        onClick={onToggleSidebar}
        className="p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
        aria-label={sidebarOpen ? t("activity.collapseSidebar") : t("activity.expandSidebar")}
      >
        {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
      </button></Tooltip>
      <Tooltip content={t("activity.notes")}><button
        onClick={onToggleDocs}
        className={`p-2 rounded-md hover:bg-sidebar-accent transition-colors ${docsActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
        aria-label={t("activity.notes")}
      >
        <FolderOpen className="h-5 w-5" />
      </button></Tooltip>
      <Tooltip content={t("activity.search")}><button
        onClick={onToggleSearch}
        className={`p-2 rounded-md hover:bg-sidebar-accent transition-colors ${searchActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
        aria-label={t("activity.search")}
      >
        <Search className="h-5 w-5" />
      </button></Tooltip>
      <Tooltip content={t("activity.dailyNote")}><button
        onClick={() => onSelectItem?.("daily-notes")}
        className="p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
        aria-label={t("activity.dailyNote")}
      >
        <NotebookPen className="h-5 w-5" />
      </button></Tooltip>
      <Tooltip content={t("activity.drawResults")}><button
        onClick={() => onSelectItem?.("draw-results")}
        className="p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
        aria-label={t("activity.drawResults")}
      >
        <Trophy className="h-5 w-5" />
      </button></Tooltip>
      <Tooltip content={t("activity.assistant")}><button
        onClick={onToggleChat}
        className={`p-2 rounded-md hover:bg-sidebar-accent transition-colors ${chatOpen ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
        aria-label={t("activity.assistant")}
      >
        <Bot className="h-5 w-5" />
      </button></Tooltip>

      <div className="mt-auto flex flex-col items-center gap-2">
        <Tooltip content={isDark ? t("activity.lightMode") : t("activity.darkMode")}><button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
          aria-label={isDark ? t("activity.lightMode") : t("activity.darkMode")}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button></Tooltip>
        <ProfilePopover />
      </div>
    </aside>
  );
}
