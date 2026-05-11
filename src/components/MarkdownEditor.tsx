import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Prec } from "@codemirror/state";
import { EditorView, keymap, placeholder as placeholderExtension } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { minimalSetup } from "codemirror";
import { yCollab, yUndoManagerKeymap } from "y-codemirror.next";
import * as Y from "yjs";
import { useCollaborativeDocument } from "@/collab/useCollaborativeDocument";
import type { CollaborationConfig, ProviderStatus } from "@/collab/types";

export interface MarkdownEditorHandle {
  focus: () => void;
}

interface MarkdownEditorProps {
  initialContent?: string;
  placeholder?: string;
  onAutoSave?: (content: string) => void;
  autoSaveDelay?: number;
  collaboration?: CollaborationConfig | null;
}

type DisplayStatus =
  | "local"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

const editorTheme = EditorView.theme({
  "&": {
    minHeight: "700px",
    backgroundColor: "transparent",
    color: "hsl(var(--foreground))",
    fontSize: "1rem",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    minHeight: "700px",
    fontFamily: "inherit",
    lineHeight: "1.75",
    paddingInline: "3rem",
    paddingBottom: "1rem",
  },
  ".cm-content": {
    minHeight: "700px",
    paddingTop: "1rem",
    paddingBottom: "5rem",
    caretColor: "hsl(var(--foreground))",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  ".cm-line": {
    padding: "0",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "hsl(var(--accent))",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-gutters": {
    display: "none",
  },
  ".cm-cursor": {
    borderLeftColor: "hsl(var(--foreground))",
  },
});

const statusText: Record<DisplayStatus, string> = {
  local: "Local",
  connecting: "Connecting",
  connected: "Live",
  disconnected: "Offline",
  error: "Error",
};

function toDisplayStatus(s: ProviderStatus): DisplayStatus {
  if (s === "idle") return "local";
  return s;
}

const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(({
  initialContent = "",
  placeholder = "",
  onAutoSave,
  autoSaveDelay = 2000,
  collaboration = null,
}, ref) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAutoSaveRef = useRef(onAutoSave);

  const { doc, awareness, status: providerStatus } = useCollaborativeDocument(collaboration);

  const displayStatus: DisplayStatus = collaboration
    ? toDisplayStatus(providerStatus)
    : "local";

  useEffect(() => {
    onAutoSaveRef.current = onAutoSave;
  }, [onAutoSave]);

  const debouncedSave = useCallback((content: string) => {
    if (!onAutoSaveRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      onAutoSaveRef.current?.(content);
    }, autoSaveDelay);
  }, [autoSaveDelay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // collaboration config key for editor re-creation
  const collabKey = useMemo(() => {
    if (!collaboration) return "local";
    return `${collaboration.workspaceId}/${collaboration.documentType}/${collaboration.documentId}`;
  }, [collaboration?.workspaceId, collaboration?.documentType, collaboration?.documentId]);

  useEffect(() => {
    const parent = hostRef.current;
    if (!parent) return;

    parent.innerHTML = "";

    const isCollab = !!collaboration && !!doc;
    const ytext = isCollab ? doc!.getText("content") : null;
    const undoManager = ytext ? new Y.UndoManager(ytext) : null;

    const editor = new EditorView({
      doc: isCollab ? ytext?.toString() ?? "" : initialContent,
      extensions: [
        minimalSetup,
        markdown(),
        EditorView.lineWrapping,
        editorTheme,
        placeholder ? placeholderExtension(placeholder) : [],
        Prec.high(keymap.of(yUndoManagerKeymap)),
        isCollab && ytext && undoManager
          ? yCollab(ytext, awareness, { undoManager })
          : [],
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          if (isCollab) return;

          debouncedSave(update.state.doc.toString());
        }),
      ],
      parent,
    });

    viewRef.current = editor;

    return () => {
      undoManager?.destroy();
      editor.destroy();
      viewRef.current = null;
    };
  }, [collabKey, doc, awareness, debouncedSave, initialContent, placeholder]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      const view = viewRef.current;
      if (!view) return;

      view.focus();
      view.dispatch({
        selection: { anchor: 0, head: 0 },
      });
    },
  }), []);

  return (
    <div className="relative min-h-[700px]">
      {collaboration && (
        <div className="pointer-events-none absolute right-5 top-4 z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-sm">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              displayStatus === "connected"
                ? "bg-green-500"
                : displayStatus === "connecting"
                ? "bg-yellow-500 animate-pulse"
                : displayStatus === "error"
                ? "bg-red-500"
                : "bg-gray-400"
            }`}
          />
          {statusText[displayStatus]}
        </div>
      )}
      <div
        ref={hostRef}
        className="min-h-[700px] cursor-text"
        onClick={() => viewRef.current?.focus()}
      />
    </div>
  );
});

export default MarkdownEditor;
