import { useState } from "react";
import { ArrowLeftRight, Check, CheckSquare, Download, FileText, QrCode, Scissors, Square } from "lucide-react";
import UploadZone from "../UploadZone";
import { MetricCard, Select, TextField } from "../ui/Controls";
import {
  PdfFileInfo,
  createZipBlob,
  downloadBlob,
  formatBytes,
  parsePageRanges,
  readPdfInfo,
  splitPdf,
  zipAndDownload
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

export default function PdfSplitterView({
  notify,
  onSwitchViceVersa,
  onShareFile
}: {
  notify: ToastNotify;
  onSwitchViceVersa?: () => void;
  onShareFile?: (file: File) => void;
}) {
  const [info, setInfo] = useState<PdfFileInfo | null>(null);
  const [mode, setMode] = useState<"ranges" | "selected" | "every">("ranges");
  const [ranges, setRanges] = useState("1");
  const [selected, setSelected] = useState<number[]>([]);
  const [outputs, setOutputs] = useState<Array<{ name: string; blob: Blob }>>([]);
  const [busy, setBusy] = useState(false);

  const load = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    try {
      const pdf = await readPdfInfo(picked, 16);
      setInfo(pdf);
      setRanges(`1-${Math.min(pdf.pages, 5)}`);
      setSelected([1]);
      setOutputs([]);
      notify(`Loaded PDF with ${pdf.pages} pages.`, "info");
    } catch {
      notify("Failed to read PDF document.", "error");
    }
  };

  const selectOdd = () => {
    if (!info) return;
    const odds = Array.from({ length: info.pages }, (_, i) => i + 1).filter((p) => p % 2 !== 0);
    setSelected(odds);
    setRanges(odds.join(", "));
  };

  const selectEven = () => {
    if (!info) return;
    const evens = Array.from({ length: info.pages }, (_, i) => i + 1).filter((p) => p % 2 === 0);
    setSelected(evens);
    setRanges(evens.join(", "));
  };

  const selectAll = () => {
    if (!info) return;
    const all = Array.from({ length: info.pages }, (_, i) => i + 1);
    setSelected(all);
    setRanges(`1-${info.pages}`);
  };

  const togglePage = (page: number) => {
    const next = selected.includes(page)
      ? selected.filter((p) => p !== page)
      : [...selected, page].sort((a, b) => a - b);
    setSelected(next);
    setRanges(next.join(", "));
  };

  const runSplit = async () => {
    if (!info) return notify("Upload a PDF first.", "error");
    const pages =
      mode === "every"
        ? Array.from({ length: info.pages }, (_, index) => index + 1)
        : mode === "selected"
        ? selected
        : parsePageRanges(ranges, info.pages);

    if (!pages.length) return notify("Select at least one page to split.", "error");
    setBusy(true);
    try {
      const result = await splitPdf(
        info.file,
        pages,
        mode === "every" || mode === "selected"
      );
      setOutputs(result);
      notify(`PDF split into ${result.length} file(s)!`, "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not split PDF.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleShareBatch = async () => {
    if (!onShareFile || outputs.length === 0) return;
    if (outputs.length === 1) {
      const file = new File([outputs[0].blob], outputs[0].name, { type: "application/pdf" });
      onShareFile(file);
    } else {
      const zipBlob = await createZipBlob(outputs);
      const zipFile = new File([zipBlob], "imagepro-split-pages.zip", { type: "application/zip" });
      onShareFile(zipFile);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start min-h-0">
      {/* Left Area: Upload & Interactive Page Grid */}
      <div className="space-y-6 xl:max-h-[calc(100vh-210px)] xl:overflow-y-auto pr-1">
        {onSwitchViceVersa && (
          <div className="flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs dark:bg-rose-950/20">
            <span className="font-medium text-slate-700 dark:text-rose-200">
              Need the reverse? Combine multiple PDFs into one document?
            </span>
            <button
              type="button"
              onClick={onSwitchViceVersa}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-white px-3 py-1.5 font-bold text-rose-700 shadow-sm transition hover:bg-rose-50 dark:bg-slate-900 dark:text-rose-300"
            >
              <ArrowLeftRight size={13} />
              Switch to PDF Merger
            </button>
          </div>
        )}

        <div className="panel">
          <UploadZone
            accept="application/pdf"
            files={info ? [info.file] : []}
            formats="PDF"
            onFiles={load}
            onRemove={() => {
              setInfo(null);
              setOutputs([]);
            }}
            label="Upload PDF to split pages"
            helperText="Drag & drop or browse a PDF document"
          />
        </div>

        {info && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Page Selector ({info.pages} total pages)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectAll}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={selectOdd}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  Odd Pages
                </button>
                <button
                  type="button"
                  onClick={selectEven}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  Even Pages
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {info.thumbnails.map((thumb, index) => {
                const page = index + 1;
                const isChecked = selected.includes(page);
                return (
                  <button
                    key={thumb}
                    type="button"
                    onClick={() => togglePage(page)}
                    className={`group relative overflow-hidden rounded-2xl border p-2 text-left transition-all ${
                      isChecked
                        ? "border-cyan-500 bg-cyan-500/10 shadow-soft ring-2 ring-cyan-500/30 dark:border-cyan-400 dark:bg-cyan-950/40"
                        : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <div className="relative mb-2 flex h-36 w-full items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-950">
                      <img
                        src={thumb}
                        alt={`Page ${page}`}
                        className="max-h-full max-w-full object-contain p-1"
                      />
                      <span
                        className={`absolute top-2 right-2 grid h-5 w-5 place-items-center rounded-md text-xs font-bold transition ${
                          isChecked
                            ? "bg-cyan-600 text-white"
                            : "bg-slate-900/40 text-transparent group-hover:text-white"
                        }`}
                      >
                        <Check size={12} />
                      </span>
                    </div>
                    <p className="text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      Page {page}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {outputs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Split Results ({outputs.length} PDF{outputs.length === 1 ? "" : "s"})
              </span>
            </div>
            <div className="grid gap-2">
              {outputs.map((out, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="shrink-0 text-cyan-600 dark:text-cyan-400" />
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {out.name}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-slate-400">
                      ({formatBytes(out.blob.size)})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => downloadBlob(out.blob, out.name)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                    >
                      <Download size={12} />
                      Download
                    </button>
                    {onShareFile && (
                      <button
                        type="button"
                        onClick={() =>
                          onShareFile(new File([out.blob], out.name, { type: "application/pdf" }))
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400"
                        title="Scan QR to download on mobile"
                      >
                        <QrCode size={12} />
                        📱 QR
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Area: Split Modes & Download */}
      <div className="space-y-5 xl:sticky xl:top-0 xl:max-h-[calc(100vh-210px)] xl:overflow-y-auto pr-1">
        <div className="panel space-y-5">
          {info && (
            <MetricCard
              label="Document Pages"
              value={`${info.pages} Pages`}
              subtext={`Selected: ${selected.length} pages`}
            />
          )}

          <Select
            label="Split Mode"
            value={mode}
            onChange={(v) => setMode(v as any)}
            options={[
              { label: "Custom Range (e.g. 1-3, 5)", value: "ranges" },
              { label: "Interactive Selected Pages", value: "selected" },
              { label: "Every Page (Individual PDFs)", value: "every" }
            ]}
          />

          {mode === "ranges" && (
            <TextField
              label="Page Range Specification"
              value={ranges}
              onChange={setRanges}
              placeholder="e.g. 1-3, 5, 8-10"
              helper="Comma-separated pages and ranges"
            />
          )}

          <button
            className="btn-primary w-full"
            disabled={busy || !info}
            onClick={runSplit}
          >
            <Scissors size={16} />
            {busy ? "Splitting PDF..." : "Split Document"}
          </button>

          {outputs.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() =>
                  outputs.length === 1
                    ? downloadBlob(outputs[0].blob, outputs[0].name)
                    : zipAndDownload(outputs, "imagepro-split-pages.zip")
                }
              >
                <Download size={16} />
                Download {outputs.length > 1 ? `ZIP (${outputs.length} PDFs)` : "Split PDF"}
              </button>
              {onShareFile && (
                <button
                  type="button"
                  onClick={handleShareBatch}
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
  );
}
