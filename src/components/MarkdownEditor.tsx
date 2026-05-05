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
import { WebsocketProvider } from "y-websocket";
import { yCollab, yUndoManagerKeymap } from "y-codemirror.next";
import * as Y from "yjs";
import type { CollaborationUser } from "@/lib/collaboration";

export interface MarkdownEditorHandle {
  focus: () => void;
}

export interface MarkdownEditorCollaborationConfig {
  room: string;
  serverUrl: string;
  params?: Record<string, string>;
  user: CollaborationUser;
}

interface MarkdownEditorProps {
  initialContent?: string;
  placeholder?: string;
  onAutoSave?: (content: string) => void;
  autoSaveDelay?: number;
  collaboration?: MarkdownEditorCollaborationConfig | null;
}

type CollaborationStatus =
  | "local"
  | "connecting"
  | "syncing"
  | "connected"
  | "disconnected";

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

const statusText: Record<CollaborationStatus, string> = {
  local: "Local",
  connecting: "Connecting",
  syncing: "Syncing",
  connected: "Live",
  disconnected: "Offline",
};

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
  const [connectionStatus, setConnectionStatus] = useState<CollaborationStatus>(
    collaboration ? "connecting" : "local",
  );

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

  const collaborationKey = useMemo(() => {
    if (!collaboration) return "local";

    return JSON.stringify({
      room: collaboration.room,
      serverUrl: collaboration.serverUrl,
      params: collaboration.params ?? {},
      user: collaboration.user,
    });
  }, [collaboration]);

  useEffect(() => {
    const parent = hostRef.current;
    if (!parent) return;

    parent.innerHTML = "";
    setConnectionStatus(collaboration ? "connecting" : "local");

    const ydoc = collaboration ? new Y.Doc() : null;
    const ytext = ydoc?.getText("content") ?? null;
    const undoManager = ytext ? new Y.UndoManager(ytext) : null;
    const provider = collaboration && ydoc
      ? new WebsocketProvider(collaboration.serverUrl, collaboration.room, ydoc, {
          params: collaboration.params,
        })
      : null;

    if (provider && collaboration) {
      provider.awareness.setLocalStateField("user", collaboration.user);
    }

    const handleStatus = (event: { status: "connected" | "disconnected" }) => {
      if (event.status === "connected") {
        setConnectionStatus("syncing");
        return;
      }

      setConnectionStatus("disconnected");
    };

    const handleSync = (isSynced: boolean) => {
      if (isSynced) {
        setConnectionStatus("connected");
        return;
      }

      setConnectionStatus(provider?.wsconnected ? "syncing" : "disconnected");
    };

    provider?.on("status", handleStatus);
    provider?.on("sync", handleSync);

    const editor = new EditorView({
      doc: collaboration ? ytext?.toString() ?? "" : initialContent,
      extensions: [
        minimalSetup,
        markdown(),
        EditorView.lineWrapping,
        editorTheme,
        placeholder ? placeholderExtension(placeholder) : [],
        Prec.high(keymap.of(yUndoManagerKeymap)),
        collaboration && ytext && undoManager
          ? yCollab(ytext, provider?.awareness, { undoManager })
          : [],
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          if (collaboration) return;

          debouncedSave(update.state.doc.toString());
        }),
      ],
      parent,
    });

    viewRef.current = editor;

    return () => {
      provider?.off("status", handleStatus);
      provider?.off("sync", handleSync);
      provider?.awareness.setLocalState(null);
      provider?.destroy();
      undoManager?.destroy();
      ydoc?.destroy();
      editor.destroy();
      viewRef.current = null;
    };
  }, [collaboration, collaborationKey, debouncedSave, initialContent, placeholder]);

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
        <div className="pointer-events-none absolute right-5 top-4 z-10 rounded-full border border-border bg-background/85 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-sm">
          {statusText[connectionStatus]}
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
