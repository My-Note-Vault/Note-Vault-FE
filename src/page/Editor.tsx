import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import MarkdownEditor, { type MarkdownEditorHandle, type AutoSaveOptions } from "@/components/MarkdownEditor";
import { ChevronRight, Loader2, AlertTriangle, RefreshCw, Check, Undo2, ArrowUp, ArrowDown, Trash2, Columns2, Rows2 } from "lucide-react";
import { toast } from "sonner";
import { sendKeepaliveDailyNoteAutoSave } from "@/api/autoSave";
import type { ContentImageTarget } from "@/api/contentImages";
import { extractEntityId, type DocType } from "@/types/common";
import TaskMetadata, { type TaskMetadataValues } from "@/components/TaskMetadata";
import { useDailyNoteDetail, useUpdateDailyNote, useAddPlan, useUpdatePlan, useDeletePlan, documentKeys } from "@/hooks/useDocuments";
import { formatLogicalDate, type DailyNoteDetail, type DailyNotePlan } from "@/api/documents";
import { useEntityDetail, useUpdateEntity, type EntityDetail } from "@/hooks/useEntity";
import { useMemberProfile, useProfileImage } from "@/hooks/useMember";
import {
  buildCollaborationConfig,
  buildCollaborationUser,
} from "@/lib/collaboration";
import type { TaskDetail } from "@/types/task";

function hasMetadata(detail: EntityDetail): detail is TaskDetail {
  return "status" in detail;
}

function getErrorStatus(error: unknown): number | null {
  const status = (error as { response?: { status?: unknown } } | null)?.response?.status;
  return typeof status === "number" ? status : null;
}

function getContentImageTarget(
  isDailyNote: boolean,
  docType?: DocType,
): ContentImageTarget | null {
  if (isDailyNote) return "daily-note";
  if (docType === "space") return "workspace";
  if (docType === "task" || docType === "note") return docType;
  return null;
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
  onAdd: (content: string) => Promise<number>;
  onEdit: (planId: number, content: string) => Promise<void>;
}

interface DailyNotePlanItemProps {
  item: DailyNotePlan;
  index: number;
  promoteLabel: string;
  promoteIcon: React.ReactNode;
  onToggleComplete: (item: DailyNotePlan) => void;
  onChangeType: (item: DailyNotePlan) => void;
  onDelete: (item: DailyNotePlan) => void;
  onEdit: (planId: number, content: string) => Promise<void>;
}

function DailyNotePlanItem({
  item,
  index,
  promoteLabel,
  promoteIcon,
  onToggleComplete,
  onChangeType,
  onDelete,
  onEdit,
}: DailyNotePlanItemProps) {
  const [content, setContent] = useState(item.content);
  const savedContentRef = useRef(item.content);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextBlurRef = useRef(false);
  const latestContentRef = useRef(item.content);
  const savePromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (latestContentRef.current !== savedContentRef.current) return;
    savedContentRef.current = item.content;
    latestContentRef.current = item.content;
    setContent(item.content);
  }, [item.content]);

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const commit = useCallback((nextContent: string): Promise<void> => {
    clearSaveTimer();
    const trimmed = nextContent.trim();
    if (!trimmed) {
      setContent(savedContentRef.current);
      latestContentRef.current = savedContentRef.current;
      return Promise.resolve();
    }
    latestContentRef.current = trimmed;
    setContent(trimmed);

    if (!savePromiseRef.current) {
      savePromiseRef.current = (async () => {
        while (latestContentRef.current !== savedContentRef.current) {
          const contentToSave = latestContentRef.current;
          await onEdit(item.planId, contentToSave);
          savedContentRef.current = contentToSave;
        }
      })().finally(() => {
        savePromiseRef.current = null;
      });
    }

    return savePromiseRef.current;
  }, [clearSaveTimer, item.planId, onEdit]);

  useEffect(() => () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
  }, []);

  return (
    <div className="group/item flex items-center gap-2 py-1 rounded-md text-sm">
      <span className="w-5 text-right text-muted-foreground/60 shrink-0 text-xs">{index + 1}.</span>
      <input
        type="text"
        value={content}
        onChange={(event) => {
          const nextContent = event.target.value;
          setContent(nextContent);
          latestContentRef.current = nextContent;
          clearSaveTimer();
          saveTimerRef.current = setTimeout(() => {
            void commit(nextContent).catch(() => toast.error("Plan을 저장하지 못했습니다."));
          }, 600);
        }}
        onBlur={() => {
          if (skipNextBlurRef.current) {
            skipNextBlurRef.current = false;
            return;
          }
          void commit(content).catch(() => toast.error("Plan을 저장하지 못했습니다."));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            clearSaveTimer();
            skipNextBlurRef.current = true;
            latestContentRef.current = savedContentRef.current;
            setContent(savedContentRef.current);
            event.currentTarget.blur();
          }
        }}
        aria-label={`${index + 1}번째 Plan 내용`}
        className={`flex-1 min-w-0 py-0.5 bg-transparent outline-none rounded-sm focus:bg-muted/40 ${item.isDone ? "line-through text-muted-foreground/50" : ""}`}
      />
      <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
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
  );
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
  onEdit,
}: DailyNoteItemListProps) {
  const [newContent, setNewContent] = useState("");
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const newContentRef = useRef("");
  const activePlanIdRef = useRef<number | null>(null);
  const lastSavedNewContentRef = useRef("");
  const addSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addSavePromiseRef = useRef<Promise<void> | null>(null);

  const clearAddSaveTimer = useCallback(() => {
    if (addSaveTimerRef.current) {
      clearTimeout(addSaveTimerRef.current);
      addSaveTimerRef.current = null;
    }
  }, []);

  const saveNewContent = useCallback((): Promise<void> => {
    clearAddSaveTimer();
    if (!newContentRef.current.trim()) return Promise.resolve();

    if (!addSavePromiseRef.current) {
      let succeeded = false;
      addSavePromiseRef.current = (async () => {
        while (newContentRef.current.trim() !== lastSavedNewContentRef.current) {
          const contentToSave = newContentRef.current.trim();
          if (activePlanIdRef.current === null) {
            const planId = await onAdd(contentToSave);
            activePlanIdRef.current = planId;
            setActivePlanId(planId);
          } else {
            await onEdit(activePlanIdRef.current, contentToSave);
          }
          lastSavedNewContentRef.current = contentToSave;
        }
        succeeded = true;
      })().finally(() => {
        addSavePromiseRef.current = null;
        if (succeeded && newContentRef.current.trim() !== lastSavedNewContentRef.current) {
          void saveNewContent().catch(() => toast.error("Plan을 저장하지 못했습니다."));
        }
      });
    }

    return addSavePromiseRef.current;
  }, [clearAddSaveTimer, onAdd, onEdit]);

  const finishNewPlan = useCallback(async () => {
    if (!newContentRef.current.trim()) return;
    try {
      await saveNewContent();
    } catch {
      toast.error("Plan을 저장하지 못했습니다.");
      return;
    }
    newContentRef.current = "";
    lastSavedNewContentRef.current = "";
    activePlanIdRef.current = null;
    setNewContent("");
    setActivePlanId(null);
  }, [saveNewContent]);

  useEffect(() => () => clearAddSaveTimer(), [clearAddSaveTimer]);

  const visibleItems = items.filter((item) => item.planId !== activePlanId);

  return (
    <div className="px-12 pt-4 pb-1">
      <div className="border-t border-border mb-4" />
      <h3 className="text-base font-semibold text-foreground mb-2">{label}</h3>
      <div className="space-y-1">
        {visibleItems.map((item, idx) => (
          <DailyNotePlanItem
            key={item.planId}
            item={item}
            index={idx}
            promoteLabel={promoteLabel}
            promoteIcon={promoteIcon}
            onToggleComplete={onToggleComplete}
            onChangeType={onChangeType}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 mt-1">
        <span className="w-5 text-right text-muted-foreground/60 shrink-0 text-xs">{visibleItems.length + 1}.</span>
        <input
          type="text"
          value={newContent}
          onChange={(e) => {
            const nextContent = e.target.value;
            newContentRef.current = nextContent;
            setNewContent(nextContent);
            clearAddSaveTimer();
            addSaveTimerRef.current = setTimeout(() => {
              void saveNewContent().catch(() => toast.error("Plan을 저장하지 못했습니다."));
            }, 600);
          }}
          onBlur={() => void finishNewPlan()}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) { void finishNewPlan(); }
            if (e.key === "Escape" && activePlanIdRef.current === null) {
              clearAddSaveTimer();
              newContentRef.current = "";
              setNewContent("");
              e.currentTarget.blur();
            }
          }}
          placeholder="내용을 입력하세요"
          className="flex-1 py-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40"
        />
      </div>
    </div>
  );
}

interface EditorProps {
  workspaceId: string | null;
  isDailyNote?: boolean;
  docType?: DocType;
  documentId: string;
  documentName: string;
  children?: { id: string; name: string }[];
  onOpenDocument?: (id: string, docType?: DocType) => void;
  onRenameDocument?: (id: string, newName: string) => void;
  onDeleteDocument?: (id: string, docType?: DocType) => void;
  onDeleteDailyNote?: (dailyNoteId: number) => void;
  isNew?: boolean;
  isTreeLoaded?: boolean;
}

export default function Editor({
  workspaceId,
  isDailyNote = false,
  docType,
  documentId,
  documentName,
  children,
  onOpenDocument,
  onRenameDocument,
  onDeleteDocument,
  onDeleteDailyNote,
  isNew,
  isTreeLoaded,
}: EditorProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(documentName);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const titleRef = useRef(title);
  const savedTitleRef = useRef(documentName);

  titleRef.current = title;

  const [dailyLayout, _setDailyLayout] = useState<"horizontal" | "vertical">(() => {
    return (localStorage.getItem("dailyLayout") as "horizontal" | "vertical") ?? "horizontal";
  });
  const setDailyLayout = (v: "horizontal" | "vertical") => {
    _setDailyLayout(v);
    localStorage.setItem("dailyLayout", v);
  };

  const [metadata, setMetadata] = useState<TaskMetadataValues>({
    status: "NOT_STARTED",
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
  const loadedContent = isDailyNote
    ? dailyDetail?.content ?? ""
    : docType === "space" && entityDetail && "content" in entityDetail
      ? entityDetail.content ?? ""
      : "";
  const contentImageTarget = getContentImageTarget(isDailyNote, docType);
  const loading = isNew ? false : isDailyNote ? isDailyLoading : isEntityLoading;
  const isError = isNew ? false : isDailyNote ? isDailyError : isEntityError;
  const queryError = isDailyNote ? dailyError : entityError;
  const errorStatus = getErrorStatus(queryError);
  const refetch = isDailyNote ? refetchDaily : refetchEntity;
  const isMissingDocument = !isDailyNote && !isNew && !docType && !!isTreeLoaded;
  const isNotFound = isMissingDocument || errorStatus === 404;

  useEffect(() => {
    if (loading || isDailyNote) return;
    if (sessionStorage.getItem("focus_document_title") !== documentId) return;
    sessionStorage.removeItem("focus_document_title");
    requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });
  }, [documentId, isDailyNote, loading]);

  const dailyNoteId = dailyPk ?? dailyDetail?.dailyNoteId;
  const { data: memberProfile } = useMemberProfile();
  const { data: profileImage } = useProfileImage();
  const collaboratorName = memberProfile?.nickname ?? memberProfile?.name ?? null;
  const profileImageUrl = profileImage?.profileImageUrl ?? null;
  const collaborationConfig = useMemo(() => {
    if (isDailyNote || isNew || !entityDetail || !docType || !entityId) return null;
    const collaborationWorkspaceId = docType === "space" ? entityId : workspaceId;
    if (!collaborationWorkspaceId) return null;

    const numericId = Number(entityId);
    if (Number.isNaN(numericId)) return null;

    const user = buildCollaborationUser(
      collaboratorName,
      `${docType}:${entityId}`,
      profileImageUrl,
    );

    return buildCollaborationConfig(
      collaborationWorkspaceId,
      docType,
      numericId,
      user,
    );
  }, [
    isDailyNote,
    isNew,
    entityDetail,
    docType,
    entityId,
    workspaceId,
    collaboratorName,
    profileImageUrl,
  ]);

  // 서버에서 받은 메타데이터 반영
  useEffect(() => {
    if (detail && !isDailyNote && hasMetadata(detail as EntityDetail)) {
      const task = detail as TaskDetail;
      setMetadata({
        status: task.status ?? "NOT_STARTED",
        startDate: task.startDateTime ? new Date(task.startDateTime) : undefined,
        endDate: task.endDateTime ? new Date(task.endDateTime) : undefined,
      });
    }
  }, [detail, isDailyNote]);

  useEffect(() => {
    setTitle(documentName);
    savedTitleRef.current = documentName;
  }, [isDailyNote, documentName]);

  // API 응답에서 이름 동기화 (트리 미로드 등으로 탭 이름이 잘못된 경우 대비)
  useEffect(() => {
    if (!entityDetail || isDailyNote || isNew) return;
    const apiName = (entityDetail as EntityDetail).name;
    if (apiName && apiName !== title) {
      setTitle(apiName);
      savedTitleRef.current = apiName;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityDetail, isDailyNote, isNew]);

  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushTitle = useCallback(() => {
    if (titleTimerRef.current) {
      clearTimeout(titleTimerRef.current);
      titleTimerRef.current = null;
    }
    const current = titleRef.current.trim();
    if (!current || current === savedTitleRef.current) return;
    savedTitleRef.current = current;
    onRenameDocument?.(documentId, current);
  }, [documentId, onRenameDocument]);

  const debouncedTitleSave = useCallback(() => {
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => {
      titleTimerRef.current = null;
      flushTitle();
    }, 1000);
  }, [flushTitle]);

  // 브라우저 새로고침/탭 닫기 시 제목 저장
  useEffect(() => {
    const handleUnload = () => flushTitle();
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [flushTitle]);

  // 컴포넌트 언마운트(페이지 이동) 시 제목 저장
  useEffect(() => {
    return () => flushTitle();
  }, [flushTitle]);

  // DailyNote 조회 성공 시 사이드바 갱신 (처음 열었을 때도 사이드바에 나타나도록)
  const hasInvalidatedDailyNotes = useRef(false);
  useEffect(() => {
    if (isDailyNote && dailyDetail && !hasInvalidatedDailyNotes.current) {
      hasInvalidatedDailyNotes.current = true;
      queryClient.invalidateQueries({ queryKey: documentKeys.dailyNotes() });
    }
  }, [isDailyNote, dailyDetail, queryClient]);

  // 자동 저장 (엔티티)
  const handleAutoSave = useCallback(
    (_content: string, _options: AutoSaveOptions) => Promise.resolve(),
    [],
  );

  // 자동 저장 (DailyNote content)
  const dailyUpdateMutation = useUpdateDailyNote();

  const handleDailyContentAutoSave = useCallback(
    (content: string, options: AutoSaveOptions) => {
      if (!isDailyNote || !dailyNoteId) return Promise.resolve();
      if (options.reason === "unload") {
        sendKeepaliveDailyNoteAutoSave(dailyNoteId, content);
        return Promise.resolve();
      }

      return dailyUpdateMutation.mutateAsync({ dailyNoteId, body: { content } });
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
          startDate: newMetadata.startDate
            ? `${newMetadata.startDate.getFullYear()}-${String(newMetadata.startDate.getMonth() + 1).padStart(2, "0")}-${String(newMetadata.startDate.getDate()).padStart(2, "0")}T00:00:00`
            : null,
          endDate: newMetadata.endDate
            ? `${newMetadata.endDate.getFullYear()}-${String(newMetadata.endDate.getMonth() + 1).padStart(2, "0")}-${String(newMetadata.endDate.getDate()).padStart(2, "0")}T23:59:59`
            : null,
        },
      });
    },
    [entityId, docType, updateMutation],
  );

  const hasChildren = children && children.length > 0;
  const showChildrenSection = !!docType && hasChildren;
  const showMetadata = docType === "task";

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
          {/* Title + Delete */}
          <div className="flex items-start">
            <input
              ref={titleInputRef}
              type="text"
              value={daily?.logicalDate ? formatLogicalDate(daily.logicalDate) : ""}
              readOnly
              className="flex-1 px-12 pt-4 pb-0 text-xl font-semibold bg-transparent outline-none"
            />
            {/* Split direction toggle */}
            <div className="mt-4 mr-2 flex gap-0.5 rounded-md border border-border bg-muted/30 p-0.5 shrink-0">
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
            {onDeleteDailyNote && dailyNoteId && (
              <button
                onClick={() => {
                  if (window.confirm("이 데일리 노트를 삭제하시겠습니까?")) {
                    onDeleteDailyNote(dailyNoteId);
                  }
                }}
                className="mt-4 mr-2 p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
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
                onEdit={(planId, content) =>
                  updateItemMutation.mutateAsync({ dailyNoteId: dailyNoteId!, body: { planId, content } })
                }
                onAdd={(content) =>
                  addItemMutation.mutateAsync({ dailyNoteId: dailyNoteId!, body: { type: "PENDING", content } })
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
                  addItemMutation.mutateAsync({ dailyNoteId: dailyNoteId!, body: { type: "TODO", content } })
                }
                onEdit={(planId, content) =>
                  updateItemMutation.mutateAsync({ dailyNoteId: dailyNoteId!, body: { planId, content } })
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
                collaboration={collaborationConfig}
                contentImageTarget={contentImageTarget}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[54.4rem] mx-auto p-6">
        <div>
          <div className="flex items-start">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                debouncedTitleSave();
              }}
              onBlur={() => flushTitle()}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  editorRef.current?.focus();
                }
              }}
              className="flex-1 px-12 pt-4 pb-0 text-xl font-semibold bg-transparent outline-none"
            />
            {onDeleteDocument && docType && !isNew && (
              <button
                onClick={() => onDeleteDocument(documentId, docType)}
                className="mt-4 mr-2 p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>


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
            initialContent={loadedContent}
            onAutoSave={handleAutoSave}
            collaboration={collaborationConfig}
            contentImageTarget={contentImageTarget}
            placeholder="내용을 입력하거나 Markdown으로 작성해 보세요…"
          />
        </div>
      </div>
    </div>
  );
}
