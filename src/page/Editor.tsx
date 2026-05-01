import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import MarkdownEditor, { type MarkdownEditorHandle } from "@/components/MarkdownEditor";
import { ChevronRight, Loader2, AlertTriangle, RefreshCw, Check, Undo2, ArrowUp, ArrowDown, Plus, Trash2, Columns2, Rows2 } from "lucide-react";
import { extractEntityId, type DocType } from "@/types/common";
import TaskMetadata, { type TaskMetadataValues } from "@/components/TaskMetadata";
import { useDailyNoteDetail, useUpdateDailyNote, useAddPlan, useUpdatePlan, useDeletePlan, documentKeys } from "@/hooks/useDocuments";
import { formatLogicalDate, type DailyNoteDetail, type DailyNotePlan } from "@/api/documents";
import { useEntityDetail, useAutoSaveEntity, useUpdateEntity, type EntityDetail } from "@/hooks/useEntity";
import type { TaskDetail } from "@/types/task";
import type { SubTaskDetail } from "@/types/subtask";

function hasMetadata(detail: EntityDetail): detail is TaskDetail | SubTaskDetail {
  return "metadata" in detail && detail.metadata != null;
}

function getErrorStatus(error: unknown): number | null {
  const status = (error as { response?: { status?: unknown } } | null)?.response?.status;
  return typeof status === "number" ? status : null;
}

interface DailyNoteItemListProps {
  label: string;
  items: DailyNotePlan[];
  dailyNoteId: number;
  itemType: "PENDING" | "TODO";
  promoteLabel: string;
  promoteIcon: React.ReactNode;
  onToggleComplete: (item: DailyNotePlan) => void;
  onChangeType: (item: DailyNotePlan) => void;
  onDelete: (item: DailyNotePlan) => void;
  onAdd: (content: string) => void;
}

function DailyNoteItemList({
  label,
  items,
  promoteLabel,
  promoteIcon,
  onToggleComplete,
  onChangeType,
  onDelete,
  onAdd,
}: DailyNoteItemListProps) {
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const handleSubmit = () => {
    if (submittingRef.current) return;
    const trimmed = newContent.trim();
    if (!trimmed) return;
    submittingRef.current = true;
    onAdd(trimmed);
    setNewContent("");
    requestAnimationFrame(() => { submittingRef.current = false; });
  };

  return (
    <div className="px-12 pt-4 pb-1">
      <div className="border-t border-border mb-4" />
      <h3 className="text-base font-semibold text-foreground mb-2">{label}</h3>
      <div className="space-y-1">
        {items.map((item, idx) => (
          <div
            key={item.planId}
            className="group/item flex items-center gap-2 py-1 rounded-md text-sm"
          >
            <span className="w-5 text-right text-muted-foreground/60 shrink-0 text-xs">{idx + 1}.</span>
            <span className={`flex-1 min-w-0 truncate ${item.isDone ? "line-through text-muted-foreground/50" : ""}`}>
              {item.content}
            </span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
              {item.isDone ? (
                <button
                  onClick={() => onToggleComplete(item)}
                  className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="되돌리기"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onChangeType(item)}
                    className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={`${promoteLabel}(으)로 이동`}
                  >
                    {promoteIcon}
                  </button>
                  <button
                    onClick={() => onToggleComplete(item)}
                    className="p-1 rounded hover:bg-green-500/20 text-muted-foreground hover:text-green-600 transition-colors"
                    title="완료"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => onDelete(item)}
                className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors"
                title="삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 mt-1">
          <input
            ref={inputRef}
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); handleSubmit(); }
              if (e.key === "Escape") { setAdding(false); setNewContent(""); }
            }}
            onBlur={() => { if (!newContent.trim()) { setAdding(false); setNewContent(""); } }}
            placeholder="내용 입력 후 Enter"
            className="flex-1 px-2 py-1 text-sm bg-transparent border border-border rounded-md outline-none focus:border-primary/50"
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 mt-1 px-1 py-1 text-sm text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>추가</span>
        </button>
      )}
    </div>
  );
}

interface EditorProps {
  isDailyNote?: boolean;
  docType?: DocType;
  documentId: string;
  documentName: string;
  children?: { id: string; name: string }[];
  onOpenDocument?: (id: string, docType?: DocType) => void;
  onRenameDocument?: (id: string, newName: string) => void;
  isNew?: boolean;
  isTreeLoaded?: boolean;
}

export default function Editor({
  isDailyNote = false,
  docType,
  documentId,
  documentName,
  children,
  onOpenDocument,
  onRenameDocument,
  isNew,
  isTreeLoaded,
}: EditorProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(documentName);
  const editorRef = useRef<MarkdownEditorHandle>(null);

  const [dailyLayout, _setDailyLayout] = useState<"horizontal" | "vertical">(() => {
    return (localStorage.getItem("dailyLayout") as "horizontal" | "vertical") ?? "horizontal";
  });
  const setDailyLayout = (v: "horizontal" | "vertical") => {
    _setDailyLayout(v);
    localStorage.setItem("dailyLayout", v);
  };

  const [metadata, setMetadata] = useState<TaskMetadataValues>({
    status: "todo",
    startDate: undefined,
    endDate: undefined,
  });

  // daily-{PK} 형식에서 PK 추출
  const dailyPk = isDailyNote ? (() => {
    const match = documentId.match(/^daily-(\d+)$/);
    return match ? Number(match[1]) : null;
  })() : null;

  // 탭 ID에서 엔티티 ID 추출 (예: "task-1" → "1")
  const entityId = extractEntityId(documentId);

  // 엔티티 상세 조회
  const {
    data: entityDetail,
    isLoading: isEntityLoading,
    isError: isEntityError,
    error: entityError,
    refetch: refetchEntity,
  } = useEntityDetail(isDailyNote || isNew ? null : entityId, docType);

  const {
    data: dailyDetail,
    isLoading: isDailyLoading,
    isError: isDailyError,
    error: dailyError,
    refetch: refetchDaily,
  } = useDailyNoteDetail(dailyPk);

  const detail = isDailyNote ? dailyDetail : entityDetail;
  const loading = isNew ? false : isDailyNote ? isDailyLoading : isEntityLoading;
  const isError = isNew ? false : isDailyNote ? isDailyError : isEntityError;
  const queryError = isDailyNote ? dailyError : entityError;
  const errorStatus = getErrorStatus(queryError);
  const refetch = isDailyNote ? refetchDaily : refetchEntity;
  const isMissingDocument = !isDailyNote && !isNew && !docType && !!isTreeLoaded;
  const isNotFound = isMissingDocument || errorStatus === 404;

  const dailyNoteId = dailyPk ?? dailyDetail?.dailyNoteId;

  // 서버에서 받은 메타데이터 반영
  useEffect(() => {
    if (detail && !isDailyNote && hasMetadata(detail as EntityDetail)) {
      const meta = (detail as TaskDetail | SubTaskDetail).metadata!;
      setMetadata({
        status: meta.status,
        startDate: meta.startDate ? new Date(meta.startDate) : undefined,
        endDate: meta.endDate ? new Date(meta.endDate) : undefined,
      });
    }
  }, [detail, isDailyNote]);

  useEffect(() => {
    setTitle(documentName);
  }, [isDailyNote, documentName]);

  // API 응답에서 이름 동기화 (트리 미로드 등으로 탭 이름이 잘못된 경우 대비)
  useEffect(() => {
    if (!entityDetail || isDailyNote || isNew) return;
    const apiName = (entityDetail as EntityDetail).name;
    if (apiName && apiName !== title) {
      setTitle(apiName);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityDetail, isDailyNote, isNew]);

  // DailyNote 조회 성공 시 사이드바 갱신 (처음 열었을 때도 사이드바에 나타나도록)
  const hasInvalidatedDailyNotes = useRef(false);
  useEffect(() => {
    if (isDailyNote && dailyDetail && !hasInvalidatedDailyNotes.current) {
      hasInvalidatedDailyNotes.current = true;
      queryClient.invalidateQueries({ queryKey: documentKeys.dailyNotes() });
    }
  }, [isDailyNote, dailyDetail, queryClient]);

  // 자동 저장 (엔티티)
  const autoSaveMutation = useAutoSaveEntity();

  const handleAutoSave = useCallback(
    (content: string) => {
      if (!docType || !entityId) return;
      autoSaveMutation.mutate({ id: entityId, type: docType, content });
    },
    [entityId, docType, autoSaveMutation],
  );

  // 자동 저장 (DailyNote content)
  const dailyUpdateMutation = useUpdateDailyNote();

  const handleDailyContentAutoSave = useCallback(
    (content: string) => {
      if (!isDailyNote || !dailyNoteId) return;
      dailyUpdateMutation.mutate({ dailyNoteId, body: { content } });
    },
    [isDailyNote, dailyNoteId, dailyUpdateMutation],
  );

  // DailyNote plan mutations
  const addItemMutation = useAddPlan();
  const updateItemMutation = useUpdatePlan();
  const deleteItemMutation = useDeletePlan();

  // 메타데이터 변경 저장
  const updateMutation = useUpdateEntity();

  const handleMetadataChange = useCallback(
    (newMetadata: TaskMetadataValues) => {
      if (!docType) return;

      setMetadata(newMetadata);

      updateMutation.mutate({
        id: entityId,
        type: docType,
        metadata: {
          status: newMetadata.status,
          startDate: newMetadata.startDate?.toISOString().slice(0, 10) ?? null,
          endDate: newMetadata.endDate?.toISOString().slice(0, 10) ?? null,
        },
      });
    },
    [entityId, docType, updateMutation],
  );

  const hasChildren = children && children.length > 0;
  const showChildrenSection = docType && docType !== "trivia" && hasChildren;
  const showMetadata = docType === "task" || docType === "subtask";

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm px-6">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-base font-semibold text-foreground">404 Not Found</p>
          <p className="text-sm text-muted-foreground">
            요청한 문서를 찾을 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">문서를 불러오지 못했습니다</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isDailyNote) {
    const daily = dailyDetail as DailyNoteDetail | undefined;
    const pendingItems = daily?.plans?.filter((i) => i.type === "PENDING") ?? [];
    const todoItems = daily?.plans?.filter((i) => i.type === "TODO") ?? [];

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto p-6">
          {/* Title */}
          <input
            type="text"
            value={daily?.logicalDate ? formatLogicalDate(daily.logicalDate) : ""}
            readOnly
            className="w-full px-12 pt-4 pb-0 text-xl font-semibold bg-transparent outline-none"
          />

          {/* Split direction toggle */}
          <div className="flex justify-end mb-2">
            <div className="flex gap-0.5 rounded-md border border-border bg-muted/30 p-0.5">
              <button
                onClick={() => setDailyLayout("horizontal")}
                className={`p-1 rounded transition-colors ${
                  dailyLayout === "horizontal"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                title="좌우 분할"
              >
                <Columns2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDailyLayout("vertical")}
                className={`p-1 rounded transition-colors ${
                  dailyLayout === "vertical"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                title="상하 분할"
              >
                <Rows2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Split: left(Pending+Todo) / right(Content) */}
          <div className={`flex ${dailyLayout === "horizontal" ? "flex-row gap-6" : "flex-col"}`}>
            {/* Left: Pending + Todo */}
            <div className={dailyLayout === "horizontal" ? "w-1/2 shrink-0" : ""}>
              <DailyNoteItemList
                label="Pending"
                items={pendingItems}
                dailyNoteId={dailyNoteId!}
                itemType="PENDING"
                promoteLabel="Todo"
                promoteIcon={<ArrowDown className="h-3.5 w-3.5" />}
                onToggleComplete={(plan) =>
                  updateItemMutation.mutate({ dailyNoteId: dailyNoteId!, body: { planId: plan.planId, isDone: !plan.isDone } })
                }
                onChangeType={(plan) =>
                  updateItemMutation.mutate({ dailyNoteId: dailyNoteId!, body: { planId: plan.planId, type: "TODO" } })
                }
                onDelete={(plan) =>
                  deleteItemMutation.mutate({ dailyNoteId: dailyNoteId!, planId: plan.planId })
                }
                onAdd={(content) =>
                  addItemMutation.mutate({ dailyNoteId: dailyNoteId!, body: { type: "PENDING", content } })
                }
              />

              <DailyNoteItemList
                label="Todo"
                items={todoItems}
                dailyNoteId={dailyNoteId!}
                itemType="TODO"
                promoteLabel="Pending"
                promoteIcon={<ArrowUp className="h-3.5 w-3.5" />}
                onToggleComplete={(plan) =>
                  updateItemMutation.mutate({ dailyNoteId: dailyNoteId!, body: { planId: plan.planId, isDone: !plan.isDone } })
                }
                onChangeType={(plan) =>
                  updateItemMutation.mutate({ dailyNoteId: dailyNoteId!, body: { planId: plan.planId, type: "PENDING" } })
                }
                onDelete={(plan) =>
                  deleteItemMutation.mutate({ dailyNoteId: dailyNoteId!, planId: plan.planId })
                }
                onAdd={(content) =>
                  addItemMutation.mutate({ dailyNoteId: dailyNoteId!, body: { type: "TODO", content } })
                }
              />
            </div>

            {/* Divider */}
            <div className={dailyLayout === "horizontal"
              ? "border-l border-border/50"
              : "border-t border-border/50"
            } />

            {/* Right: Content (no label) */}
            <div className={dailyLayout === "horizontal" ? "w-1/2 pt-4" : "pt-4"}>
              <MarkdownEditor
                initialContent={daily?.content ?? ""}
                onAutoSave={handleDailyContentAutoSave}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const initialContent = (entityDetail as EntityDetail | undefined)?.content ?? "";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[54.4rem] mx-auto p-6">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onRenameDocument?.(documentId, title.trim());
                editorRef.current?.focus();
              }
            }}
            className="w-full px-12 pt-4 pb-0 text-xl font-semibold bg-transparent outline-none"
          />

          {showMetadata && (
            <>
              <TaskMetadata value={metadata} onChange={handleMetadataChange} />
              <div className="px-12 pb-1">
                <div className="border-t border-border" />
              </div>
            </>
          )}

          {showChildrenSection && (
            <div className="px-12 pt-3 pb-1">
              <div className="space-y-0.5">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onOpenDocument?.(child.id)}
                    className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
                  >
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{child.name}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 border-t border-border" />
            </div>
          )}

          <MarkdownEditor
            ref={editorRef}
            initialContent={initialContent}
            onAutoSave={handleAutoSave}
          />
        </div>
      </div>
    </div>
  );
}
