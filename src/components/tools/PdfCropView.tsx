import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Crop,
  Download,
  Layers,
  Maximize2,
  Minimize2,
  QrCode,
  RefreshCw,
  RotateCcw,
  Sliders,
  X
} from "lucide-react";
import UploadZone from "../UploadZone";
import {
  PdfFileInfo,
  downloadBlob,
  formatBytes,
  readPdfInfo
} from "../../lib/files";
import { PDFDocument } from "pdf-lib";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

type CropMargins = {
  left: number; // percentage (0 to 45)
  right: number;
  top: number;
  bottom: number;
};

export default function PdfCropView({
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
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [margins, setMargins] = useState<CropMargins>({
    left: 5,
    right: 5,
    top: 5,
    bottom: 5
  });
  const [applyScope, setApplyScope] = useState<"all" | "current">("all");
  const [busy, setBusy] = useState(false);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);

  const load = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    try {
      const pdf = await readPdfInfo(picked, 20);
      setInfo(pdf);
      setActivePageIndex(0);
      setCroppedFile(null);
      setMargins({ left: 5, right: 5, top: 5, bottom: 5 });
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

  const applyPreset = (preset: "default" | "trim" | "shipping" | "top-half" | "bottom-half") => {
    switch (preset) {
      case "default":
        setMargins({ left: 0, right: 0, top: 0, bottom: 0 });
        break;
      case "trim":
        setMargins({ left: 8, right: 8, top: 8, bottom: 8 });
        break;
      case "shipping":
        setMargins({ left: 10, right: 10, top: 5, bottom: 35 });
        break;
      case "top-half":
        setMargins({ left: 0, right: 0, top: 0, bottom: 50 });
        break;
      case "bottom-half":
        setMargins({ left: 0, right: 0, top: 50, bottom: 0 });
        break;
    }
    notify("Applied crop preset", "info");
  };

  const handleCrop = async () => {
    if (!info) return notify("Upload a PDF document first.", "error");
    setBusy(true);

    try {
      const arrayBuffer = await info.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      const pagesToCrop = applyScope === "all" ? pages : [pages[activePageIndex]];

      for (const page of pagesToCrop) {
        if (!page) continue;
        const { width, height } = page.getSize();

        const cropX = (margins.left / 100) * width;
        const cropY = (margins.bottom / 100) * height;
        const cropW = width * (1 - (margins.left + margins.right) / 100);
        const cropH = height * (1 - (margins.top + margins.bottom) / 100);

        if (cropW > 10 && cropH > 10) {
          page.setCropBox(cropX, cropY, cropW, cropH);
          page.setMediaBox(cropX, cropY, cropW, cropH);
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const outName = `${info.file.name.replace(/\.pdf$/i, "")}-cropped.pdf`;
      const generated = new File([blob], outName, { type: "application/pdf" });

      setCroppedFile(generated);

      if (onShareFile) {
        onShareFile(generated);
      } else {
        downloadBlob(blob, outName);
      }

      notify(`Successfully cropped ${applyScope === "all" ? "all pages" : `Page ${activePageIndex + 1}`}!`, "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to crop PDF.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <span className="font-medium text-slate-700 dark:text-indigo-200">
            Need to rotate or reorder PDF pages?
          </span>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="btn-secondary h-8 gap-1.5 px-3 text-xs font-bold cursor-pointer"
          >
            <ArrowLeftRight size={13} />
            <span>Switch to Rotate PDF</span>
          </button>
        </div>
      )}

      {!info ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
                <Crop size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Crop PDF</h2>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    Smart Trim
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Trim margins, isolate shipping labels (4×6), or crop unwanted white space from PDF pages.
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
            label="Drag & Drop PDF to Crop Margins"
            helperText="Interactive visual crop handles with instant PDF export"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Crop size={20} />
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
                <p className="text-[11px] text-slate-400">Set crop margins below</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setInfo(null);
                setCroppedFile(null);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:border-white/[0.1] dark:bg-slate-800 dark:text-slate-300 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Change File</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Crop Controls & Presets */}
            <div className="lg:col-span-6 space-y-5">
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 space-y-4">
                {/* Crop Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Quick Presets
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => applyPreset("trim")}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      Trim Margins (8%)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("shipping")}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      Shipping Label
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("top-half")}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      Top Half (50%)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("bottom-half")}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      Bottom Half (50%)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("default")}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      Reset (0%)
                    </button>
                  </div>
                </div>

                {/* Margin Sliders */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Fine-tune Crop Edges (%)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span>Top Trim</span>
                        <span className="text-blue-600">{margins.top}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={45}
                        value={margins.top}
                        onChange={(e) => setMargins((m) => ({ ...m, top: Number(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span>Bottom Trim</span>
                        <span className="text-blue-600">{margins.bottom}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={45}
                        value={margins.bottom}
                        onChange={(e) => setMargins((m) => ({ ...m, bottom: Number(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span>Left Trim</span>
                        <span className="text-blue-600">{margins.left}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={45}
                        value={margins.left}
                        onChange={(e) => setMargins((m) => ({ ...m, left: Number(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span>Right Trim</span>
                        <span className="text-blue-600">{margins.right}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={45}
                        value={margins.right}
                        onChange={(e) => setMargins((m) => ({ ...m, right: Number(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Apply Scope: All Pages vs Current Page */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Apply Crop To
                  </label>
                  <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800/40">
                    <button
                      type="button"
                      onClick={() => setApplyScope("all")}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        applyScope === "all"
                          ? "bg-white shadow-xs text-blue-600 dark:bg-slate-900 dark:text-white"
                          : "text-slate-500"
                      }`}
                    >
                      All Pages ({info.pages})
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyScope("current")}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        applyScope === "current"
                          ? "bg-white shadow-xs text-blue-600 dark:bg-slate-900 dark:text-white"
                          : "text-slate-500"
                      }`}
                    >
                      Current Page (P.{activePageIndex + 1}) Only
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCrop}
                  disabled={busy}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 h-12 text-sm font-black text-white shadow-lg shadow-blue-500/25 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {busy ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Cropping Document...</span>
                    </>
                  ) : (
                    <>
                      <Crop size={16} />
                      <span>Crop & Download PDF</span>
                    </>
                  )}
                </button>

                {croppedFile && onShareFile && (
                  <button
                    type="button"
                    onClick={() => onShareFile(croppedFile)}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 h-12 text-xs font-bold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400 shadow-xs transition-all cursor-pointer"
                  >
                    <QrCode size={16} />
                    <span>Send to Phone</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Visual Crop Box Preview */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 flex flex-col items-center text-center space-y-3">
                <div className="flex items-center justify-between w-full text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Page {activePageIndex + 1} Preview</span>
                  {info.pages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                        disabled={activePageIndex === 0}
                        className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 dark:border-white/[0.08] dark:bg-slate-800 cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePageIndex((p) => Math.min(info.pages - 1, p + 1))}
                        disabled={activePageIndex === info.pages - 1}
                        className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 dark:border-white/[0.08] dark:bg-slate-800 cursor-pointer"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Page Canvas Container with Crop Overlay */}
                <div className="relative w-64 h-88 rounded-2xl border border-slate-200 overflow-hidden shadow-lg bg-slate-900 flex items-center justify-center">
                  {info.thumbnails[activePageIndex] ? (
                    <img
                      src={info.thumbnails[activePageIndex]}
                      alt={`Page ${activePageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs font-bold">PDF Page</div>
                  )}

                  {/* Darkened Crop Backdrop */}
                  <div
                    className="absolute inset-0 bg-black/55 pointer-events-none"
                    style={{
                      clipPath: `polygon(
                        0% 0%, 100% 0%, 100% 100%, 0% 100%,
                        0% 0%,
                        ${margins.left}% ${margins.top}%,
                        ${margins.left}% ${100 - margins.bottom}%,
                        ${100 - margins.right}% ${100 - margins.bottom}%,
                        ${100 - margins.right}% ${margins.top}%,
                        ${margins.left}% ${margins.top}%
                      )`
                    }}
                  />

                  {/* Highlighted Crop Rectangle */}
                  <div
                    className="absolute border-2 border-dashed border-blue-400 pointer-events-none transition-all shadow-2xl"
                    style={{
                      top: `${margins.top}%`,
                      bottom: `${margins.bottom}%`,
                      left: `${margins.left}%`,
                      right: `${margins.right}%`
                    }}
                  >
                    {/* Corner Handles */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-600 rounded-xs border border-white" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-600 rounded-xs border border-white" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-600 rounded-xs border border-white" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-600 rounded-xs border border-white" />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  The bright area inside the blue box will be kept in the exported PDF.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
