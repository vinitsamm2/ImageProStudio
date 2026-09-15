import { useEffect, useRef, useState, useCallback } from "react";
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
  const annotationRef = useRef(annotation);
  annotationRef.current = annotation;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const [quillFailed, setQuillFailed] = useState(false);
  const [fallbackText, setFallbackText] = useState(annotation.text || "");
  const fallbackInputRef = useRef<HTMLDivElement | null>(null);

  // Measure text width helper
  const measureWidth = useCallback(
    (text: string, fontSize: number, isBold: boolean, isItalic: boolean) => {
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
          const currentAnn = annotationRef.current;
          return Math.min(
            0.98 - currentAnn.xNorm,
            (maxLineW + fontSize * 0.8) / (pageWidth || 595)
          );
        }
      } catch {
        // ignore
      }
      return 0.08;
    },
    [cssFontFamily, pageWidth]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let quillInstance: Quill | null = null;
    let hostEl: HTMLDivElement | null = null;
    let hostDom: Element | null = null;

    try {
      // Create host div for Quill instance
      hostEl = document.createElement("div");
      hostEl.className = "quill-host-editor h-full w-full";
      containerRef.current.appendChild(hostEl);

      quillInstance = new Quill(hostEl, {
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
      quillRef.current = quillInstance;

      if (annotationRef.current.text) {
        quillInstance.setText(annotationRef.current.text);
      }

      // Immediately focus Quill and select all text for instant editing
      setTimeout(() => {
        if (quillRef.current) {
          quillRef.current.focus();
          quillRef.current.setSelection(0, quillRef.current.getLength());
        }
      }, 30);

      quillInstance.on("text-change", () => {
        if (!quillRef.current) return;
        const raw = quillRef.current.getText();
        const text = raw.endsWith("\n") ? raw.slice(0, -1) : raw;
        const format = quillRef.current.getFormat();

        const isBold = Boolean(format.bold);
        const isItalic = Boolean(format.italic);
        const textColor = typeof format.color === "string" ? format.color : undefined;
        const bgColor = typeof format.background === "string" ? format.background : undefined;

        const currentAnn = annotationRef.current;
        let fontSize = currentAnn.fontSize || 14;
        if (format.size === "small") fontSize = Math.max(9, Math.round((currentAnn.fontSize || 14) * 0.8));
        else if (format.size === "large") fontSize = Math.round((currentAnn.fontSize || 14) * 1.3);
        else if (format.size === "huge") fontSize = Math.round((currentAnn.fontSize || 14) * 1.75);

        const measuredW = measureWidth(text, fontSize, isBold, isItalic);
        const lineCount = (text.match(/\n/g) || []).length + 1;
        const singleLineHeightNorm = (fontSize * 1.35) / (pageHeight || 842);
        const neededHeightNorm = Math.max(
          currentAnn.originalBounds?.heightNorm || 0,
          singleLineHeightNorm * lineCount
        );

        const minW = currentAnn.originalBounds?.widthNorm || 0.05;

        onUpdateRef.current({
          text,
          fontWeight: isBold ? "bold" : currentAnn.fontWeight || "normal",
          fontStyle: isItalic ? "italic" : currentAnn.fontStyle || "normal",
          textColor: textColor || currentAnn.textColor,
          whiteoutColor: bgColor || currentAnn.whiteoutColor,
          fontSize,
          widthNorm: Math.max(minW, measuredW),
          heightNorm: Math.max(currentAnn.heightNorm, neededHeightNorm)
        });
      });

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onFinishRef.current();
        }
      };

      const handleBlur = (e: FocusEvent) => {
        const related = e.relatedTarget as HTMLElement | null;
        if (
          related &&
          (containerRef.current?.contains(related) ||
            related.closest(".ql-tooltip") ||
            related.closest(".pdf-annotation-box") ||
            related.closest(".quill-pdf-wrapper"))
        ) {
          return;
        }
        // Save and finish on blur
        onFinishRef.current();
      };

      hostDom = hostEl.querySelector(".ql-editor");
      hostDom?.addEventListener("keydown", handleKeyDown as any);
      hostDom?.addEventListener("blur", handleBlur as any);
    } catch (err) {
      console.warn("Quill failed to initialize, using contenteditable fallback:", err);
      setQuillFailed(true);
    }

    return () => {
      if (hostDom) {
        hostDom.removeEventListener("keydown", () => {});
        hostDom.removeEventListener("blur", () => {});
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      quillRef.current = null;
    };
  }, [measureWidth, pageHeight]);

  // Fallback direct editing if Quill fails
  if (quillFailed) {
    return (
      <div
        ref={fallbackInputRef}
        contentEditable
        suppressContentEditableWarning
        className="h-full w-full outline-hidden whitespace-pre-wrap select-text px-0.5"
        style={{
          fontSize: `${(annotation.fontSize || 14) * zoomScale}px`,
          fontFamily: cssFontFamily,
          fontWeight: annotation.fontWeight || "normal",
          fontStyle: annotation.fontStyle || "normal",
          color: annotation.textColor || "#0f172a",
          backgroundColor:
            annotation.underlayWhiteout !== false
              ? annotation.whiteoutColor || "#ffffff"
              : "transparent"
        }}
        onInput={(e) => {
          const text = e.currentTarget.innerText || "";
          setFallbackText(text);
          const currentAnn = annotationRef.current;
          const measuredW = measureWidth(
            text,
            currentAnn.fontSize || 14,
            currentAnn.fontWeight === "bold",
            currentAnn.fontStyle === "italic"
          );
          onUpdateRef.current({
            text,
            widthNorm: Math.max(currentAnn.originalBounds?.widthNorm || 0.05, measuredW)
          });
        }}
        onBlur={() => onFinishRef.current()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onFinishRef.current();
          }
        }}
      >
        {fallbackText}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => e.stopPropagation()}
      className="quill-pdf-wrapper h-full w-full select-text"
      style={{
        fontSize: `${(annotation.fontSize || 14) * zoomScale}px`,
        fontFamily: cssFontFamily,
        fontWeight: annotation.fontWeight || "normal",
        fontStyle: annotation.fontStyle || "normal",
        color: annotation.textColor || "#0f172a",
        backgroundColor:
          annotation.underlayWhiteout !== false
            ? annotation.whiteoutColor || "#ffffff"
            : "transparent"
      }}
    />
  );
}
