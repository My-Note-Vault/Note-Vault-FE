import { useState, useCallback, useRef, useEffect } from "react";
import MarkdownEditor, { type MarkdownEditorHandle } from "@/components/MarkdownEditor";
import { ChevronRight } from "lucide-react";
import type { DocType } from "@/components/Sidebar";
import TaskMetadata, { type TaskMetadataValues } from "@/components/TaskMetadata";

interface EditorProps {
  isDailyNote?: boolean;
  docType?: DocType;
  documentId: string;
  documentName: string;
  children?: { id: string; name: string }[];
  onOpenDocument?: (id: string) => void;
  onRenameDocument?: (id: string, newName: string) => void;
}

export default function Editor({ isDailyNote = false, docType, documentId, documentName, children, onOpenDocument, onRenameDocument }: EditorProps) {
  const [title, setTitle] = useState(isDailyNote ? "TODO" : documentName);
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [metadata, setMetadata] = useState<TaskMetadataValues>({
    status: "todo",
    startDate: undefined,
    endDate: undefined,
  });

  useEffect(() => {
    setTitle(isDailyNote ? "TODO" : documentName);
  }, [isDailyNote, documentName]);

  const handleAutoSave = useCallback((content: string) => {
    console.log("자동 저장:", content);
  }, []);

  const hasChildren = children && children.length > 0;
  const showChildrenSection = docType && docType !== "trivia" && hasChildren;
  const showMetadata = docType === "task" || docType === "subtask";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[54.4rem] mx-auto p-6">
        <div>
          <input
            type="text"
            value={title}
            readOnly={isDailyNote}
            onChange={(e) => {
              if (isDailyNote) return;
              setTitle(e.target.value);
              onRenameDocument?.(documentId, e.target.value);
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
              <TaskMetadata value={metadata} onChange={setMetadata} />
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

          <MarkdownEditor ref={editorRef} onAutoSave={handleAutoSave} />
        </div>
      </div>
    </div>
  );
}
