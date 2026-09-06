import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowDownUp,
  ArrowRight,
  Clipboard,
  Combine,
  Expand,
  FileCheck2,
  FileImage,
  FileSignature,
  FileText,
  FileUp,
  GraduationCap,
  Layers,
  RefreshCw,
  RotateCw,
  Scissors,
  Sparkles,
  Stamp,
  UploadCloud,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatBytes } from "../lib/files";
import { ToolId } from "./ToolGrid";

type OmniDropzoneProps = {
  onRouteWithFiles: (toolId: ToolId, files: File[]) => void;
};

export default function OmniDropzone({ onRouteWithFiles }: OmniDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [detectedFiles, setDetectedFiles] = useState<File[]>([]);
  const [fileType, setFileType] = useState<"image" | "pdf" | null>(null);

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) {
        processFiles(files);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const processFiles = (files: File[]) => {
    if (!files.length) return;
    setDetectedFiles(files);
    const hasPdf = files.some((f) => f.type.includes("pdf") || f.name.endsWith(".pdf"));
    setFileType(hasPdf ? "pdf" : "image");
  };

  const clear = () => {
    setDetectedFiles([]);
    setFileType(null);
  };

  const executeAction = (toolId: ToolId) => {
    onRouteWithFiles(toolId, detectedFiles);
    clear();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-soft backdrop-blur-2xl transition-all duration-300 dark:border-white/[0.08] dark:bg-slate-900/60">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/15" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-500/15" />

      <AnimatePresence mode="wait">
        {detectedFiles.length === 0 ? (
          /* Default Drop Zone */
          <div
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
              isDragging
                ? "border-cyan-500 bg-cyan-500/10 scale-[1.01] shadow-glow"
                : "border-slate-300/80 bg-slate-50/50 hover:border-cyan-400/80 hover:bg-cyan-50/20 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-cyan-500/40"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              processFiles(Array.from(e.dataTransfer.files));
            }}
          >
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3">
              <div className="relative">
                <div
                  className={`grid h-16 w-16 place-items-center rounded-2xl transition-all duration-300 ${
                    isDragging
                      ? "scale-110 bg-cyan-500 text-white shadow-glow"
                      : "bg-gradient-to-tr from-cyan-500/10 via-teal-500/10 to-indigo-500/10 text-cyan-600 dark:text-cyan-400"
                  }`}
                >
                  {isDragging ? <FileUp size={30} className="animate-bounce" /> : <UploadCloud size={30} />}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                  <Sparkles size={12} />
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                  Drop <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">Any Image or PDF</span> Here
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Our smart engine will analyze your file and recommend the best tools instantly
                </p>
              </div>

              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <UploadCloud size={14} className="text-cyan-500" />
                  Browse Any File
                </span>
                <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200/60 bg-slate-100/80 px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <Clipboard size={13} />
                  Paste (Cmd+V)
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  100% Free & Unlimited
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                  <GraduationCap size={13} />
                  100% Exam Form Accepted (Students & Employees)
                </span>
                <span>•</span>
                <span>Zero Server Uploads</span>
              </div>

              <input
                className="sr-only"
                type="file"
                multiple
                onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))}
              />
            </label>
          </div>
        ) : (
          /* File Detected: Smart Action Recommendations */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Detected File Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 dark:bg-cyan-950/30">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-600/20">
                  {fileType === "pdf" ? <FileText size={20} /> : <FileImage size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                      {fileType === "pdf" ? "PDF Document Detected" : "Image File(s) Detected"}
                    </span>
                    <span className="rounded-full bg-cyan-600 px-2 py-0.2 text-[10px] font-bold text-white">
                      {detectedFiles.length} {detectedFiles.length === 1 ? "file" : "files"}
                    </span>
                  </div>
                  <p className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {detectedFiles[0]?.name}
                    {detectedFiles.length > 1 && ` + ${detectedFiles.length - 1} more`}
                    <span className="ml-2 font-normal text-slate-500">
                      ({formatBytes(detectedFiles.reduce((sum, f) => sum + f.size, 0))})
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={clear}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-200/50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                title="Cancel selection"
              >
                <X size={16} />
              </button>
            </div>

            {/* Smart Suggested Actions */}
            <div className="space-y-2.5">
              <span className="label block">What would you like to do with this {fileType}?</span>

              {fileType === "image" ? (
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      id: "image-to-pdf" as ToolId,
                      name: "Convert to PDF",
                      desc: "Assemble into high-res document",
                      icon: FileText,
                      color: "from-indigo-500 to-violet-500"
                    },
                    {
                      id: "resizer" as ToolId,
                      name: "Resize Dimensions",
                      desc: "Social media presets, print units, or custom px",
                      icon: ArrowDownUp,
                      color: "from-cyan-500 to-blue-500"
                    },
                    {
                      id: "compressor" as ToolId,
                      name: "Compress Image",
                      desc: "Shrink file size without visible quality loss",
                      icon: Archive,
                      color: "from-emerald-500 to-teal-500"
                    },
                    {
                      id: "image-converter" as ToolId,
                      name: "Convert Format",
                      desc: "Switch between WebP, PNG, and JPG",
                      icon: RefreshCw,
                      color: "from-sky-500 to-indigo-500"
                    },
                    {
                      id: "extender" as ToolId,
                      name: "Canvas Extender",
                      desc: "Add margin padding with solid color or transparency",
                      icon: Expand,
                      color: "from-violet-500 to-fuchsia-500"
                    }
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => executeAction(action.id)}
                        className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left transition-all hover:border-cyan-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-cyan-500"
                      >
                        <div
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr ${action.color} text-white shadow-sm transition-transform group-hover:scale-105`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                            <span>{action.name}</span>
                            <ArrowRight size={13} className="text-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {action.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      id: "pdf-compressor" as ToolId,
                      name: "Compress PDF",
                      desc: "Shrink document size for fast email & web sharing",
                      icon: Archive,
                      color: "from-emerald-500 to-teal-600"
                    },
                    {
                      id: "sign-pdf" as ToolId,
                      name: "Sign Document",
                      desc: "Draw, type, or stamp legal signatures on pages",
                      icon: FileSignature,
                      color: "from-blue-600 to-indigo-600"
                    },
                    {
                      id: "watermark-pdf" as ToolId,
                      name: "Watermark PDF",
                      desc: "Stamp custom text or logo watermark with opacity",
                      icon: Stamp,
                      color: "from-teal-500 to-cyan-600"
                    },
                    {
                      id: "organize-pdf" as ToolId,
                      name: "Organize & Reorder",
                      desc: "Drag, duplicate, delete, and sort PDF pages",
                      icon: Layers,
                      color: "from-purple-600 to-indigo-600"
                    },
                    {
                      id: "rotate-pdf" as ToolId,
                      name: "Rotate Pages",
                      desc: "Orient pages permanently and losslessly",
                      icon: RotateCw,
                      color: "from-amber-500 to-orange-500"
                    },
                    {
                      id: "pdf-to-image" as ToolId,
                      name: "PDF to JPG / Image",
                      desc: "Convert pages to JPG, PNG, WebP with custom DPI",
                      icon: FileImage,
                      color: "from-amber-500 to-yellow-500"
                    },
                    {
                      id: "pdf-merger" as ToolId,
                      name: "Merge with Other PDFs",
                      desc: "Combine multiple PDF documents into one",
                      icon: Combine,
                      color: "from-purple-500 to-pink-500"
                    },
                    {
                      id: "pdf-splitter" as ToolId,
                      name: "Split PDF Pages",
                      desc: "Extract specific pages or split every page",
                      icon: Scissors,
                      color: "from-rose-500 to-orange-500"
                    }
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => executeAction(action.id)}
                        className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left transition-all hover:border-cyan-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-cyan-500"
                      >
                        <div
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr ${action.color} text-white shadow-sm transition-transform group-hover:scale-105`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                            <span>{action.name}</span>
                            <ArrowRight size={13} className="text-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {action.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
