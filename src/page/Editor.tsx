import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import MarkdownEditor, { type MarkdownEditorHandle, type AutoSaveOptions } from "@/components/MarkdownEditor";
import { ChevronRight, Loader2, AlertTriangle, RefreshCw, Check, Undo2, ArrowUp, ArrowDown, Trash2, Columns2, Rows2, Sparkles, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { sendKeepaliveDailyNoteAutoSave } from "@/api/autoSave";
import type { ContentImageTarget } from "@/api/contentImages";
import { AI_SUMMARY_MAX_CONTENT_LENGTH, summarizeMarkdown } from "@/api/aiSummaries";
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
import type { SubTaskDetail } from "@/types/subtask";

function hasMetadata(detail: EntityDetail): detail is TaskDetail | SubTaskDetail {
  return "status" in detail;
}

interface SummarySection {
  id: string;
  title: string;
  content: string;
}

function getErrorStatus(error: unknown): number | null {
  const status = (error as { response?: { status?: unknown } } | null)?.response?.status;
  return typeof status === "number" ? status : null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: unknown } } } | null)
    ?.response?.data?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

function splitH1Sections(content: string): SummarySection[] {
  const lines = content.split(/\r?\n/);
  const sections: SummarySection[] = [];
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  const pushCurrent = () => {
    if (!currentTitle || currentLines.join("\n").trim().length === 0) return;
    sections.push({
      id: `${sections.length}-${currentTitle}`,
      title: currentTitle,
      content: currentLines.join("\n").trim(),
    });
  };

  for (const line of lines) {
    const match = line.match(/^#(?!#)\s+(.+?)\s*$/);
    if (match) {
      pushCurrent();
      currentTitle = match[1].trim() || "제목 없음";
      currentLines = [line];
      continue;
    }

    if (currentTitle) {
      currentLines.push(line);
    }
  }

  pushCurrent();
  return sections;
}

function getContentImageTarget(
  isDailyNote: boolean,
  docType?: DocType,
): ContentImageTarget | null {
  if (isDailyNote) return "daily-note";
  if (docType === "space") return "workspace";
  if (docType === "task" || docType === "subtask" || docType === "note") return docType;
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
  const [newContent, setNewContent] = useState("");

  const handleAdd = useCallback(() => {
    const trimmed = newContent.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewContent("");
  }, [newContent, onAdd]);

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

      <div className="flex items-center gap-2 mt-1">
        <span className="w-5 text-right text-muted-foreground/60 shrink-0 text-xs">{items.length + 1}.</span>
        <input
          type="text"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onBlur={() => {}}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) { handleAdd(); }
            if (e.key === "Escape") { setNewContent(""); (e.target as HTMLInputElement).blur(); }
          }}
          placeholder="내용을 입력하세요"
          className="flex-1 py-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40"
        />
      </div>
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
  onDeleteDocument?: (id: string, docType?: DocType) => void;
  onDeleteDailyNote?: (dailyNoteId: number) => void;
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
  onDeleteDocument,
  onDeleteDailyNote,
  isNew,
  isTreeLoaded,
}: EditorProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(documentName);
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
    : docType === "space" && entityDetail
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

  const dailyNoteId = dailyPk ?? dailyDetail?.dailyNoteId;
  const { data: memberProfile } = useMemberProfile();
  const { data: profileImage } = useProfileImage();
  const collaboratorName = memberProfile?.nickname ?? memberProfile?.name ?? null;
  const profileImageUrl = profileImage?.profileImageUrl ?? null;
  const collaborationConfig = useMemo(() => {
    if (isDailyNote || isNew || !entityDetail || !docType || !entityId) return null;
    const workspaceId = localStorage.getItem("selected_workspace");
    if (!workspaceId) return null;

    const numericId = Number(entityId);
    if (Number.isNaN(numericId)) return null;

    const user = buildCollaborationUser(
      collaboratorName,
      `${docType}:${entityId}`,
      profileImageUrl,
    );

    return buildCollaborationConfig(workspaceId, docType, numericId, user);
  }, [
    isDailyNote,
    isNew,
    entityDetail,
    docType,
    entityId,
    collaboratorName,
    profileImageUrl,
  ]);

  const [currentContent, setCurrentContent] = useState(loadedContent);
  const [summary, setSummary] = useState("");
  const [summaryHeading, setSummaryHeading] = useState("");
  const [summaryRemainingToday, setSummaryRemainingToday] = useState<number | null>(null);
  const [summarizingKey, setSummarizingKey] = useState<string | null>(null);

  useEffect(() => {
    setCurrentContent(loadedContent);
    setSummary("");
    setSummaryHeading("");
    setSummaryRemainingToday(null);
    setSummarizingKey(null);
  }, [documentId, loadedContent]);

  const h1Sections = useMemo(() => splitH1Sections(currentContent), [currentContent]);
  const isContentTooLarge = currentContent.length > AI_SUMMARY_MAX_CONTENT_LENGTH;
  const summaryDocumentTitle = isDailyNote
    ? dailyDetail?.logicalDate
      ? formatLogicalDate(dailyDetail.logicalDate)
      : documentName
    : title;

  const requestSummary = useCallback(async (
    content: string,
    heading: string,
    sectionTitle?: string,
  ) => {
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error("요약할 내용이 없습니다.");
      return;
    }

    if (trimmed.length > AI_SUMMARY_MAX_CONTENT_LENGTH) {
      toast.error("요약할 내용이 너무 깁니다.");
      return;
    }

    const key = sectionTitle ? `section:${sectionTitle}` : "all";
    setSummarizingKey(key);
    try {
      const result = await summarizeMarkdown({
        title: summaryDocumentTitle,
        sectionTitle,
        content: trimmed,
      });
      setSummary(result.summary);
      setSummaryHeading(heading);
      setSummaryRemainingToday(result.remainingToday);
    } catch (error) {
      toast.error(getErrorMessage(error, "AI 요약에 실패했습니다."));
    } finally {
      setSummarizingKey(null);
    }
  }, [summaryDocumentTitle]);

  const renderSummaryAction = () => {
    if (isContentTooLarge) return null;

    return (
      <button
        type="button"
        onClick={() => requestSummary(currentContent, "전체 요약")}
        disabled={summarizingKey !== null || currentContent.trim().length === 0}
        className="mt-4 mr-2 inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
        title="전체 요약"
      >
        {summarizingKey === "all" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        전체 요약
      </button>
    );
  };

  const renderSectionSummaryActions = () => {
    if (!isContentTooLarge) return null;

    return (
      <div className="mx-12 mt-4 border-y border-border py-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText className="h-4 w-4 text-muted-foreground" />
          H1 섹션 요약
        </div>
        {h1Sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            본문이 길어 전체 요약을 할 수 없습니다. H1 제목을 추가한 뒤 섹션별로 요약하세요.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {h1Sections.map((section) => {
              const key = `section:${section.title}`;
              const tooLarge = section.content.length > AI_SUMMARY_MAX_CONTENT_LENGTH;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => requestSummary(section.content, section.title, section.title)}
                  disabled={summarizingKey !== null || tooLarge}
                  className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  title={tooLarge ? "이 섹션도 너무 깁니다." : `${section.title} 요약`}
                >
                  {summarizingKey === key ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span className="truncate">{section.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSummaryResult = () => {
    if (!summary) return null;

    return (
      <div className="mx-12 mt-4 rounded-md border border-border bg-muted/20">
        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium text-foreground">{summaryHeading}</span>
            {summaryRemainingToday !== null && (
              <span className="shrink-0 text-xs text-muted-foreground">
                오늘 {summaryRemainingToday}회 남음
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSummary("")}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="닫기"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <pre className="whitespace-pre-wrap break-words px-3 py-3 text-sm leading-6 text-foreground font-sans">
          {summary}
        </pre>
      </div>
    );
  };

  // 서버에서 받은 메타데이터 반영
  useEffect(() => {
    if (detail && !isDailyNote && hasMetadata(detail as EntityDetail)) {
      const d = detail as TaskDetail | SubTaskDetail;
      if ("startDateTime" in d) {
        // Task
        const task = d as TaskDetail;
        setMetadata({
          status: task.status ?? "NOT_STARTED",
          startDate: task.startDateTime ? new Date(task.startDateTime) : undefined,
          endDate: task.endDateTime ? new Date(task.endDateTime) : undefined,
        });
      } else {
        // SubTask
        const sub = d as SubTaskDetail;
        setMetadata({
          status: sub.status ?? "NOT_STARTED",
          startDate: sub.startDate ? new Date(sub.startDate) : undefined,
          endDate: sub.endDate ? new Date(sub.endDate) : undefined,
        });
      }
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
  const showChildrenSection = docType && docType !== "note" && hasChildren;
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
          {/* Title + Delete */}
          <div className="flex items-start">
            <input
              type="text"
              value={daily?.logicalDate ? formatLogicalDate(daily.logicalDate) : ""}
              readOnly
              className="flex-1 px-12 pt-4 pb-0 text-xl font-semibold bg-transparent outline-none"
            />
            {renderSummaryAction()}
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

          {renderSectionSummaryActions()}
          {renderSummaryResult()}

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
                onContentChange={setCurrentContent}
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
            {renderSummaryAction()}
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

          {renderSectionSummaryActions()}
          {renderSummaryResult()}

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
            onContentChange={setCurrentContent}
            collaboration={collaborationConfig}
            contentImageTarget={contentImageTarget}
          />
        </div>
      </div>
    </div>
  );
}
