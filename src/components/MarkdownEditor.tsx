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
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { GFM, Strikethrough } from "@lezer/markdown";
import { tags } from "@lezer/highlight";
import { minimalSetup } from "codemirror";
import { markdownDecorations } from "@/components/markdownDecorations";
import { obsidianKeymap } from "@/components/markdownKeymap";
import { yCollab, yUndoManagerKeymap } from "y-codemirror.next";
import * as Y from "yjs";
import { toast } from "sonner";
import { useCollaborativeDocument, type CollaboratorInfo } from "@/collab/useCollaborativeDocument";
import type { CollaborationConfig, ProviderStatus } from "@/collab/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { uploadContentImage, type ContentImageTarget } from "@/api/contentImages";

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
  onContentChange?: (content: string) => void;
  autoSaveDelay?: number;
  collaboration?: CollaborationConfig | null;
  contentImageTarget?: ContentImageTarget | null;
}

type DisplayStatus =
  | "local"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

const editorTheme = EditorView.theme({
  // ── Base ────────────────────────────────────────────────────────────────
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

  // ── Headings ────────────────────────────────────────────────────────────
  ".cm-md-heading": {
    fontWeight: "700",
    lineHeight: "1.3",
    display: "block",
  },
  ".cm-md-h1": { fontSize: "2em" },
  ".cm-md-h2": { fontSize: "1.6em" },
  ".cm-md-h3": { fontSize: "1.3em" },
  ".cm-md-h4": { fontSize: "1.15em" },
  ".cm-md-h5": { fontSize: "1em", color: "hsl(var(--muted-foreground))" },
  ".cm-md-h6": { fontSize: "0.9em", color: "hsl(var(--muted-foreground))" },

  // ── Emphasis ─────────────────────────────────────────────────────────────
  ".cm-md-bold": { fontWeight: "700" },
  ".cm-md-italic": { fontStyle: "italic" },
  ".cm-md-strike": {
    textDecoration: "line-through",
    opacity: "0.65",
  },

  // ── Inline Code ──────────────────────────────────────────────────────────
  ".cm-md-inline-code": {
    fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
    fontSize: "0.875em",
    backgroundColor: "hsl(var(--muted))",
    borderRadius: "0.25rem",
    padding: "0.15em 0.4em",
    border: "1px solid hsl(var(--border))",
  },

  // ── Code Block ───────────────────────────────────────────────────────────
  ".cm-md-code-block": {
    fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
    fontSize: "0.875em",
    backgroundColor: "hsl(var(--muted))",
    paddingLeft: "1em",
    paddingRight: "1em",
    display: "block",
  },

  // ── Blockquote ───────────────────────────────────────────────────────────
  ".cm-md-quote": {
    borderLeft: "3px solid hsl(var(--border))",
    paddingLeft: "1em",
    color: "hsl(var(--muted-foreground))",
  },

  // ── Link ─────────────────────────────────────────────────────────────────
  ".cm-md-link": {
    color: "hsl(var(--primary))",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
    cursor: "pointer",
  },

  // ── Bullet ───────────────────────────────────────────────────────────────
  ".cm-md-bullet-widget": {
    color: "hsl(var(--muted-foreground))",
    paddingRight: "0.3em",
  },

  // ── HR ───────────────────────────────────────────────────────────────────
  ".cm-md-hr-widget": {
    display: "block",
    height: "1px",
    borderTop: "2px solid hsl(var(--border))",
    margin: "0.5em 0",
    width: "100%",
    pointerEvents: "none",
  },
  ".cm-md-image-widget": {
    display: "block",
    margin: "0.75rem 0",
  },
  ".cm-md-image-widget img": {
    display: "block",
    maxWidth: "100%",
    maxHeight: "520px",
    borderRadius: "0.375rem",
    objectFit: "contain",
  },
});

// minimalSetup의 defaultHighlightStyle이 heading에 underline을 붙이므로 덮어씀
const noHeadingUnderline = Prec.high(
  syntaxHighlighting(
    HighlightStyle.define([
      { tag: tags.heading, textDecoration: "none", fontWeight: "bold" },
      { tag: tags.heading1, textDecoration: "none", fontWeight: "bold" },
      { tag: tags.heading2, textDecoration: "none", fontWeight: "bold" },
      { tag: tags.heading3, textDecoration: "none", fontWeight: "bold" },
      { tag: tags.heading4, textDecoration: "none", fontWeight: "bold" },
      { tag: tags.heading5, textDecoration: "none", fontWeight: "bold" },
      { tag: tags.heading6, textDecoration: "none", fontWeight: "bold" },
    ])
  )
);

function toDisplayStatus(s: ProviderStatus): DisplayStatus {
  if (s === "idle") return "local";
  return s;
}

function getClipboardImageFiles(event: ClipboardEvent): File[] {
  const items = Array.from(event.clipboardData?.items ?? []);
  return items
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}

function escapeMarkdownAlt(value: string): string {
  return value.replace(/[\[\]\\]/g, "\\$&");
}

function imageAltText(file: File, index: number): string {
  const fallback = `image-${index + 1}`;
  if (!file.name) return fallback;
  return file.name.replace(/\.[^.]+$/, "") || fallback;
}

function markdownForImages(files: File[], keys: string[]): string {
  return keys
    .map((key, index) => `![${escapeMarkdownAlt(imageAltText(files[index], index))}](${key})`)
    .join("\n\n");
}

function insertMarkdownBlock(view: EditorView, markdown: string) {
  const selection = view.state.selection.main;
  const line = view.state.doc.lineAt(selection.from);
  const before = view.state.doc.sliceString(line.from, selection.from);
  const after = view.state.doc.sliceString(selection.to, line.to);
  const prefix = before.trim().length > 0 ? "\n\n" : "";
  const suffix = after.trim().length > 0 ? "\n\n" : "\n";

  view.dispatch(view.state.replaceSelection(`${prefix}${markdown}${suffix}`));
  view.focus();
}

function uploadProgressMessage(fileCount: number, progress: number): string {
  const prefix = fileCount > 1 ? `${fileCount}개 이미지 업로드 중` : "이미지 업로드 중";
  return `${prefix}... ${progress}%`;
}

async function pasteClipboardImages(
  view: EditorView,
  files: File[],
  target: ContentImageTarget,
) {
  const progressByFile = files.map(() => 0);
  const toastId = toast.loading(uploadProgressMessage(files.length, 0));

  try {
    const keys = await Promise.all(
      files.map((file, index) =>
        uploadContentImage(file, target, (progress) => {
          progressByFile[index] = progress;
          const totalProgress = Math.round(
            progressByFile.reduce((sum, value) => sum + value, 0) / files.length,
          );
          toast.loading(uploadProgressMessage(files.length, totalProgress), {
            id: toastId,
          });
        }),
      ),
    );
    insertMarkdownBlock(view, markdownForImages(files, keys));
    toast.success("이미지를 삽입했습니다.", { id: toastId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.";
    toast.error(message, { id: toastId });
  }
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
  onContentChange,
  autoSaveDelay = 1000,
  collaboration = null,
  contentImageTarget = null,
}, ref) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAutoSaveRef = useRef(onAutoSave);
  const onContentChangeRef = useRef(onContentChange);
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

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

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
    onContentChangeRef.current?.(currentContent);

    const editor = new EditorView({
      doc: currentContent,
      extensions: [
        minimalSetup,
        markdown({ base: markdownLanguage, extensions: [GFM, Strikethrough] }),
        EditorView.lineWrapping,
        editorTheme,
        markdownDecorations,
        noHeadingUnderline,
        Prec.high(obsidianKeymap),
        contentImageTarget
          ? EditorView.domEventHandlers({
              paste(event, view) {
                const files = getClipboardImageFiles(event);
                if (files.length === 0) return false;

                event.preventDefault();
                void pasteClipboardImages(view, files, contentImageTarget);
                return true;
              },
            })
          : [],
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
          onContentChangeRef.current?.(content);
          debouncedSave(content);
        }),
      ],
      parent,
    });

    viewRef.current = editor;
    const handleCollaborativeUpdate = (event: Y.YTextEvent) => {
      const content = ytext?.toString() ?? "";
      lastContentRef.current = content;
      onContentChangeRef.current?.(content);

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
  }, [collabKey, collaborationEnabled, isSynced, sharedText, awareness, debouncedSave, flushSave, initialContent, placeholder, resetSaveState, contentImageTarget]);

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
