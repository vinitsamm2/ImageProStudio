import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Copy,
  Download,
  GripVertical,
  Layers,
  QrCode,
  RefreshCw,
  RotateCw,
  Trash2,
  Undo2,
  Sparkles,
  ArrowUpDown,
  FileText
} from "lucide-react";
import UploadZone from "../UploadZone";
import {
  PdfFileInfo,
  OrganizePageItem,
  downloadBlob,
  formatBytes,
  organizePdf,
  readPdfInfo
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

export default function PdfOrganizeView({
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
  const [organizedFile, setOrganizedFile] = useState<File | null>(null);
  const [pages, setPages] = useState<OrganizePageItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    try {
      const pdf = await readPdfInfo(picked, 80);
      setInfo(pdf);
      setOrganizedFile(null);
      const initialPlan: OrganizePageItem[] = Array.from({ length: pdf.pages }, (_, i) => ({
        id: `page-${i + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        originalPage: i + 1,
        rotation: 0
      }));
      setPages(initialPlan);
      notify(`Loaded PDF with ${pdf.pages} page(s). Drag or use arrows to organize!`, "info");
    } catch {
      notify("Could not read PDF document.", "error");
    }
  };

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && !info) {
      load(initialFiles);
    }
  }, [initialFiles]);

  const movePage = (fromIndex: number, direction: -1 | 1) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= pages.length) return;
    setPages((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      notify("A PDF must have at least one page.", "error");
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
    notify("Page removed from document plan.", "info");
  };

  const duplicatePage = (index: number) => {
    setPages((prev) => {
      const target = prev[index];
      const copy: OrganizePageItem = {
        ...target,
        id: `page-copy-${target.originalPage}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    notify("Page duplicated.", "success");
  };

  const rotatePage = (index: number, delta: number = 90) => {
    setPages((prev) => {
      const next = [...prev];
      const curr = next[index].rotation;
      next[index] = {
        ...next[index],
        rotation: ((curr + delta) % 360 + 360) % 360
      };
      return next;
    });
  };

  // Bulk transformations
  const reverseAll = () => {
    setPages((prev) => [...prev].reverse());
    notify("Reversed page order.", "info");
  };

  const resetAll = () => {
    if (!info) return;
    const initialPlan: OrganizePageItem[] = Array.from({ length: info.pages }, (_, i) => ({
      id: `page-${i + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      originalPage: i + 1,
      rotation: 0
    }));
    setPages(initialPlan);
    notify("Reset pages to original layout.", "info");
  };

  const removeEvenPages = () => {
    if (!info) return;
    const filtered = pages.filter((_, i) => (i + 1) % 2 !== 0);
    if (filtered.length === 0) return notify("Cannot remove all pages.", "error");
    setPages(filtered);
    notify("Removed even-numbered pages.", "info");
  };

  const removeOddPages = () => {
    if (!info) return;
    const filtered = pages.filter((_, i) => (i + 1) % 2 === 0);
    if (filtered.length === 0) return notify("Cannot remove all pages.", "error");
    setPages(filtered);
    notify("Removed odd-numbered pages.", "info");
  };

  const rotateAllPages = (delta: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: ((p.rotation + delta) % 360 + 360) % 360
      }))
    );
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }
    setPages((prev) => {
      const next = [...prev];
      const [item] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
    setDraggedIndex(null);
  };

  const run = async () => {
    if (!info) return notify("Upload a PDF document first.", "error");
    if (pages.length === 0) return notify("Your organized document has no pages.", "error");

    setBusy(true);
    try {
      const blob = await organizePdf(info.file, pages);
      const generated = new File([blob], `${info.file.name.replace(/\.pdf$/i, "")}-organized.pdf`, { type: "application/pdf" });
      setOrganizedFile(generated);
      downloadBlob(blob, `${info.file.name.replace(/\.pdf$/i, "")}-organized.pdf`);
      notify("Successfully generated and downloaded organized PDF!", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not organize PDF.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <span className="font-medium text-slate-700 dark:text-indigo-200">
            Need to rotate all pages at once or fix page orientation?
          </span>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-white px-3 py-1.5 font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300"
          >
            <ArrowLeftRight size={13} />
            Switch to Rotate PDF
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start xl:h-full min-h-0">
      {/* Left Workspace: Upload & Interactive Visual Grid */}
      <div className="space-y-6 xl:h-full xl:max-h-[calc(100vh-175px)] xl:overflow-y-auto overscroll-contain pr-1">
        <div className="panel">
          <UploadZone
            accept="application/pdf"
            files={info ? [info.file] : []}
            formats="PDF"
            onFiles={load}
            onRemove={() => {
              setInfo(null);
              setPages([]);
            }}
            label="Upload PDF to organize, reorder, and trim"
            helperText="Drag thumbnails or use action buttons to sort, rotate, duplicate, or delete pages"
          />
        </div>

        {info && (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                  <Layers className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {pages.length} Page{pages.length !== 1 ? "s" : ""} in Output
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  (Original: {info.pages} pages)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={reverseAll}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Reverse
                </button>
                <button
                  type="button"
                  onClick={() => rotateAllPages(90)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  Rotate All +90°
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Grid of Interactive Pages */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {pages.map((item, idx) => {
                const previewSrc = info.thumbnails[item.originalPage - 1];
                const isFirst = idx === 0;
                const isLast = idx === pages.length - 1;
                const isModifiedOrder = item.originalPage !== idx + 1;

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`group relative flex flex-col rounded-xl border bg-white p-2.5 shadow-sm transition-all duration-200 dark:bg-slate-900 ${
                      draggedIndex === idx
                        ? "scale-95 border-indigo-500 opacity-40 shadow-lg"
                        : "border-slate-200/90 hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:hover:border-indigo-500/50"
                    }`}
                  >
                    {/* Header tags: Output Position & Source Page */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="cursor-grab text-slate-400 active:cursor-grabbing hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400">
                          <GripVertical className="h-3.5 w-3.5" />
                        </span>
                        <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                          #{idx + 1}
                        </span>
                      </div>

                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          isModifiedOrder
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                        title={`Original source page #${item.originalPage}`}
                      >
                        Src {item.originalPage}
                      </span>
                    </div>

                    {/* Preview Thumbnail Container */}
                    <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800/80">
                      {previewSrc ? (
                        <img
                          src={previewSrc}
                          alt={`Page ${item.originalPage}`}
                          className="h-full w-full object-contain transition-transform duration-300 ease-out"
                          style={{
                            transform: `rotate(${item.rotation}deg)`
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
                          <FileText className="h-8 w-8" />
                          <span className="text-[11px] font-medium">Page {item.originalPage}</span>
                        </div>
                      )}

                      {/* Rotation Badge overlay if rotated */}
                      {item.rotation !== 0 && (
                        <div className="absolute top-1.5 right-1.5 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-bold text-white shadow backdrop-blur-sm">
                          {item.rotation}°
                        </div>
                      )}
                    </div>

                    {/* Action Toolbar */}
                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800/60">
                      <div className="flex items-center gap-1">
                        {/* Move Left */}
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => movePage(idx, -1)}
                          title="Move earlier"
                          className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        {/* Move Right */}
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => movePage(idx, 1)}
                          title="Move later"
                          className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Rotate Single Page */}
                        <button
                          type="button"
                          onClick={() => rotatePage(idx, 90)}
                          title="Rotate 90°"
                          className="rounded p-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </button>

                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => duplicatePage(idx)}
                          title="Duplicate page"
                          className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => deletePage(idx)}
                          title="Delete page"
                          className="rounded p-1 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Document Plan & Output Trigger (Independent scroll) */}
      <div className="space-y-6 xl:sticky xl:top-0 xl:max-h-[calc(100vh-175px)] xl:overflow-y-auto overscroll-contain pr-1">
        <div className="panel space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Document Blueprint
            </h3>
            {info && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                Ready
              </span>
            )}
          </div>

          {info ? (
            <>
              {/* Document Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Source File
                  </div>
                  <div className="mt-1 truncate text-xs font-semibold text-slate-800 dark:text-slate-200" title={info.file.name}>
                    {info.file.name}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {formatBytes(info.file.size)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Final Length
                  </div>
                  <div className="mt-1 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {pages.length} Pages
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {pages.length === info.pages ? "Same length" : `${pages.length - info.pages > 0 ? "+" : ""}${pages.length - info.pages} pages`}
                  </div>
                </div>
              </div>

              {/* Quick Preset Actions */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Quick Operations
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={removeEvenPages}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Keep Odds Only
                  </button>
                  <button
                    type="button"
                    onClick={removeOddPages}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Keep Evens Only
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateAllPages(-90)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Rotate -90° All
                  </button>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Restore Original
                  </button>
                </div>
              </div>

              {/* Sequence preview preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Output Page Sequence:
                  </span>
                </div>
                <div className="max-h-24 overflow-y-auto rounded-lg border border-slate-200/80 bg-slate-50/50 p-2 text-xs font-mono text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                  {pages.map((p, i) => `${p.originalPage}${p.rotation ? `(${p.rotation}°)` : ""}`).join(" → ")}
                </div>
              </div>

              {/* Download / Generate CTA */}
              <button
                type="button"
                onClick={run}
                disabled={busy || pages.length === 0}
                className="btn btn-primary w-full py-3 text-sm font-semibold shadow-lg shadow-indigo-500/20"
              >
                {busy ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Organize & Download PDF
                  </>
                )}
              </button>

              {organizedFile && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => downloadBlob(organizedFile, organizedFile.name)}
                    className="btn-secondary w-full py-2.5 text-xs font-bold"
                  >
                    <Download size={14} />
                    Download Organized PDF Again
                  </button>
                  {onShareFile && (
                    <button
                      type="button"
                      onClick={() => onShareFile(organizedFile)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 py-2.5 px-3 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition shadow-sm"
                    >
                      <QrCode size={14} className="text-indigo-600 dark:text-indigo-400" />
                      📱 Download on Mobile via QR Code / Share
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <Layers className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Upload a PDF file to begin rearranging, deleting, or duplicating pages.
              </p>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="panel space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Organize PDF Features
          </div>
          <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-500">•</span>
              <span><strong>Drag & Drop</strong> page cards directly to reorder quickly.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-500">•</span>
              <span><strong>100% In-Browser:</strong> Your PDF pages are processed entirely on your device via WebAssembly.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-500">•</span>
              <span><strong>Lossless Quality:</strong> Original vector text, fonts, and embedded images remain pristine.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    </div>
  );
}
