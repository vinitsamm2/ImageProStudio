import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Download,
  FileDigit,
  FileText,
  Layers,
  Palette,
  QrCode,
  RefreshCw,
  Settings2,
  Sliders,
  Type,
  X
} from "lucide-react";
import UploadZone from "../UploadZone";
import {
  PdfFileInfo,
  downloadBlob,
  formatBytes,
  readPdfInfo
} from "../../lib/files";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

type PositionPreset =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export default function PdfPageNumberView({
  notify,
  initialFiles,
  onSwitchViceVersa,
  onShareFile
}: {
  notify: ToastNotify;
  initialFiles?: File[];
  onSwitchViceVersa?: () => void;
  onShareFile?: (file: File) => void;
}) {
  const [info, setInfo] = useState<PdfFileInfo | null>(null);
  const [format, setFormat] = useState<"page-n-of-total" | "n" | "dash-n-dash" | "page-n" | "custom">("page-n-of-total");
  const [customFormat, setCustomFormat] = useState("Page {n} of {total}");
  const [position, setPosition] = useState<PositionPreset>("bottom-center");
  const [fontFamily, setFontFamily] = useState<"Helvetica" | "TimesRoman" | "Courier">("Helvetica");
  const [fontSize, setFontSize] = useState<number>(11);
  const [fontColor, setFontColor] = useState<string>("#1e293b");
  const [margin, setMargin] = useState<number>(28);
  const [skipCover, setSkipCover] = useState<boolean>(false);
  const [startNumber, setStartNumber] = useState<number>(1);
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [stampedFile, setStampedFile] = useState<File | null>(null);

  const load = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    try {
      const pdf = await readPdfInfo(picked, 15);
      setInfo(pdf);
      setPreviewPageIndex(0);
      setStampedFile(null);
      notify(`Loaded PDF with ${pdf.pages} page(s).`, "info");
    } catch {
      notify("Could not read PDF document.", "error");
    }
  };

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      load(initialFiles);
    }
  }, [initialFiles]);

  const hexToRgb01 = (hex: string) => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16) / 255 || 0;
    const g = parseInt(clean.substring(2, 4), 16) / 255 || 0;
    const b = parseInt(clean.substring(4, 6), 16) / 255 || 0;
    return { r, g, b };
  };

  const getPageText = (pageIdx: number, totalPages: number) => {
    if (skipCover && pageIdx === 0) return "";
    const n = skipCover ? pageIdx + startNumber - 1 : pageIdx + startNumber;
    const total = skipCover ? totalPages - 1 : totalPages;

    switch (format) {
      case "page-n-of-total":
        return `Page ${n} of ${total}`;
      case "n":
        return `${n}`;
      case "dash-n-dash":
        return `- ${n} -`;
      case "page-n":
        return `Page ${n}`;
      case "custom":
        return customFormat
          .replace(/\{n\}/g, String(n))
          .replace(/\{total\}/g, String(total));
      default:
        return `Page ${n} of ${total}`;
    }
  };

  const handleApply = async () => {
    if (!info) return notify("Upload a PDF document first.", "error");
    setBusy(true);

    try {
      const arrayBuffer = await info.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      let font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      if (fontFamily === "TimesRoman") {
        font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      } else if (fontFamily === "Courier") {
        font = await pdfDoc.embedFont(StandardFonts.Courier);
      }

      const { r, g, b } = hexToRgb01(fontColor);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      for (let i = 0; i < totalPages; i++) {
        const page = pages[i];
        const text = getPageText(i, totalPages);
        if (!text) continue;

        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        let x = 0;
        let y = 0;

        // Determine X coordinate
        if (position.includes("left")) {
          x = margin;
        } else if (position.includes("center")) {
          x = (width - textWidth) / 2;
        } else if (position.includes("right")) {
          x = width - textWidth - margin;
        }

        // Determine Y coordinate
        if (position.includes("top")) {
          y = height - margin - textHeight;
        } else {
          y = margin;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b)
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const outName = `${info.file.name.replace(/\.pdf$/i, "")}-numbered.pdf`;
      const generated = new File([blob], outName, { type: "application/pdf" });

      setStampedFile(generated);

      if (onShareFile) {
        onShareFile(generated);
      } else {
        downloadBlob(blob, outName);
      }

      notify("Page numbers successfully stamped!", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to stamp page numbers.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <span className="font-medium text-slate-700 dark:text-indigo-200">
            Need to sign or watermark your PDF instead?
          </span>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="btn-secondary h-8 gap-1.5 px-3 text-xs font-bold cursor-pointer"
          >
            <ArrowLeftRight size={13} />
            <span>Switch to Watermark PDF</span>
          </button>
        </div>
      )}

      {!info ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
                <FileDigit size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Add Page Numbers</h2>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    Bates & Headers
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Insert page numbers, Bates stamps, and headers/footers with custom positioning and real-time live preview.
                </p>
              </div>
            </div>
          </div>

          <UploadZone
            accept="application/pdf"
            formats="PDF"
            files={[]}
            onFiles={load}
            multiple={false}
            label="Drag & Drop PDF to Number Pages"
            helperText="Fast vector typography stamping inside your browser"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <FileDigit size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-xs">
                    {info.file.name}
                  </h3>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {formatBytes(info.file.size)}
                  </span>
                  <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {info.pages} Page(s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Configure page number styling below</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setInfo(null);
                setStampedFile(null);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:border-white/[0.1] dark:bg-slate-800 dark:text-slate-300 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Change File</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Numbering Options & Controls */}
            <div className="lg:col-span-7 space-y-5">
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 space-y-4">
                {/* Format Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Type size={14} className="text-blue-600" />
                    <span>Numbering Format</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "page-n-of-total", label: "Page 1 of N" },
                      { id: "n", label: "1, 2, 3..." },
                      { id: "dash-n-dash", label: "- 1 -" },
                      { id: "page-n", label: "Page 1" }
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFormat(f.id as any)}
                        className={`rounded-xl border p-2.5 text-center text-xs font-bold transition-all cursor-pointer ${
                          format === f.id
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-300"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800/50 dark:text-slate-300"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6-Position Grid Selector */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sliders size={14} className="text-blue-600" />
                    <span>Position on Page</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-w-sm">
                    {[
                      { id: "top-left", label: "Top Left" },
                      { id: "top-center", label: "Top Center" },
                      { id: "top-right", label: "Top Right" },
                      { id: "bottom-left", label: "Bottom Left" },
                      { id: "bottom-center", label: "Bottom Center" },
                      { id: "bottom-right", label: "Bottom Right" }
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setPosition(pos.id as PositionPreset)}
                        className={`rounded-xl border p-2 text-center text-[11px] font-bold transition-all cursor-pointer ${
                          position === pos.id
                            ? "border-blue-500 bg-blue-600 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800/50 dark:text-slate-300"
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography & Appearance */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  {/* Font Family */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Font Family
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="Helvetica">Helvetica (Clean)</option>
                      <option value="TimesRoman">Times Roman (Serif)</option>
                      <option value="Courier">Courier (Monospace)</option>
                    </select>
                  </div>

                  {/* Font Size */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>Size</span>
                      <span className="text-blue-600">{fontSize}pt</span>
                    </label>
                    <input
                      type="range"
                      min={8}
                      max={20}
                      step={1}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  {/* Color */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        className="h-8 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5 dark:border-slate-700 bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                        {fontColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Page Rules & Margins */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <label className="flex items-center gap-2 rounded-2xl border border-slate-200 p-3 text-xs font-bold text-slate-700 dark:border-white/[0.08] dark:bg-slate-800/40 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipCover}
                      onChange={(e) => setSkipCover(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <div>
                      <div>Skip Cover Page</div>
                      <div className="text-[10px] font-normal text-slate-400">Leave Page 1 unnumbered</div>
                    </div>
                  </label>

                  <div className="space-y-1 rounded-2xl border border-slate-200 p-3 dark:border-white/[0.08] dark:bg-slate-800/40">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>Margin from Edge</span>
                      <span className="text-blue-600">{margin}pt</span>
                    </label>
                    <input
                      type="range"
                      min={12}
                      max={60}
                      step={2}
                      value={margin}
                      onChange={(e) => setMargin(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={busy}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 h-12 text-sm font-black text-white shadow-lg shadow-blue-500/25 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {busy ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Numbering Pages...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Apply Page Numbers & Download</span>
                    </>
                  )}
                </button>

                {stampedFile && onShareFile && (
                  <button
                    type="button"
                    onClick={() => onShareFile(stampedFile)}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 h-12 text-xs font-bold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400 shadow-xs transition-all cursor-pointer"
                  >
                    <QrCode size={16} />
                    <span>Send to Phone</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Live Stamping Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 flex flex-col items-center text-center space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Live Visual Preview
                </div>

                {/* Page Canvas Container */}
                <div className="relative w-64 h-88 rounded-2xl border border-slate-200 overflow-hidden shadow-lg bg-white dark:border-slate-800 dark:bg-slate-950 flex items-center justify-center">
                  {info.thumbnails[previewPageIndex] ? (
                    <img
                      src={info.thumbnails[previewPageIndex]}
                      alt={`Page ${previewPageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-slate-300 text-xs font-bold">PDF Page Preview</div>
                  )}

                  {/* Stamp Overlay Text */}
                  {getPageText(previewPageIndex, info.pages) && (
                    <div
                      className="absolute pointer-events-none transition-all"
                      style={{
                        ...(position.includes("top") ? { top: `${Math.max(8, margin / 2)}px` } : { bottom: `${Math.max(8, margin / 2)}px` }),
                        ...(position.includes("left") ? { left: `${Math.max(8, margin / 2)}px` } : {}),
                        ...(position.includes("center") ? { left: "50%", transform: "translateX(-50%)" } : {}),
                        ...(position.includes("right") ? { right: `${Math.max(8, margin / 2)}px` } : {}),
                        color: fontColor,
                        fontSize: `${fontSize}px`,
                        fontFamily: fontFamily === "TimesRoman" ? "serif" : fontFamily === "Courier" ? "monospace" : "sans-serif"
                      }}
                    >
                      <span className="bg-white/80 dark:bg-slate-900/80 px-1 py-0.5 rounded shadow-2xs font-bold">
                        {getPageText(previewPageIndex, info.pages)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Page Selector Tabs */}
                {info.pages > 1 && (
                  <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1">
                    {Array.from({ length: Math.min(info.pages, 6) }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPreviewPageIndex(i)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                          previewPageIndex === i
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        P.{i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
