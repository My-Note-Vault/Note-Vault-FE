import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export default function Editor() {
  const [title, setTitle] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "",
      }),
    ],
    content: "",
  });

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
                editor
                  ?.chain()
                  .focus("start")
                  .insertContentAt(0, { type: "paragraph" })
                  .focus("start")
                  .run();
              }
            }}
            placeholder="Untitled"
            className="w-full px-4 pt-4 pb-0 text-xl font-semibold bg-transparent outline-none"
          />
          <EditorContent
            editor={editor}
            className="prose prose-p:my-1 prose-headings:my-2 max-w-none min-h-[700px] px-4 pb-4 [&_.tiptap]:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
