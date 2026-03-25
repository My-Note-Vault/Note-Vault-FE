import { useState, useEffect } from "react";
import { ChevronRight, FileText, CalendarDays, FolderClosed, PanelLeftClose, PanelLeft, Plus, Layout, ListChecks, ListTodo, Sparkles, Search, X, Loader2, Trash2, Columns3 } from "lucide-react";
import { useSearchDocuments } from "@/hooks/useDocuments";

export type { DocType, SidebarItem, SearchResult } from "@/types/common";
import type { DocType, SidebarItem, SearchResult } from "@/types/common";

const CHILD_TYPE_MAP: Record<DocType, DocType | null> = {
  space: "task",
  task: "subtask",
  subtask: "trivia",
  trivia: null,
};

const DOC_TYPE_ICON: Record<DocType, typeof Layout> = {
  space: Layout,
  task: ListChecks,
  subtask: ListTodo,
  trivia: Sparkles,
};

function sortFoldersFirst(docs: SidebarItem[]): SidebarItem[] {
  return [...docs].sort((a, b) => {
    const aIsFolder = a.children && a.children.length > 0 ? 1 : 0;
    const bIsFolder = b.children && b.children.length > 0 ? 1 : 0;
    if (aIsFolder !== bIsFolder) return bIsFolder - aIsFolder;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-primary font-medium rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function SearchResultItem({
  doc,
  query,
  onSelect,
}: {
  doc: SearchResult;
  query: string;
  onSelect: (id: string) => void;
}) {
  const Icon = doc.type ? DOC_TYPE_ICON[doc.type] : FileText;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
      onClick={() => onSelect(doc.id)}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-60" />
      <div className="flex-1 min-w-0">
        <div className="truncate">
          <HighlightText text={doc.name} query={query} />
        </div>
        {doc.content && (
          <div className="text-xs text-sidebar-foreground/50 truncate mt-0.5">
            <HighlightText text={doc.content} query={query} />
          </div>
        )}
      </div>
    </div>
  );
}

interface DocItemProps {
  doc: SidebarItem;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddItem?: (parentId: string) => void;
  onDeleteItem?: (id: string) => void;
  icon?: "file" | "calendar";
  unfoldedIds?: Set<string>;
}

function DocItem({ doc, depth, selectedId, onSelect, onAddItem, onDeleteItem, icon = "file", unfoldedIds }: DocItemProps) {
  const [expanded, setExpanded] = useState(() => unfoldedIds?.has(doc.id) ?? false);
  const hasChildren = doc.children && doc.children.length > 0;
  const isExpandable = doc.type && doc.type !== "trivia";
  const canAdd = doc.type && CHILD_TYPE_MAP[doc.type] !== null;

  const handleClick = () => {
    if (doc.type && doc.type !== "trivia") {
      onSelect(doc.id);
    } else if (hasChildren && !doc.type) {
      setExpanded(!expanded);
    } else {
      onSelect(doc.id);
    }
  };

  let ItemIcon;
  if (doc.type) {
    ItemIcon = DOC_TYPE_ICON[doc.type];
  } else if (hasChildren) {
    ItemIcon = FolderClosed;
  } else if (icon === "calendar") {
    ItemIcon = CalendarDays;
  } else {
    ItemIcon = FileText;
  }

  return (
    <div>
      <div
        className={`group/item flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors
          ${selectedId === doc.id ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {(hasChildren || isExpandable) ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 rounded hover:bg-sidebar-border transition-colors"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        ) : (
          <span className="w-4.5" />
        )}
        <ItemIcon className="h-4 w-4 shrink-0 opacity-60" />
        <span className="truncate flex-1">{doc.name}</span>
        {canAdd && onAddItem && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddItem(doc.id);
              setExpanded(true);
            }}
            className="p-0.5 rounded hover:bg-sidebar-border transition-colors opacity-0 group-hover/item:opacity-100"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
        {doc.type && onDeleteItem && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteItem(doc.id);
            }}
            className="p-0.5 rounded hover:bg-red-500/20 text-sidebar-foreground/50 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {(hasChildren || isExpandable) && expanded && (
        <div>
          {doc.children && sortFoldersFirst(doc.children).map((child) => (
            <DocItem
              key={child.id}
              doc={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddItem={onAddItem}
              onDeleteItem={onDeleteItem}
              icon={icon}
              unfoldedIds={unfoldedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  onSelectSidebarItem?: (id: string) => void;
  docs: SidebarItem[];
  dailyNotes?: SidebarItem;
  onAddItem?: (parentId: string) => void;
  onAddSpace?: () => void;
  onDeleteItem?: (id: string) => void;
  isLoading?: boolean;
  unfoldedIds?: Set<string>;
}

export default function Sidebar({ onSelectSidebarItem, docs, dailyNotes, onAddItem, onAddSpace, onDeleteItem, isLoading, unfoldedIds }: SidebarProps) {
  const [open, setOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 1초 디바운스 후 검색
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults = [], isLoading: isSearching } = useSearchDocuments(debouncedQuery);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSearchQuery("");
    setDebouncedQuery("");
    onSelectSidebarItem?.(id);
  };

  const isSearchMode = searchQuery.trim().length > 0;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-3 left-3 z-50 p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
      )}

      <aside
        className={`h-screen w-60 bg-sidebar-background border-r border-sidebar-border flex flex-col shrink-0 transition-[margin] duration-200
          ${open ? "ml-0" : "-ml-60"}`}
      >
        {/* 헤더: 검색 입력 */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-sidebar-border">
          <Search className="h-4 w-4 text-sidebar-foreground/40 shrink-0" />
          <input
            type="text"
            placeholder="내 문서 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 outline-none"
          />
          {isSearchMode ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setDebouncedQuery("");
              }}
              className="p-1 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {isSearchMode ? (
            /* 검색 결과 */
            <div className="space-y-0.5">
              {isSearching ? (
                <div className="flex items-center gap-2 px-3 py-4 text-sm text-sidebar-foreground/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>검색 중...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((doc) => (
                  <SearchResultItem
                    key={doc.id}
                    doc={doc}
                    query={searchQuery}
                    onSelect={handleSelect}
                  />
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-sidebar-foreground/50 text-center">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          ) : isLoading ? (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-sidebar-foreground/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>문서 불러오는 중...</span>
            </div>
          ) : (
            /* 기본 문서 트리 */
            <>
              {dailyNotes && (
                <div className="space-y-0.5">
                  <DocItem
                    doc={dailyNotes}
                    depth={0}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    icon="calendar"
                  />
                  <div
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors
                      ${selectedId === "calendar-view"
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
                    style={{ paddingLeft: "20px" }}
                    onClick={() => handleSelect("calendar-view")}
                  >
                    <span className="w-4.5" />
                    <CalendarDays className="h-4 w-4 shrink-0 opacity-60" />
                    <span className="truncate flex-1">Calendar</span>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors
                      ${selectedId === "kanban-view"
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
                    style={{ paddingLeft: "20px" }}
                    onClick={() => handleSelect("kanban-view")}
                  >
                    <span className="w-4.5" />
                    <Columns3 className="h-4 w-4 shrink-0 opacity-60" />
                    <span className="truncate flex-1">Kanban</span>
                  </div>
                </div>
              )}

              {dailyNotes && <div className="my-2 border-t border-sidebar-border" />}

              <div className="space-y-0.5">
                {sortFoldersFirst(docs).map((doc) => (
                  <DocItem
                    key={doc.id}
                    doc={doc}
                    depth={0}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    onAddItem={onAddItem}
                    onDeleteItem={onDeleteItem}
                    unfoldedIds={unfoldedIds}
                  />
                ))}
              </div>

              {onAddSpace && (
                <button
                  onClick={onAddSpace}
                  className="flex items-center gap-1 w-full px-2 py-1.5 mt-1 rounded-md text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Work Space 추가</span>
                </button>
              )}
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
