import { useState, useCallback, useRef, useEffect } from "react";
import MarkdownEditor, { type MarkdownEditorHandle } from "@/components/MarkdownEditor";
import { ChevronRight, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import type { DocType } from "@/types/common";
import TaskMetadata, { type TaskMetadataValues } from "@/components/TaskMetadata";
import { useDailyNoteDetail, useUpdateDailyNote } from "@/hooks/useDocuments";
import type { DailyNoteDetail } from "@/api/documents";
import { useEntityDetail, useAutoSaveEntity, useUpdateEntity, type EntityDetail } from "@/hooks/useEntity";
import type { TaskDetail } from "@/types/task";
import type { SubTaskDetail } from "@/types/subtask";

function hasMetadata(detail: EntityDetail): detail is TaskDetail | SubTaskDetail {
  return "metadata" in detail && detail.metadata != null;
}

interface EditorProps {
  isDailyNote?: boolean;
  docType?: DocType;
  documentId: string;
  documentName: string;
  children?: { id: string; name: string }[];
  onOpenDocument?: (id: string) => void;
  onRenameDocument?: (id: string, newName: string) => void;
  isNew?: boolean;
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
}: EditorProps) {
  const [title, setTitle] = useState(isDailyNote ? "TODO" : documentName);
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const renameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRenameDocumentRef = useRef(onRenameDocument);
  onRenameDocumentRef.current = onRenameDocument;

  const debouncedRename = useCallback((id: string, newName: string) => {
    if (renameTimerRef.current) clearTimeout(renameTimerRef.current);
    renameTimerRef.current = setTimeout(() => {
      onRenameDocumentRef.current?.(id, newName);
    }, 2000);
  }, []);

  const [metadata, setMetadata] = useState<TaskMetadataValues>({
    status: "todo",
    startDate: undefined,
    endDate: undefined,
  });

  // 엔티티 상세 조회
  const {
    data: entityDetail,
    isLoading: isEntityLoading,
    isError: isEntityError,
    refetch: refetchEntity,
  } = useEntityDetail(isDailyNote || isNew ? null : documentId, docType);

  const {
    data: dailyDetail,
    isLoading: isDailyLoading,
    isError: isDailyError,
    refetch: refetchDaily,
  } = useDailyNoteDetail(isDailyNote);

  const detail = isDailyNote ? dailyDetail : entityDetail;
  const loading = isNew ? false : isDailyNote ? isDailyLoading : isEntityLoading;
  const isError = isNew ? false : isDailyNote ? isDailyError : isEntityError;
  const refetch = isDailyNote ? refetchDaily : refetchEntity;

  // daily note id는 상세 조회 결과에서 가져옴
  const dailyNoteId = dailyDetail?.dailyNoteId;

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
    setTitle(isDailyNote ? "TODO" : documentName);
  }, [isDailyNote, documentName]);

  // 자동 저장 (엔티티)
  const autoSaveMutation = useAutoSaveEntity();

  const handleAutoSave = useCallback(
    (content: string) => {
      if (!docType || !documentId) return;
      autoSaveMutation.mutate({ id: documentId, type: docType, content });
    },
    [documentId, docType, autoSaveMutation],
  );

  // 자동 저장 (DailyNote)
  const dailyUpdateMutation = useUpdateDailyNote();

  const handleDailyAutoSave = useCallback(
    (field: "todayTodo" | "tomorrowTodo" | "memo", content: string) => {
      if (!isDailyNote || !dailyNoteId) return;

      dailyUpdateMutation.mutate({
        dailyNoteId,
        body: {
          [field]: content,
        },
      });
    },
    [isDailyNote, dailyNoteId, dailyUpdateMutation],
  );

  // 메타데이터 변경 저장
  const updateMutation = useUpdateEntity();

  const handleMetadataChange = useCallback(
    (newMetadata: TaskMetadataValues) => {
      if (!docType) return;

      setMetadata(newMetadata);

      updateMutation.mutate({
        id: documentId,
        type: docType,
        metadata: {
          status: newMetadata.status,
          startDate: newMetadata.startDate?.toISOString().slice(0, 10) ?? null,
          endDate: newMetadata.endDate?.toISOString().slice(0, 10) ?? null,
        },
      });
    },
    [documentId, docType, updateMutation],
  );

  const hasChildren = children && children.length > 0;
  const showChildrenSection = docType && docType !== "trivia" && hasChildren;
  const showMetadata = docType === "task" || docType === "subtask";

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

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[54.4rem] mx-auto p-6">
          <input
            type="text"
            value={title}
            readOnly
            className="w-full px-12 pt-4 pb-0 text-xl font-semibold bg-transparent outline-none"
          />

          <div className="px-12 pt-6 pb-1">
            <h3 className="text-sm font-medium text-muted-foreground">오늘 할 일</h3>
          </div>
          <MarkdownEditor
            initialContent={daily?.todayTodo ?? ""}
            onAutoSave={(content) => handleDailyAutoSave("todayTodo", content)}
          />

          <div className="px-12 pt-4 pb-1">
            <div className="border-t border-border mb-4" />
            <h3 className="text-sm font-medium text-muted-foreground">내일 할 일</h3>
          </div>
          <MarkdownEditor
            initialContent={daily?.tomorrowTodo ?? ""}
            onAutoSave={(content) => handleDailyAutoSave("tomorrowTodo", content)}
          />

          <div className="px-12 pt-4 pb-1">
            <div className="border-t border-border mb-4" />
            <h3 className="text-sm font-medium text-muted-foreground">메모</h3>
          </div>
          <MarkdownEditor
            initialContent={daily?.memo ?? ""}
            onAutoSave={(content) => handleDailyAutoSave("memo", content)}
          />
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
            onChange={(e) => {
              setTitle(e.target.value);
              debouncedRename(documentId, e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
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