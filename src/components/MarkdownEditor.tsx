import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Prec } from "@codemirror/state";
import { EditorView, keymap, placeholder as placeholderExtension } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { minimalSetup } from "codemirror";
import { yCollab, yUndoManagerKeymap } from "y-codemirror.next";
import * as Y from "yjs";
import { useCollaborativeDocument, type CollaboratorInfo } from "@/collab/useCollaborativeDocument";
import type { CollaborationConfig, ProviderStatus } from "@/collab/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export interface MarkdownEditorHandle {
  focus: () => void;
}

export interface AutoSaveOptions {
  reason: "debounced" | "flush" | "unload";
}

interface MarkdownEditorProps {
  initialContent?: string;
  placeholder?: string;
  onAutoSave?: (
    content: string,
    options: AutoSaveOptions,
  ) => void | Promise<unknown>;
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

function toDisplayStatus(s: ProviderStatus): DisplayStatus {
  if (s === "idle") return "local";
  return s;
}

function CollaboratorAvatars({
  collaborators,
  displayStatus,
}: {
  collaborators: CollaboratorInfo[];
  displayStatus: DisplayStatus;
}) {
  const statusDot = (
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
  );

  if (displayStatus !== "connected" || collaborators.length === 0) {
    const label =
      displayStatus === "connecting"
        ? "Connecting"
        : displayStatus === "error"
        ? "Error"
        : displayStatus === "disconnected"
        ? "Offline"
        : "Live";

    return (
      <div className="pointer-events-none absolute right-5 top-4 z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-sm">
        {statusDot}
        {label}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute right-5 top-4 z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-1.5 py-1 backdrop-blur-sm">
      {statusDot}
      <div className="flex -space-x-1.5">
        {collaborators.map((c) => (
          <Avatar
            key={c.clientId}
            className="h-5 w-5 ring-1 ring-background"
            title={c.name}
          >
            {c.profileImageUrl ? (
              <AvatarImage src={c.profileImageUrl} alt={c.name} />
            ) : null}
            <AvatarFallback
              className="text-[8px] font-medium text-white"
              style={{ backgroundColor: c.color }}
            >
              {c.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    </div>
  );
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
  const lastContentRef = useRef(initialContent);
  const lastSettledContentRef = useRef(initialContent);
  const saveSequenceRef = useRef(0);
  const lastSettledSaveSequenceRef = useRef(0);

  const {
    doc,
    awareness,
    status: providerStatus,
    isSynced,
    collaborators,
  } = useCollaborativeDocument(collaboration);

  const displayStatus: DisplayStatus = collaboration
    ? toDisplayStatus(providerStatus)
    : "local";
  const collaborationEnabled = collaboration !== null;
  const collabKey = collaboration
    ? `${collaboration.workspaceId}/${collaboration.documentType}/${collaboration.documentId}`
    : "local";
  const sharedText = useMemo(() => {
    if (!collaborationEnabled || !doc) return null;
    return doc.getText("content");
  }, [collaborationEnabled, doc]);

  useEffect(() => {
    onAutoSaveRef.current = onAutoSave;
  }, [onAutoSave]);

  const resetSaveState = useCallback((content: string) => {
    lastContentRef.current = content;
    lastSettledContentRef.current = content;
    saveSequenceRef.current = 0;
    lastSettledSaveSequenceRef.current = 0;
  }, []);

  const runSave = useCallback((
    content: string,
    reason: AutoSaveOptions["reason"],
  ) => {
    const save = onAutoSaveRef.current;
    if (!save) return;

    const saveSequence = ++saveSequenceRef.current;
    const markSettled = () => {
      if (saveSequence < lastSettledSaveSequenceRef.current) return;
      lastSettledSaveSequenceRef.current = saveSequence;
      lastSettledContentRef.current = content;
    };

    try {
      const result = save(content, { reason });
      if (reason === "unload") {
        markSettled();
        return;
      }

      void Promise.resolve(result)
        .then(markSettled)
        .catch(() => {});
    } catch {
      // 동기 오류가 난 경우 dirty 상태를 유지해 다음 flush에서 다시 시도한다.
    }
  }, []);

  const debouncedSave = useCallback((content: string) => {
    lastContentRef.current = content;
    if (!onAutoSaveRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      runSave(content, "debounced");
    }, autoSaveDelay);
  }, [autoSaveDelay, runSave]);

  const flushSave = useCallback((reason: AutoSaveOptions["reason"]) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const content = lastContentRef.current;
    if (!onAutoSaveRef.current || content === lastSettledContentRef.current) {
      return;
    }

    runSave(content, reason);
  }, [runSave]);

  useEffect(() => {
    const handlePageExit = () => {
      flushSave("unload");
    };

    window.addEventListener("pagehide", handlePageExit);
    window.addEventListener("beforeunload", handlePageExit);

    return () => {
      window.removeEventListener("pagehide", handlePageExit);
      window.removeEventListener("beforeunload", handlePageExit);
    };
  }, [flushSave]);

  useEffect(() => {
    const parent = hostRef.current;
    if (!parent) return;

    parent.innerHTML = "";

    const isCollab = collaborationEnabled && !!sharedText && isSynced;
    const ytext = sharedText;

    if (isCollab && ytext.length === 0 && initialContent.length > 0) {
      ytext.doc?.transact(() => {
        if (ytext.length === 0) {
          ytext.insert(0, initialContent);
        }
      }, "initial-content-bootstrap");
    }

    const undoManager = ytext ? new Y.UndoManager(ytext) : null;
    const currentContent = isCollab ? ytext.toString() : initialContent;

    resetSaveState(currentContent);

    const editor = new EditorView({
      doc: currentContent,
      extensions: [
        minimalSetup,
        markdown(),
        EditorView.lineWrapping,
        editorTheme,
        collaborationEnabled && !isCollab ? EditorView.editable.of(false) : [],
        placeholder ? placeholderExtension(placeholder) : [],
        Prec.high(keymap.of(yUndoManagerKeymap)),
        isCollab && ytext && undoManager
          ? yCollab(ytext, awareness, { undoManager })
          : [],
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          if (isCollab) return;

          const content = update.state.doc.toString();
          debouncedSave(content);
        }),
      ],
      parent,
    });

    viewRef.current = editor;
    const handleCollaborativeUpdate = (event: Y.YTextEvent) => {
      const content = ytext?.toString() ?? "";
      lastContentRef.current = content;

      if (event.transaction.local) {
        debouncedSave(content);
      }
    };

    if (ytext) {
      ytext.observe(handleCollaborativeUpdate);
    }

    return () => {
      if (ytext) {
        ytext.unobserve(handleCollaborativeUpdate);
      }
      flushSave("flush");
      undoManager?.destroy();
      editor.destroy();
      viewRef.current = null;
    };
  }, [collabKey, collaborationEnabled, isSynced, sharedText, awareness, debouncedSave, flushSave, initialContent, placeholder, resetSaveState]);

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
        <CollaboratorAvatars
          collaborators={collaborators}
          displayStatus={displayStatus}
        />
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
