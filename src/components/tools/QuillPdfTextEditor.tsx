import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.bubble.css";
import { PdfAnnotation } from "../../lib/files";

interface QuillPdfTextEditorProps {
  annotation: PdfAnnotation;
  zoomScale: number;
  pageWidth: number;
  pageHeight: number;
  cssFontFamily: string;
  onUpdate: (updated: Partial<PdfAnnotation>) => void;
  onFinish: () => void;
}

export default function QuillPdfTextEditor({
  annotation,
  zoomScale,
  pageWidth,
  pageHeight,
  cssFontFamily,
  onUpdate,
  onFinish
}: QuillPdfTextEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create host div for Quill instance
    const hostEl = document.createElement("div");
    hostEl.className = "quill-host-editor h-full w-full";
    containerRef.current.appendChild(hostEl);

    const quill = new Quill(hostEl, {
      theme: "bubble",
      placeholder: "Type text...",
      modules: {
        toolbar: [
          [{ size: ["small", false, "large", "huge"] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          ["clean"]
        ]
      }
    });
    quillRef.current = quill;

    if (annotation.text) {
      quill.setText(annotation.text);
    }

    // Immediately focus Quill and select all text for instant editing
    setTimeout(() => {
      quill.focus();
      quill.setSelection(0, quill.getLength());
    }, 20);

    quill.on("text-change", () => {
      const raw = quill.getText();
      const text = raw.endsWith("\n") ? raw.slice(0, -1) : raw;
      const format = quill.getFormat();

      const isBold = Boolean(format.bold);
      const isItalic = Boolean(format.italic);
      const textColor = typeof format.color === "string" ? format.color : undefined;
      const bgColor = typeof format.background === "string" ? format.background : undefined;

      let fontSize = annotation.fontSize || 14;
      if (format.size === "small") fontSize = Math.max(9, Math.round((annotation.fontSize || 14) * 0.8));
      else if (format.size === "large") fontSize = Math.round((annotation.fontSize || 14) * 1.3);
      else if (format.size === "huge") fontSize = Math.round((annotation.fontSize || 14) * 1.75);

      // Measure text width
      let measuredW = 0.08;
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.font = `${isItalic ? "italic " : ""}${isBold ? "bold " : ""}${fontSize}px ${cssFontFamily}`;
          const lines = (text || " ").split("\n");
          let maxLineW = 0;
          for (const l of lines) {
            const w = ctx.measureText(l || " ").width;
            if (w > maxLineW) maxLineW = w;
          }
          measuredW = Math.min(0.98 - annotation.xNorm, (maxLineW + fontSize * 0.8) / (pageWidth || 595));
        }
      } catch {
        // ignore
      }

      const lineCount = (text.match(/\n/g) || []).length + 1;
      const singleLineHeightNorm = (fontSize * 1.35) / (pageHeight || 842);
      const neededHeightNorm = Math.max(
        annotation.originalBounds?.heightNorm || 0,
        singleLineHeightNorm * lineCount
      );

      const minW = annotation.originalBounds?.widthNorm || 0.05;

      onUpdate({
        text,
        fontWeight: isBold ? "bold" : "normal",
        fontStyle: isItalic ? "italic" : "normal",
        textColor: textColor || annotation.textColor,
        whiteoutColor: bgColor || annotation.whiteoutColor,
        fontSize,
        widthNorm: Math.max(minW, measuredW),
        heightNorm: Math.max(annotation.heightNorm, neededHeightNorm)
      });
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onFinish();
      }
    };

    const hostDom = hostEl.querySelector(".ql-editor");
    hostDom?.addEventListener("keydown", handleKeyDown as any);

    return () => {
      hostDom?.removeEventListener("keydown", handleKeyDown as any);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      quillRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="quill-pdf-wrapper h-full w-full select-text"
      style={{
        fontSize: `${(annotation.fontSize || 14) * zoomScale}px`,
        fontFamily: cssFontFamily,
        fontWeight: annotation.fontWeight || "normal",
        fontStyle: annotation.fontStyle || "normal",
        color: annotation.textColor || "#0f172a",
        backgroundColor:
          annotation.underlayWhiteout !== false ? annotation.whiteoutColor || "#ffffff" : "transparent"
      }}
    />
  );
}
