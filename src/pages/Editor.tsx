import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Save, Settings, Eye } from "lucide-react";
import { Navigation } from "@/components/ui/navigation";
import { marked } from "marked";
import DOMPurify from "dompurify";
import * as html2pdf from "html2pdf.js";
import { useParams, useLocation } from "react-router-dom";

// ⭐ 추가: API 함수 import
import { getTemplateDetail, saveMarkdown, updateTemplate } from "@/api/template";

export default function Editor() {
  // ⭐ Editor URL → /editor/:id 에서 id 가져오기
  const { id: templateId } = useParams();

  const location = useLocation();
  const { title: initialTitle, description: initialDescription, images: initialImages } =
    location.state || {};

  const [markdown, setMarkdown] = useState("");
  const [previewOnly, setPreviewOnly] = useState(false);

  
  useEffect(() => {
    if (!templateId) return;

    (async () => {
      try {
        const data = await getTemplateDetail(templateId);
        setMarkdown(data.markdown ?? "");
      } catch (err) {
        console.error("템플릿 불러오기 실패", err);
      }
    })();
  }, [templateId]);


  const renderMarkdown = (text: string) => {
    const html = marked.parse(text, { breaks: true }) as string;
    return DOMPurify.sanitize(html);
  };


  useEffect(() => {
    if (!templateId) return;

    const interval = setInterval(() => {
      saveMarkdown(templateId, markdown);
    }, 5000);

    return () => clearInterval(interval);
  }, [markdown, templateId]);



  // 수동 저장 버튼
  const handleSave = async () => {
    if (!templateId) return;
    try {
      await updateTemplate(templateId, {
        title: initialTitle,
        description: initialDescription,
        images: initialImages,
        markdown,
      });
      alert("저장 완료!");
    } catch (err) {
      console.error("저장 실패", err);
    }
  };


  const handleExportPDF = () => {
    const element = document.getElementById("pdf-preview");
    if (!element) return;

    const options = {
      margin: 0,
      filename: "notevault_document.pdf",
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    (html2pdf as any).default(element, options);
  };


  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Toolbar */}
      <div className="border-b p-4 bg-muted/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h2 className="text-lg font-semibold">Note Vault Markdown Editor</h2>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" /> 저장
            </Button>

            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" /> 설정
            </Button>

            <Button
              variant={previewOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewOnly(!previewOnly)}
            >
              <Eye className="h-4 w-4 mr-2" /> 미리보기
            </Button>

            <Button onClick={handleExportPDF} size="sm">
              <Download className="h-4 w-4 mr-2" /> PDF 내보내기
            </Button>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        
        {/* LEFT — PREVIEW */}
        <div className={`flex-1 p-5 bg-vault-gray-light overflow-auto ${previewOnly ? "w-full" : "w-1/2"}`}>
          <div className="max-w-4xl mx-auto">
            <div
              id="pdf-preview"
              className="mx-auto bg-white shadow-elegant border border-border/20"
              style={{ width: "210mm", minHeight: "297mm", padding: "25mm" }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          </div>
        </div>

        {/* RIGHT — MARKDOWN INPUT */}
        {!previewOnly && (
          <div className="w-1/2 border-l bg-white flex flex-col">
            <div className="p-4 border-b bg-muted/10">
              <span className="text-sm text-gray-500">Markdown 입력</span>
            </div>

            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="flex-1 rounded-none resize-none border-none focus-visible:ring-0 p-5 font-mono text-sm leading-6"
            />
          </div>
        )}
      </div>
    </div>
  );
}
