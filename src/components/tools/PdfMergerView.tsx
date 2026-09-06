import { useState } from "react";
import { ArrowDown, ArrowLeftRight, ArrowUp, Combine, Download, FileStack, QrCode, Trash2 } from "lucide-react";
import UploadZone from "../UploadZone";
import { MetricCard } from "../ui/Controls";
import { PdfFileInfo, downloadBlob, mergePdfs, readPdfInfo } from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

export default function PdfMergerView({
  notify,
  onSwitchViceVersa,
  onShareFile
}: {
  notify: ToastNotify;
  onSwitchViceVersa?: () => void;
  onShareFile?: (file: File) => void;
}) {
  const [files, setFiles] = useState<PdfFileInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [mergedFile, setMergedFile] = useState<File | null>(null);

  const add = async (next: File[]) => {
    try {
      const infos = await Promise.all(next.map((file) => readPdfInfo(file, 1)));
      setFiles((curr) => [...curr, ...infos]);
      notify(`Added ${infos.length} PDF document(s).`, "info");
    } catch {
      notify("Failed to read one or more PDFs.", "error");
    }
  };

  const move = (from: number, to: number) => {
    setFiles((curr) => {
      const copy = [...curr];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const removeFile = (id: string) => {
    setFiles((curr) => curr.filter((f) => f.id !== id));
  };

  const runMerge = async () => {
    if (files.length < 2) return notify("Upload at least two PDFs to merge.", "error");
    setBusy(true);
    try {
      const blob = await mergePdfs(files);
      const generatedFile = new File([blob], "imagepro-merged-document.pdf", { type: "application/pdf" });
      setMergedFile(generatedFile);
      downloadBlob(blob, "imagepro-merged-document.pdf");
      notify("All PDFs merged and downloaded successfully!", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not merge PDFs.", "error");
    } finally {
      setBusy(false);
    }
  };

  const totalPages = files.reduce((sum, f) => sum + f.pages, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start min-h-0">
      {/* Left Area: Upload & Reorder List */}
      <div className="space-y-6 xl:max-h-[calc(100vh-210px)] xl:overflow-y-auto pr-1">
        {onSwitchViceVersa && (
          <div className="flex items-center justify-between rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3.5 text-xs dark:bg-purple-950/20">
            <span className="font-medium text-slate-700 dark:text-purple-200">
              Need the reverse? Split a single PDF into separate pages?
            </span>
            <button
              type="button"
              onClick={onSwitchViceVersa}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-white px-3 py-1.5 font-bold text-purple-700 shadow-sm transition hover:bg-purple-50 dark:bg-slate-900 dark:text-purple-300"
            >
              <ArrowLeftRight size={13} />
              Switch to PDF Splitter
            </button>
          </div>
        )}

        <div className="panel">
          <UploadZone
            accept="application/pdf"
            multiple
            files={files.map((f) => f.file)}
            formats="PDF"
            onFiles={add}
            onRemove={(index) => setFiles((curr) => curr.filter((_, i) => i !== index))}
            onClear={() => setFiles([])}
            label="Upload multiple PDFs to merge"
            helperText="Drag & drop two or more PDF files in any order"
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Document Merge Order ({files.length} documents)
              </span>
              <span className="text-[11px] text-slate-400">
                Top document comes first
              </span>
            </div>

            <div className="grid gap-2.5">
              {files.map((pdf, index) => (
                <div
                  key={pdf.id}
                  className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-xs font-bold text-purple-600 dark:text-purple-400">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                      {pdf.file.name}
                    </p>
                    <p className="font-mono text-[11px] text-slate-400">
                      {pdf.pages} page{pdf.pages === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      className="btn-secondary h-8 w-8 p-0"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                      title="Move higher"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="btn-secondary h-8 w-8 p-0"
                      disabled={index === files.length - 1}
                      onClick={() => move(index, index + 1)}
                      title="Move lower"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      className="btn-ghost h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      onClick={() => removeFile(pdf.id)}
                      title="Remove PDF"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Area: Summary & Merge Action */}
      <div className="space-y-5 xl:sticky xl:top-0 xl:max-h-[calc(100vh-210px)] xl:overflow-y-auto pr-1">
        <div className="panel space-y-5">
          <MetricCard
            label="Combined Page Count"
            value={`${totalPages} Pages`}
            subtext={`${files.length} documents will be combined sequentially`}
            icon={FileStack}
          />

          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3.5 text-xs text-purple-900 dark:text-purple-200">
            <p className="font-semibold mb-1">Instant Client-Side Merge</p>
            <p className="text-slate-500 dark:text-purple-300/80">
              Documents are processed directly in your browser using WebAssembly. No files are uploaded to any server.
            </p>
          </div>

          <button
            className="btn-primary w-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-600/20 hover:from-purple-500 hover:to-pink-500"
            disabled={busy || files.length < 2}
            onClick={runMerge}
          >
            <Combine size={16} />
            {busy ? "Merging PDFs..." : `Merge ${files.length} Documents`}
          </button>

          {mergedFile && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => downloadBlob(mergedFile, mergedFile.name)}
                className="btn-secondary w-full py-2.5 text-xs font-bold"
              >
                <Download size={14} />
                Download Merged PDF Again
              </button>
              {onShareFile && (
                <button
                  type="button"
                  onClick={() => onShareFile(mergedFile)}
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
