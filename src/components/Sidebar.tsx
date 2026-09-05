import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, ChevronUp, FileText, CalendarDays, NotebookPen, StickyNote, FolderClosed, FolderPlus, FilePlus2, Plus, Layout, ListChecks, Search, X, Loader2, Columns3, Check, UserPlus, Copy, Pencil, Trash2 } from "lucide-react";
import { useCreateDailyNoteFolder, useDeleteDailyNoteFolder, useMoveDailyNote, useRenameDailyNoteFolder, useSearchDocuments } from "@/hooks/useDocuments";
import { formatLogicalDate, type DailyNoteFolder, type DailyNoteSummary } from "@/api/documents";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import InviteDialog from "@/components/InviteDialog";
import { toast } from "sonner";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";

export type { DocType, SidebarItem, SearchResult } from "@/types/common";
import { sidebarUnfoldedId, type DocType, type SidebarItem, type SearchResult } from "@/types/common";

const DOC_TYPE_ICON: Record<DocType, typeof Layout> = {
  space: Layout,
  task: ListChecks,
  note: StickyNote,
};

function sortFoldersFirst(docs: SidebarItem[]): SidebarItem[] {
  return [...docs].sort((a, b) => {
    const aIsFolder = a.children && a.children.length > 0 ? 1 : 0;
    const bIsFolder = b.children && b.children.length > 0 ? 1 : 0;
    if (aIsFolder !== bIsFolder) return bIsFolder - aIsFolder;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}

function isDocUnfolded(doc: SidebarItem, unfoldedIds?: Set<string>): boolean {
  return doc.type
    ? (unfoldedIds?.has(sidebarUnfoldedId(doc.type, doc.id)) ?? false)
    : (unfoldedIds?.has(doc.id) ?? false);
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
  onSelect: (id: string, docType?: DocType) => void;
}) {
  const Icon = doc.resultType === "daily"
    ? NotebookPen
    : doc.type
      ? DOC_TYPE_ICON[doc.type]
      : FileText;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
      onClick={() => onSelect(doc.id, doc.type)}
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
  onSelect: (id: string, docType?: DocType) => void;
  onAddItem?: (parentId: string, parentType: DocType, childType: "task" | "note") => void;
  onDeleteItem?: (id: string, docType?: DocType) => void;
  onRenameItem?: (id: string, name: string) => void;
  icon?: "file" | "calendar";
  unfoldedIds?: Set<string>;
  onToggleExpand?: (noteId: string, docType: DocType, expanded: boolean) => void;
}

function DocItem({ doc, depth, selectedId, onSelect, onAddItem, onDeleteItem, onRenameItem, icon = "file", unfoldedIds, onToggleExpand }: DocItemProps) {
  const [expanded, setExpanded] = useState(() => isDocUnfolded(doc, unfoldedIds));
  const hasChildren = doc.children && doc.children.length > 0;
  const canAdd = doc.type === "task" || doc.type === "note";

  useEffect(() => {
    setExpanded(isDocUnfolded(doc, unfoldedIds));
  }, [doc, unfoldedIds]);

  const toggleExpand = (next: boolean) => {
    setExpanded(next);
    if (doc.type) {
      onToggleExpand?.(doc.id, doc.type, next);
    }
    // 펼칠 때 모든 하위 문서도 unfolded로 등록
    if (next && doc.children) {
      for (const child of doc.children) {
        if (child.type) {
          onToggleExpand?.(child.id, child.type, true);
          // 손자(note)까지 등록
          if (child.children) {
            for (const grandchild of child.children) {
              if (grandchild.type) {
                onToggleExpand?.(grandchild.id, grandchild.type, true);
              }
            }
          }
        }
      }
    }
  };

  const handleClick = () => {
    if (doc.type && doc.type !== "note") {
      onSelect(doc.id, doc.type);
    } else if (hasChildren && !doc.type) {
      toggleExpand(!expanded);
    } else {
      onSelect(doc.id, doc.type);
    }
  };

  const copyLink = async () => {
    const tabId = doc.type ? `${doc.type}-${doc.id}` : doc.id;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success("Note 링크를 복사했습니다");
    } catch {
      toast.error("링크를 복사하지 못했습니다");
    }
  };

  const rename = () => {
    if (!onRenameItem || !doc.type) return;
    const name = window.prompt("새 이름을 입력하세요", doc.name)?.trim();
    if (name && name !== doc.name) onRenameItem(`${doc.type}-${doc.id}`, name);
  };

  let ItemIcon;
  if (doc.type) {
    ItemIcon = DOC_TYPE_ICON[doc.type];
  } else if (hasChildren) {
    ItemIcon = FolderClosed;
  } else if (icon === "calendar") {
    ItemIcon = NotebookPen;
  } else {
    ItemIcon = FileText;
  }

  return (
    <div>
      <ContextMenu>
      <ContextMenuTrigger asChild><div
        className={`group/item relative flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors
          ${selectedId === (doc.type ? `${doc.type}-${doc.id}` : doc.id) ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(!expanded);
            }}
            className="p-0.5 rounded hover:bg-sidebar-border transition-colors"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        ) : (
          <span className="w-[18px] shrink-0" />
        )}
        <ItemIcon className="h-4 w-4 shrink-0 opacity-60" />
        <span className="truncate flex-1">{doc.name}</span>
        {canAdd && onAddItem && doc.type && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-none absolute right-2 p-0.5 rounded bg-sidebar-accent hover:bg-sidebar-border transition-colors opacity-0 group-hover/item:pointer-events-auto group-hover/item:opacity-100"
                title="하위 Note 추가"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-36 p-1" align="end" onClick={(e) => e.stopPropagation()}>
              {(["task", "note"] as const).map((childType) => (
                <button
                  key={childType}
                  onClick={() => {
                    onAddItem(doc.id, doc.type!, childType);
                    toggleExpand(true);
                  }}
                  className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  {childType === "task" ? "Task" : "Note"} 생성
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}
      </div></ContextMenuTrigger>
      <ContextMenuContent>
        {canAdd && onAddItem && doc.type && (
          <ContextMenuItem onSelect={() => onAddItem(doc.id, doc.type!, "note")}>
            <FileText className="h-4 w-4" />하위 Note 만들기
          </ContextMenuItem>
        )}
        {canAdd && onAddItem && doc.type && (
          <ContextMenuItem onSelect={() => onAddItem(doc.id, doc.type!, "task")}>
            <ListChecks className="h-4 w-4" />하위 Task 만들기
          </ContextMenuItem>
        )}
        <ContextMenuItem onSelect={copyLink}><Copy className="h-4 w-4" />링크 복사</ContextMenuItem>
        {doc.type && onRenameItem && (
          <ContextMenuItem onSelect={rename}><Pencil className="h-4 w-4" />이름 변경</ContextMenuItem>
        )}
        {doc.type && onDeleteItem && <ContextMenuSeparator />}
        {doc.type && onDeleteItem && (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => {
              if (window.confirm(`"${doc.name}"을(를) 삭제할까요?\n하위 Note와 Task도 함께 삭제됩니다.`)) onDeleteItem(doc.id, doc.type);
            }}
          ><Trash2 className="h-4 w-4" />삭제</ContextMenuItem>
        )}
      </ContextMenuContent>
      </ContextMenu>

      {hasChildren && expanded && (
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-px rounded-full bg-sidebar-foreground/25"
            style={{ left: `${depth * 16 + 17}px` }}
          />
          {doc.children && sortFoldersFirst(doc.children).map((child) => (
            <DocItem
              key={`${child.type ?? "item"}-${child.id}`}
              doc={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddItem={onAddItem}
              onDeleteItem={onDeleteItem}
              onRenameItem={onRenameItem}
              icon={icon}
              unfoldedIds={unfoldedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DailyNoteItem({
  dn,
  selectedId,
  onSelect,
  onDelete,
  depth,
  onDragStart,
}: {
  dn: DailyNoteSummary;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: number) => void;
  depth: number;
  onDragStart: (event: React.DragEvent, dailyNoteId: number) => void;
}) {
  const tabId = `daily-${dn.dailyNoteId}`;
  return (
    <ContextMenu><ContextMenuTrigger asChild><div
      key={dn.dailyNoteId}
      className={`group/daily flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors
        ${selectedId === tabId
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={() => onSelect(tabId)}
      draggable
      onDragStart={(event) => onDragStart(event, dn.dailyNoteId)}
    >
      <span className="shrink-0" style={{ width: 18 }} />
      <NotebookPen className="h-4 w-4 shrink-0 opacity-60" />
      <span className="truncate flex-1">{formatLogicalDate(dn.logicalDate)}</span>
    </div></ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem onSelect={async () => {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tabId);
        try { await navigator.clipboard.writeText(url.toString()); toast.success("Daily Note 링크를 복사했습니다"); }
        catch { toast.error("링크를 복사하지 못했습니다"); }
      }}><Copy className="h-4 w-4" />링크 복사</ContextMenuItem>
      {onDelete && <ContextMenuSeparator />}
      {onDelete && <ContextMenuItem className="text-destructive focus:text-destructive" onSelect={() => {
        if (window.confirm(`${formatLogicalDate(dn.logicalDate)} Daily Note를 삭제할까요?`)) onDelete(dn.dailyNoteId);
      }}><Trash2 className="h-4 w-4" />삭제</ContextMenuItem>}
    </ContextMenuContent></ContextMenu>
  );
}

function DailyNoteFolderItem({
  folder,
  notes,
  selectedId,
  onSelect,
  onDelete,
  onDragStart,
  onDropNote,
  onRenameFolder,
  onDeleteFolder,
  editing,
  onCommitRename,
  onCancelRename,
}: {
  folder: DailyNoteFolder;
  notes: DailyNoteSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: number) => void;
  onDragStart: (event: React.DragEvent, dailyNoteId: number) => void;
  onDropNote: (event: React.DragEvent, folderId: number | null) => void;
  onRenameFolder: (folder: DailyNoteFolder) => void;
  onDeleteFolder: (folder: DailyNoteFolder) => void;
  editing: boolean;
  onCommitRename: (folder: DailyNoteFolder, name: string) => void;
  onCancelRename: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const cancelRenameRef = useRef(false);

  useEffect(() => {
    if (editing) setEditName(folder.name);
  }, [editing, folder.name]);

  const commitRename = () => {
    if (cancelRenameRef.current) {
      cancelRenameRef.current = false;
      return;
    }
    const normalizedName = editName.trim();
    if (!normalizedName || normalizedName === folder.name) {
      onCancelRename();
      return;
    }
    onCommitRename(folder, normalizedName);
  };

  return (
    <div>
      <ContextMenu><ContextMenuTrigger asChild><div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm text-sidebar-foreground transition-colors ${dragOver ? "bg-primary/15 ring-1 ring-primary/50" : "hover:bg-sidebar-accent/50"}`}
        style={{ paddingLeft: "20px" }}
        onClick={() => setExpanded(!expanded)}
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes("application/x-daily-note")) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          setDragOver(false);
          setExpanded(true);
          onDropNote(event, folder.folderId);
        }}
      >
        <button
          className="shrink-0 flex items-center justify-center rounded hover:bg-sidebar-border transition-colors"
          style={{ width: 18 }}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>
        <FolderClosed className="h-4 w-4 shrink-0 opacity-60" />
        {editing ? (
          <input
            autoFocus
            value={editName}
            className="h-6 min-w-0 flex-1 rounded border border-primary bg-background px-1 text-sm outline-none"
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => setEditName(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                cancelRenameRef.current = true;
                onCancelRename();
                event.currentTarget.blur();
              }
            }}
          />
        ) : (
          <span className="truncate flex-1">{folder.name}</span>
        )}
      </div></ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => onRenameFolder(folder)}><Pencil className="h-4 w-4" />이름 변경</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDeleteFolder(folder)}>
          <Trash2 className="h-4 w-4" />삭제
        </ContextMenuItem>
      </ContextMenuContent></ContextMenu>
      {expanded && (
        <div>
          {notes.map((dn) => (
            <DailyNoteItem
              key={dn.dailyNoteId}
              dn={dn}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              depth={3}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DailyNotesSection({
  dailyNotes,
  folders,
  selectedId,
  onSelect,
  onDelete,
}: {
  dailyNotes: DailyNoteSummary[];
  folders: DailyNoteFolder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [rootDragOver, setRootDragOver] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const createFolder = useCreateDailyNoteFolder();
  const renameFolder = useRenameDailyNoteFolder();
  const deleteFolder = useDeleteDailyNoteFolder();
  const moveNote = useMoveDailyNote();

  const sorted = [...dailyNotes].sort((a, b) => {
    const [ay, am, ad] = a.logicalDate;
    const [by, bm, bd] = b.logicalDate;
    return ay - by || am - bm || ad - bd;
  });
  const rootNotes = sorted.filter((note) => note.folderId === null);
  const notesByFolder = new Map<number, DailyNoteSummary[]>();
  for (const note of sorted) {
    if (note.folderId === null) continue;
    const notes = notesByFolder.get(note.folderId) ?? [];
    notes.push(note);
    notesByFolder.set(note.folderId, notes);
  }

  const handleCreateFolder = async () => {
    const usedNames = new Set(folders.map((folder) => folder.name));
    let name = "새 폴더";
    let suffix = 2;
    while (usedNames.has(name)) name = `새 폴더 ${suffix++}`;
    try {
      const folderId = await createFolder.mutateAsync(name);
      setExpanded(true);
      setEditingFolderId(folderId);
    }
    catch { toast.error("폴더를 만들지 못했습니다"); }
  };
  const handleRenameFolder = (folder: DailyNoteFolder) => setEditingFolderId(folder.folderId);
  const handleCommitRename = async (folder: DailyNoteFolder, name: string) => {
    setEditingFolderId(null);
    try { await renameFolder.mutateAsync({ folderId: folder.folderId, name }); }
    catch { toast.error("폴더 이름을 변경하지 못했습니다"); }
  };
  const handleDeleteFolder = async (folder: DailyNoteFolder) => {
    if (!window.confirm(`"${folder.name}" 폴더를 삭제할까요?\n폴더 안의 Daily Note는 루트로 이동합니다.`)) return;
    try { await deleteFolder.mutateAsync(folder.folderId); }
    catch { toast.error("폴더를 삭제하지 못했습니다"); }
  };
  const handleDragStart = (event: React.DragEvent, dailyNoteId: number) => {
    event.dataTransfer.setData("application/x-daily-note", String(dailyNoteId));
    event.dataTransfer.effectAllowed = "move";
  };
  const handleDropNote = (event: React.DragEvent, folderId: number | null) => {
    const dailyNoteId = Number(event.dataTransfer.getData("application/x-daily-note"));
    if (!Number.isInteger(dailyNoteId)) return;
    event.preventDefault();
    const note = dailyNotes.find((item) => item.dailyNoteId === dailyNoteId);
    if (!note || note.folderId === folderId) return;
    moveNote.mutate({ dailyNoteId, folderId }, { onError: () => toast.error("Daily Note를 이동하지 못했습니다") });
  };

  return (
    <div>
      <div
        className={`group/daily relative flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm text-sidebar-foreground transition-colors ${rootDragOver ? "bg-primary/15 ring-1 ring-primary/50" : "hover:bg-sidebar-accent/50"}`}
        onClick={() => setExpanded(!expanded)}
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes("application/x-daily-note")) return;
          event.preventDefault();
          setRootDragOver(true);
        }}
        onDragLeave={() => setRootDragOver(false)}
        onDrop={(event) => { setRootDragOver(false); handleDropNote(event, null); }}
      >
        <button
          className="p-0.5 rounded hover:bg-sidebar-border transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>
        <NotebookPen className="h-4 w-4 shrink-0 opacity-60" />
        <span className="truncate flex-1">Daily Notes</span>
        <div className="pointer-events-none absolute right-2 flex items-center rounded bg-sidebar-accent opacity-0 transition-opacity group-hover/daily:pointer-events-auto group-hover/daily:opacity-100 group-focus-within/daily:pointer-events-auto group-focus-within/daily:opacity-100">
          <button
            className="p-0.5 rounded hover:bg-sidebar-border"
            aria-label="Daily Note 폴더 만들기"
            title="폴더 만들기"
            onClick={(event) => { event.stopPropagation(); void handleCreateFolder(); }}
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-0.5 rounded hover:bg-sidebar-border"
            aria-label="Daily Note 만들기"
            title="Daily Note 만들기"
            onClick={(event) => { event.stopPropagation(); onSelect("daily-notes"); }}
          >
            <FilePlus2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div>
          {folders.map((folder) => (
            <DailyNoteFolderItem
              key={folder.folderId}
              folder={folder}
              notes={notesByFolder.get(folder.folderId) ?? []}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onDragStart={handleDragStart}
              onDropNote={handleDropNote}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              editing={editingFolderId === folder.folderId}
              onCommitRename={handleCommitRename}
              onCancelRename={() => setEditingFolderId(null)}
            />
          ))}
          {rootNotes.map((dn) => (
            <DailyNoteItem
              key={dn.dailyNoteId}
              dn={dn}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              depth={1}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface WorkspaceInfo {
  id: number;
  name: string;
}

function WorkspaceSelector({
  workspaces,
  selectedId,
  onSelect,
  onAddSpace,
}: {
  workspaces: WorkspaceInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddSpace?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = workspaces.find((w) => String(w.id) === selectedId);

  if (workspaces.length === 0) {
    return (
      <div className="border-t border-sidebar-border p-2">
        {onAddSpace && (
          <button
            onClick={onAddSpace}
            className="flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Workspace 생성하기</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-sidebar-border p-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
            <Layout className="h-4 w-4 shrink-0 opacity-60" />
            <span className="truncate flex-1 text-left">{selected?.name ?? "Workspace 선택"}</span>
            <ChevronUp className={`h-3.5 w-3.5 shrink-0 opacity-50 transition-transform ${open ? "" : "rotate-180"}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-52 p-1">
          <div className="space-y-0.5">
            {workspaces.map((ws) => {
              const wsId = String(ws.id);
              return (
                <button
                  key={wsId}
                  onClick={() => {
                    onSelect(wsId);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors
                    ${wsId === selectedId ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-popover-foreground hover:bg-accent/50"}`}
                >
                  <Layout className="h-4 w-4 shrink-0 opacity-60" />
                  <span className="truncate flex-1 text-left">{ws.name}</span>
                  {wsId === selectedId && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
          {onAddSpace && (
            <>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => {
                  onAddSpace();
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-popover-foreground hover:bg-accent/50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Work Space 추가</span>
              </button>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface SidebarProps {
  onSelectSidebarItem?: (id: string, docType?: DocType) => void;
  docs: SidebarItem[];
  workspaces?: WorkspaceInfo[];
  dailyNotes?: DailyNoteSummary[];
  dailyNoteFolders?: DailyNoteFolder[];
  onAddItem?: (parentId: string, parentType: DocType, childType: "task" | "note") => void;
  onAddSpace?: () => void;
  onDeleteItem?: (id: string, docType?: DocType) => void;
  onRenameItem?: (id: string, name: string) => void;
  onDeleteDailyNote?: (id: number) => void;
  isLoading?: boolean;
  unfoldedIds?: Set<string>;
  open: boolean;
  onClose?: () => void;
  activeTabId?: string | null;
  searchMode?: boolean;
  onCloseSearch?: () => void;
  selectedWorkspaceId?: string | null;
  onSelectWorkspace?: (id: string) => void;
  onToggleExpand?: (noteId: string, docType: DocType, expanded: boolean) => void;
}

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const SIDEBAR_MIN = 80;
const SIDEBAR_CLOSE_THRESHOLD = 60;
const SIDEBAR_MAX = 480;
const SIDEBAR_DEFAULT = 300;

export default function Sidebar({ onSelectSidebarItem, docs, workspaces = [], dailyNotes, dailyNoteFolders = [], onAddItem, onAddSpace, onDeleteItem, onRenameItem, onDeleteDailyNote, isLoading, unfoldedIds, open, onClose, activeTabId, searchMode, onCloseSearch, selectedWorkspaceId, onSelectWorkspace, onToggleExpand }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Number(saved))) : SIDEBAR_DEFAULT;
  });
  const isResizing = useRef(false);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const raw = ev.clientX - 48;
      if (raw < SIDEBAR_CLOSE_THRESHOLD) {
        setSidebarWidth(SIDEBAR_MIN);
        return;
      }
      setSidebarWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, raw)));
    };

    const onUp = (ev: MouseEvent) => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (ev.clientX - 48 < SIDEBAR_CLOSE_THRESHOLD) {
        onClose?.();
      } else {
        setSidebarWidth((w) => {
          localStorage.setItem(SIDEBAR_WIDTH_KEY, String(w));
          return w;
        });
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [onClose]);

  // 200ms 디바운스 후 검색
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const normalizedQuery = searchQuery.trim();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(normalizedQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [normalizedQuery]);

  const { data: searchResults = [], isFetching } = useSearchDocuments(debouncedQuery);
  const isWaitingForDebounce = normalizedQuery.length > 0 && normalizedQuery !== debouncedQuery;
  const isSearching = isWaitingForDebounce || isFetching;

  const handleSelect = (id: string, docType?: DocType) => {
    setSearchQuery("");
    setDebouncedQuery("");
    onCloseSearch?.();
    onSelectSidebarItem?.(id, docType);
  };

  const isSearchMode = !!searchMode;

  return (
    <>
      <aside
        className={`h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col shrink-0 overflow-hidden relative ${open ? "" : "border-r-0"}`}
        style={{ width: open ? sidebarWidth : 0, transition: isResizing.current ? "none" : "width 200ms" }}
      >
        <div
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/40 z-10"
          onMouseDown={startResize}
        />
        {/* 헤더: 검색 입력 (searchMode일 때만) */}
        {isSearchMode && (
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-sidebar-border">
            <Search className="h-4 w-4 text-sidebar-foreground/40 shrink-0" />
            <input
              type="text"
              placeholder="내 Note 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 outline-none"
              autoFocus
            />
            <button
              onClick={() => {
                setSearchQuery("");
                setDebouncedQuery("");
                onCloseSearch?.();
              }}
              className="p-1 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-2">
          {isSearchMode ? (
            /* 검색 결과 */
            <div className="space-y-0.5">
              {normalizedQuery.length === 0 ? (
                <div className="px-3 py-4 text-sm text-sidebar-foreground/50 text-center">
                  검색어를 입력하세요
                </div>
              ) : isSearching ? (
                <div className="flex items-center gap-2 px-3 py-4 text-sm text-sidebar-foreground/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>검색 중...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((doc) => (
                  <SearchResultItem
                    key={`${doc.resultType ?? doc.type ?? "document"}-${doc.id}`}
                    doc={doc}
                    query={normalizedQuery}
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
              <div className="space-y-0.5">
                {dailyNotes && (
                  <DailyNotesSection
                    dailyNotes={dailyNotes}
                    folders={dailyNoteFolders}
                    selectedId={activeTabId ?? null}
                    onSelect={handleSelect}
                    onDelete={onDeleteDailyNote}
                  />
                )}
                <div
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors
                    ${activeTabId === "calendar-view"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
                  onClick={() => handleSelect("calendar-view")}
                >
                  <span className="w-[18px] shrink-0" />
                  <CalendarDays className="h-4 w-4 shrink-0 opacity-60" />
                  <span className="truncate flex-1">Calendar</span>
                </div>
                <div
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors
                    ${activeTabId === "kanban-view"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
                  onClick={() => handleSelect("kanban-view")}
                >
                  <span className="w-[18px] shrink-0" />
                  <Columns3 className="h-4 w-4 shrink-0 opacity-60" />
                  <span className="truncate flex-1">Kanban</span>
                </div>
              </div>

              <div className="my-2 border-t border-sidebar-border" />

              {/* 현재 Workspace 타이틀 */}
              {selectedWorkspaceId && (() => {
                const ws = workspaces.find((w) => String(w.id) === selectedWorkspaceId);
                if (!ws) return null;
                return (
                  <ContextMenu><ContextMenuTrigger asChild><div
                    className={`group/ws relative flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors
                      ${activeTabId === `space-${selectedWorkspaceId}`
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
                    onClick={() => handleSelect(selectedWorkspaceId, "space" as DocType)}
                  >
                    <span className="w-[18px] shrink-0" />
                    <Layout className="h-4 w-4 shrink-0 opacity-60" />
                    <span className="truncate flex-1 font-medium">{ws.name}</span>
                    <div className="pointer-events-none absolute right-2 flex items-center rounded bg-sidebar-accent opacity-0 transition-opacity group-hover/ws:pointer-events-auto group-hover/ws:opacity-100">
                      {onAddItem && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-0.5 rounded hover:bg-sidebar-border transition-colors"
                              title="최상위 Note 추가"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-36 p-1" align="end" onClick={(e) => e.stopPropagation()}>
                            {(["task", "note"] as const).map((childType) => (
                              <button
                                key={childType}
                                onClick={() => onAddItem(selectedWorkspaceId, "space", childType)}
                                className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                              >
                                {childType === "task" ? "Task" : "Note"} 생성
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInviteOpen(true);
                        }}
                        className="p-0.5 rounded hover:bg-sidebar-border transition-colors"
                        title="멤버 초대"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div></ContextMenuTrigger>
                  <ContextMenuContent>
                    {onAddItem && <ContextMenuItem onSelect={() => onAddItem(selectedWorkspaceId, "space", "note")}><FileText className="h-4 w-4" />새 Note</ContextMenuItem>}
                    {onAddItem && <ContextMenuItem onSelect={() => onAddItem(selectedWorkspaceId, "space", "task")}><ListChecks className="h-4 w-4" />새 Task</ContextMenuItem>}
                    <ContextMenuItem onSelect={async () => {
                      const url = new URL(window.location.href);
                      url.searchParams.set("tab", `space-${selectedWorkspaceId}`);
                      try { await navigator.clipboard.writeText(url.toString()); toast.success("Workspace 링크를 복사했습니다"); }
                      catch { toast.error("링크를 복사하지 못했습니다"); }
                    }}><Copy className="h-4 w-4" />링크 복사</ContextMenuItem>
                    {onRenameItem && <ContextMenuItem onSelect={() => {
                      const name = window.prompt("새 Workspace 이름을 입력하세요", ws.name)?.trim();
                      if (name && name !== ws.name) onRenameItem(`space-${selectedWorkspaceId}`, name);
                    }}><Pencil className="h-4 w-4" />이름 변경</ContextMenuItem>}
                    {onDeleteItem && <ContextMenuSeparator />}
                    {onDeleteItem && <ContextMenuItem className="text-destructive focus:text-destructive" onSelect={() => {
                      if (window.confirm(`"${ws.name}" Workspace를 삭제할까요?\n모든 하위 Note와 Task도 함께 삭제됩니다.`)) onDeleteItem(selectedWorkspaceId, "space");
                    }}><Trash2 className="h-4 w-4" />Workspace 삭제</ContextMenuItem>}
                  </ContextMenuContent></ContextMenu>
                );
              })()}

              {/* 트리 영역 (workspace 하위 문서들) */}
              {docs.length > 0 && (
                <div className="space-y-0.5">
                  {sortFoldersFirst(docs).map((doc) => (
                    <DocItem
                      key={`${doc.type ?? "item"}-${doc.id}`}
                      doc={doc}
                      depth={1}
                      selectedId={activeTabId ?? null}
                      onSelect={handleSelect}
                      onAddItem={onAddItem}
                      onDeleteItem={onDeleteItem}
                      onRenameItem={onRenameItem}
                      unfoldedIds={unfoldedIds}
                      onToggleExpand={onToggleExpand}
                    />
                  ))}
                </div>
              )}
              {selectedWorkspaceId && docs.length === 0 && (
                <div className="mx-2 mt-5 rounded-lg border border-dashed border-sidebar-border px-4 py-5 text-center">
                  <FileText className="mx-auto h-6 w-6 text-sidebar-foreground/35" />
                  <p className="mt-2 text-sm font-medium text-sidebar-foreground">아직 Note가 없어요</p>
                  <p className="mt-1 text-xs leading-5 text-sidebar-foreground/55">첫 Note를 만들고 바로 글을 작성해 보세요.</p>
                  {onAddItem && (
                    <button
                      onClick={() => onAddItem(selectedWorkspaceId, "space", "note")}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />첫 Note 만들기
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </nav>

        {/* 하단 Workspace 선택기 */}
        {!isSearchMode && !isLoading && (
          <WorkspaceSelector
            workspaces={workspaces}
            selectedId={selectedWorkspaceId ?? null}
            onSelect={(id) => onSelectWorkspace?.(id)}
            onAddSpace={onAddSpace}
          />
        )}
      </aside>

      {selectedWorkspaceId && (
        <InviteDialog
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          workspaceId={selectedWorkspaceId}
          workspaceName={workspaces.find((w) => String(w.id) === selectedWorkspaceId)?.name ?? ""}
        />
      )}
    </>
  );
}
