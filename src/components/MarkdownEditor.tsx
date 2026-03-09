import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export interface MarkdownEditorHandle {
  focus: () => void;
}

interface MarkdownEditorProps {
  initialContent?: string;
  placeholder?: string;
  onAutoSave?: (content: string) => void;
  autoSaveDelay?: number;
}

const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(({
  initialContent = "",
  placeholder = "",
  onAutoSave,
  autoSaveDelay = 2000,
}, ref) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAutoSaveRef = useRef(onAutoSave);

  useEffect(() => {
    onAutoSaveRef.current = onAutoSave;
  }, [onAutoSave]);

  const debouncedSave = useCallback(
    (content: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onAutoSaveRef.current?.(content);
      }, autoSaveDelay);
    },
    [autoSaveDelay],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      debouncedSave(editor.getHTML());
    },
  });

  useImperativeHandle(ref, () => ({
    focus: () => editor?.commands.focus("start"),
  }), [editor]);

  return (
    <div
      className="min-h-[700px] px-12 pb-4 cursor-text"
      onClick={() => editor?.commands.focus("end")}
    >
      <EditorContent
        editor={editor}
        className="prose prose-p:my-1 prose-headings:my-2 max-w-none [&_.tiptap]:outline-none"
      />
    </div>
  );
});

export default MarkdownEditor;
