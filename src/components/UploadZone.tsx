import { Clipboard, FileUp, Sparkles, Trash2, UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatBytes } from "../lib/files";

type UploadZoneProps = {
  accept: string;
  multiple?: boolean;
  maxSize?: string;
  formats: string;
  files: File[];
  onFiles: (files: File[]) => void;
  onRemove?: (index: number) => void;
  onClear?: () => void;
  label?: string;
  helperText?: string;
};

export default function UploadZone({
  accept,
  multiple = false,
  maxSize = "50 MB",
  formats,
  files,
  onFiles,
  onRemove,
  onClear,
  label = "Drop your files here",
  helperText = "Drag & drop, click to browse, or paste with Cmd+V"
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pasteNotice, setPasteNotice] = useState(false);

  // Support pasting directly from clipboard (e.g. screenshots or copied images)
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      const acceptedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            if (accept.includes("image") && file.type.startsWith("image/")) {
              acceptedFiles.push(file);
            } else if (accept.includes("pdf") && file.type.includes("pdf")) {
              acceptedFiles.push(file);
            } else if (accept === "*/*" || !accept) {
              acceptedFiles.push(file);
            }
          }
        }
      }
      if (acceptedFiles.length > 0) {
        onFiles(multiple ? acceptedFiles : [acceptedFiles[0]]);
        setPasteNotice(true);
        setTimeout(() => setPasteNotice(false), 2500);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [accept, multiple, onFiles]);

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const array = Array.from(list);
    onFiles(multiple ? array : [array[0]]);
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-7 text-center transition-all duration-200 ${
          isDragging
            ? "border-cyan-500 bg-cyan-500/10 shadow-glow scale-[1.01]"
            : "border-slate-300/80 bg-slate-50/50 hover:border-cyan-400/80 hover:bg-cyan-50/20 dark:border-slate-700/80 dark:bg-slate-900/40 dark:hover:border-cyan-500/50 dark:hover:bg-cyan-950/20"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3">
          <div className="relative">
            <div
              className={`grid h-16 w-16 place-items-center rounded-2xl transition-transform duration-300 ${
                isDragging
                  ? "scale-110 bg-cyan-500 text-white shadow-glow"
                  : "bg-gradient-to-tr from-cyan-500/10 via-teal-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400"
              }`}
            >
              {isDragging ? <FileUp size={30} className="animate-bounce" /> : <UploadCloud size={30} />}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
              <Sparkles size={12} />
            </span>
          </div>

          <div className="max-w-md space-y-1">
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">{label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
          </div>

          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <UploadCloud size={14} className="text-cyan-500" />
              Browse Files
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/60 bg-slate-100/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <Clipboard size={12} />
              Paste (Ctrl/Cmd+V)
            </span>
          </div>

          <input
            className="sr-only"
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>

        {pasteNotice && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-600 dark:text-cyan-300">
            <Sparkles size={13} />
            Image pasted from clipboard!
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span className="font-medium">
            Supported: <span className="font-mono text-slate-700 dark:text-slate-300">{formats}</span>
          </span>
          <span>Max file size: <span className="font-semibold text-slate-700 dark:text-slate-300">{maxSize}</span></span>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Selected ({files.length} {files.length === 1 ? "file" : "files"})
            </span>
            {onClear && files.length > 1 && (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1 font-medium text-rose-500 transition hover:text-rose-600 dark:text-rose-400"
              >
                <Trash2 size={13} />
                Clear all
              </button>
            )}
          </div>
          <div className="grid max-h-60 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {files.map((file, index) => (
              <FileCard
                key={`${file.name}-${file.lastModified}-${index}`}
                file={file}
                index={index}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FileCard({
  file,
  index,
  onRemove
}: {
  file: File;
  index: number;
  onRemove?: (index: number) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const isPdf = file.type.includes("pdf") || file.name.endsWith(".pdf");

  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm transition hover:border-cyan-400/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-cyan-500/40">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className={`grid h-full w-full place-items-center text-xs font-bold ${
              isPdf
                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                : "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400"
            }`}
          >
            {isPdf ? "PDF" : "IMG"}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200" title={file.name}>
          {file.name}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-slate-400">
          {formatBytes(file.size)}
        </p>
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="rounded-lg p-1.5 text-slate-400 opacity-80 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
          title="Remove file"
          aria-label={`Remove ${file.name}`}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
