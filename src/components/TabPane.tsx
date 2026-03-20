import { useState } from "react";
import { X, FileText, CalendarDays, Columns3, Plus } from "lucide-react";
import Editor from "@/page/Editor";
import CalendarPage from "@/page/CalendarPage";
import KanbanPage from "@/page/KanbanPage";
import type { DocType } from "@/types/common";

export type PaneId = "left" | "right";

export interface Tab {
  id: string;
  name: string;
  isDaily: boolean;
  docType?: DocType;
  children?: { id: string; name: string }[];
}

export interface PaneState {
  tabs: Tab[];
  activeTabId: string | null;
}

interface TabPaneProps {
  paneId: PaneId;
  paneState: PaneState;
  isFocused: boolean;
  isSplit: boolean;
  onClickTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onDropTab: (tabId: string, sourcePane: PaneId, targetPane: PaneId) => void;
  onFocusPane: () => void;
  onOpenDocument: (id: string) => void;
  onRenameDocument: (id: string, newName: string) => void;
  onAddSpace?: () => void;
  draggingTabId: string | null;
  onDragStart: (tabId: string) => void;
  onDragEnd: () => void;
}

function isTabDrag(e: React.DragEvent) {
  return e.dataTransfer.types.includes("application/x-tab-id");
}

export default function TabPane({
  paneId,
  paneState,
  isFocused,
  isSplit,
  onClickTab,
  onCloseTab,
  onDropTab,
  onFocusPane,
  draggingTabId,
  onOpenDocument,
  onRenameDocument,
  onAddSpace,
  onDragStart,
  onDragEnd,
}: TabPaneProps) {
  const [dropSide, setDropSide] = useState<"left" | "right" | null>(null);
  const [dropHighlight, setDropHighlight] = useState(false);

  const activeTab = paneState.tabs.find((t) => t.id === paneState.activeTabId);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isTabDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (isSplit) {
      // Split mode: highlight entire pane
      setDropHighlight(true);
    } else {
      // Single mode: detect left/right half
      const rect = e.currentTarget.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      setDropSide(e.clientX < midX ? "left" : "right");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropSide(null);
      setDropHighlight(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tabId = e.dataTransfer.getData("application/x-tab-id");
    const sourcePane = e.dataTransfer.getData("application/x-source-pane") as PaneId;

    if (isSplit) {
      // Split mode: target is this pane
      onDropTab(tabId, sourcePane, paneId);
    } else {
      // Single mode: left/right determines target
      const rect = e.currentTarget.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const targetSide: PaneId = e.clientX < midX ? "left" : "right";
      onDropTab(tabId, sourcePane, targetSide);
    }

    setDropSide(null);
    setDropHighlight(false);
  };

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden ${
        isSplit && isFocused ? "ring-1 ring-primary/30" : ""
      }`}
      onMouseDown={onFocusPane}
    >
      {/* Tab bar (also a drop target) */}
      {paneState.tabs.length > 0 && (
        <div
          className={`flex items-center border-b border-border bg-muted/30 shrink-0 transition-colors ${
            dropHighlight ? "bg-primary/10" : ""
          }`}
          onDragOver={(e) => {
            if (!isTabDrag(e)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (isSplit) setDropHighlight(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDropHighlight(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            const tabId = e.dataTransfer.getData("application/x-tab-id");
            const sourcePane = e.dataTransfer.getData("application/x-source-pane") as PaneId;
            // Tab bar drop: always target this pane
            onDropTab(tabId, sourcePane, paneId);
            setDropHighlight(false);
          }}
        >
          {paneState.tabs.map((tab) => (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/x-tab-id", tab.id);
                e.dataTransfer.setData("application/x-source-pane", paneId);
                e.dataTransfer.effectAllowed = "move";
                onDragStart(tab.id);
              }}
              onDragEnd={() => {
                onDragEnd();
                setDropSide(null);
                setDropHighlight(false);
              }}
              className={`group flex items-center gap-1.5 px-3 py-2 text-sm cursor-grab border-r border-border max-w-[180px] transition-colors
                ${tab.id === paneState.activeTabId
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:bg-background/50"}
                ${draggingTabId === tab.id ? "opacity-50" : ""}`}
              onClick={() => onClickTab(tab.id)}
            >
              {tab.id === "kanban-view"
                ? <Columns3 className="h-3.5 w-3.5 shrink-0 opacity-60" />
                : tab.isDaily
                  ? <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  : <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />}
              <span className="truncate">{tab.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="ml-auto p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Editor area with drop zone */}
      <div
        className="flex-1 overflow-auto relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drop zone overlay: left/right in single mode */}
        {!isSplit && dropSide && (
          <div className="absolute inset-0 pointer-events-none z-10 flex">
            <div
              className={`w-1/2 transition-colors duration-150 ${
                dropSide === "left"
                  ? "bg-primary/10 border-2 border-primary/40 rounded-l-md"
                  : ""
              }`}
            />
            <div
              className={`w-1/2 transition-colors duration-150 ${
                dropSide === "right"
                  ? "bg-primary/10 border-2 border-primary/40 rounded-r-md"
                  : ""
              }`}
            />
          </div>
        )}

        {/* Drop zone overlay: full pane in split mode */}
        {isSplit && dropHighlight && (
          <div className="absolute inset-0 pointer-events-none z-10 bg-primary/10 border-2 border-primary/40 rounded-md" />
        )}

        {activeTab ? (
          activeTab.id === "calendar-view" ? (
            <CalendarPage
              key="calendar-view"
              onOpenDocument={onOpenDocument}
            />
          ) : activeTab.id === "kanban-view" ? (
            <KanbanPage
              key="kanban-view"
              onOpenDocument={onOpenDocument}
            />
          ) : (
            <Editor
              key={activeTab.id}
              documentId={activeTab.id}
              documentName={activeTab.name}
              isDailyNote={activeTab.isDaily}
              docType={activeTab.docType}
              children={activeTab.children}
              onOpenDocument={onOpenDocument}
              onRenameDocument={onRenameDocument}
            />
          )
        ) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 text-sm">
              <button
                onClick={onAddSpace}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="underline underline-offset-4">새 Space 생성하기</span>
              </button>
              <button
                onClick={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  onOpenDocument(`daily-${today}`);
                }}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <CalendarDays className="h-4 w-4" />
                <span className="underline underline-offset-4">Daily Note 작성하기</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
