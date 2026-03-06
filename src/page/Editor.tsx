import { useState, useCallback, useRef } from "react";
import MarkdownEditor, { type MarkdownEditorHandle } from "@/components/MarkdownEditor";

export default function Editor() {
  const [title, setTitle] = useState("");
  const editorRef = useRef<MarkdownEditorHandle>(null);

  const handleAutoSave = useCallback((content: string) => {
    console.log("자동 저장:", content);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        <div className="border rounded-md">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                editorRef.current?.focus();
              }
            }}
            placeholder="Untitled"
            className="w-full px-4 pt-4 pb-0 text-xl font-semibold bg-transparent outline-none"
          />
          <MarkdownEditor ref={editorRef} onAutoSave={handleAutoSave} />
        </div>
      </div>
    </div>
  );
}
