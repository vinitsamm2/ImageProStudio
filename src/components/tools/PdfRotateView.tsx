import { useState } from "react";
import { ArrowLeftRight, Download, QrCode, RefreshCw, RotateCcw, RotateCw, Sparkles, Undo2 } from "lucide-react";
import UploadZone from "../UploadZone";
import {
  PdfFileInfo,
  downloadBlob,
  formatBytes,
  readPdfInfo,
  rotatePdf
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

export default function PdfRotateView({
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
  const [rotatedFile, setRotatedFile] = useState<File | null>(null);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);

  const load = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    try {
      const pdf = await readPdfInfo(picked, 30);
      setInfo(pdf);
      setRotations({});
      setRotatedFile(null);
      notify(`Loaded PDF with ${pdf.pages} page(s).`, "info");
    } catch {
      notify("Could not read PDF document.", "error");
    }
  };

  const rotateSingle = (pageNum: number, delta: number) => {
    setRotations((prev) => {
      const curr = prev[pageNum] || 0;
      const next = ((curr + delta) % 360 + 360) % 360;
      return { ...prev, [pageNum]: next };
    });
  };

  const rotateAll = (delta: number) => {
    if (!info) return;
    setRotations((prev) => {
      const next: Record<number, number> = {};
      for (let i = 1; i <= info.pages; i++) {
        const curr = prev[i] || 0;
        next[i] = ((curr + delta) % 360 + 360) % 360;
      }
      return next;
    });
  };

  const resetRotations = () => {
    setRotations({});
  };

  const rotatedCount = Object.values(rotations).filter((r) => r !== 0).length;

  const run = async () => {
    if (!info) return notify("Upload a PDF document first.", "error");
    setBusy(true);
    try {
      const blob = await rotatePdf(info.file, rotations);
      const generated = new File([blob], `${info.file.name.replace(/\.pdf$/i, "")}-rotated.pdf`, { type: "application/pdf" });
      setRotatedFile(generated);
      downloadBlob(blob, `${info.file.name.replace(/\.pdf$/i, "")}-rotated.pdf`);
      notify("Successfully rotated and downloaded PDF!", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not rotate PDF.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <span className="font-medium text-slate-700 dark:text-indigo-200">
            Need to drag, reorder, duplicate, or delete pages in your document?
          </span>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-white px-3 py-1.5 font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300"
          >
            <ArrowLeftRight size={13} />
            Switch to Organize PDF
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start xl:h-full min-h-0">
      {/* Left Area: Upload & Interactive Visual Page Grid */}
      <div className="space-y-6 xl:h-full xl:max-h-[calc(100vh-175px)] xl:overflow-y-auto overscroll-contain pr-1">
        <div className="panel">
          <UploadZone
            accept="application/pdf"
            files={info ? [info.file] : []}
            formats="PDF"
            onFiles={load}
            onRemove={() => {
              setInfo(null);
              setRotations({});
            }}
            label="Upload PDF to rotate pages"
            helperText="Rotate all pages at once or click individual pages to orient precisely"
          />
        </div>

        {info && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Document Pages ({info.pages})</span>
                  {rotatedCount > 0 && (
                    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                      {rotatedCount} Modified
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click the rotate buttons on any page thumbnail to change its orientation
                </p>
              </div>

              {/* Batch Rotation Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => rotateAll(90)}
                  className="btn-secondary h-8 px-2.5 text-xs"
                  title="Rotate all pages 90° clockwise"
                >
                  <RotateCw size={13} className="text-cyan-500" />
                  <span>All +90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => rotateAll(-90)}
                  className="btn-secondary h-8 px-2.5 text-xs"
                  title="Rotate all pages 90° counter-clockwise"
                >
                  <RotateCcw size={13} className="text-cyan-500" />
                  <span>All -90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => rotateAll(180)}
                  className="btn-secondary h-8 px-2.5 text-xs"
                  title="Flip all pages 180°"
                >
                  <RefreshCw size={13} className="text-cyan-500" />
                  <span>All 180°</span>
                </button>
                {rotatedCount > 0 && (
                  <button
                    type="button"
                    onClick={resetRotations}
                    className="btn-ghost h-8 px-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Reset all rotations"
                  >
                    <Undo2 size={13} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {info.thumbnails.map((thumb, idx) => {
                const page = idx + 1;
                const angle = rotations[page] || 0;
                return (
                  <div
                    key={thumb}
                    className={`rounded-2xl border p-2.5 transition flex flex-col justify-between ${
                      angle !== 0
                        ? "border-cyan-500/50 bg-cyan-50/20 dark:border-cyan-500/30 dark:bg-cyan-950/10 shadow-sm"
                        : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <div className="relative mb-2 flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950">
                      <img
                        src={thumb}
                        alt={`Page ${page}`}
                        style={{
                          transform: `rotate(${angle}deg)`,
                          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                        className="max-h-full max-w-full object-contain p-1.5"
                      />
                      {angle !== 0 && (
                        <span className="absolute top-2 right-2 rounded-md bg-cyan-600/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-md">
                          {angle}°
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-sans text-xs font-bold text-slate-700 dark:text-slate-200">
                        Page {page}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => rotateSingle(page, -90)}
                          className="btn-secondary h-7 w-7 p-0"
                          title="Rotate 90° CCW"
                        >
                          <RotateCcw size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => rotateSingle(page, 90)}
                          className="btn-secondary h-7 w-7 p-0 text-cyan-600 dark:text-cyan-400"
                          title="Rotate 90° CW"
                        >
                          <RotateCw size={12} />
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

      {/* Right Area: Summary & Execution */}
      <div className="space-y-5 xl:h-full xl:max-h-[calc(100vh-175px)] xl:overflow-y-auto overscroll-contain pr-1">
        <div className="panel space-y-5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Rotation Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Apply orientation corrections and export clean document
            </p>
          </div>

          {info && (
            <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-tr from-cyan-500/10 via-teal-500/5 to-transparent p-4 space-y-2.5 dark:border-cyan-500/25 dark:bg-slate-900/60">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-cyan-500" />
                  <span>Document Details</span>
                </span>
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-300">
                  {info.pages} Total Pages
                </span>
              </div>

              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>File Name:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                    {info.file.name}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>File Size:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">
                    {formatBytes(info.file.size)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Rotated Pages:</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {rotatedCount} of {info.pages}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              100% Lossless Rotation.
            </span>{" "}
            Document pages are rotated at the PDF container level without rasterization, preserving vector text, links, and crisp quality.
          </div>

          <button
            className="btn-primary w-full"
            disabled={busy || !info}
            onClick={run}
          >
            <Download size={16} />
            {busy ? "Saving Rotated PDF..." : `Save & Download PDF (${rotatedCount} Rotated)`}
          </button>

          {rotatedFile && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => downloadBlob(rotatedFile, rotatedFile.name)}
                className="btn-secondary w-full py-2.5 text-xs font-bold"
              >
                <Download size={14} />
                Download Rotated PDF Again
              </button>
              {onShareFile && (
                <button
                  type="button"
                  onClick={() => onShareFile(rotatedFile)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 py-2.5 px-3 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition shadow-sm"
                >
                  <QrCode size={14} className="text-indigo-600 dark:text-indigo-400" />
                  📱 Download on Mobile via QR Code / Share
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
