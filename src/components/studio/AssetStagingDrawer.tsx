import {
  ChevronDown,
  ChevronUp,
  FileImage,
  FileText,
  FileUp,
  Plus,
  Send,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatBytes } from "../../lib/files";
import { ToolId } from "../ToolGrid";
import { STUDIO_TOOLS } from "./ToolActivityRail";

type AssetStagingDrawerProps = {
  stagedFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onClearFiles: () => void;
  onSendToTool: (toolId: ToolId, files: File[]) => void;
  activeTool: ToolId;
};

export default function AssetStagingDrawer({
  stagedFiles,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  onSendToTool,
  activeTool
}: AssetStagingDrawerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const activeToolDef = STUDIO_TOOLS.find((t) => t.id === activeTool) || STUDIO_TOOLS[0];

  // Auto-open drawer if files are added for the first time
  useEffect(() => {
    if (stagedFiles.length > 0 && !isOpen) {
      setIsOpen(true);
    }
  }, [stagedFiles.length]);

  return (
    <div className="relative z-20 border-t border-slate-200/80 bg-white/95 backdrop-blur-2xl transition-all dark:border-white/[0.08] dark:bg-slate-950/90 shadow-lg">
      {/* Drawer Toggle Header Bar */}
      <div className="flex h-9 items-center justify-between px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white"
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">
              Session Asset Deck
            </span>
            <span className="rounded-full bg-cyan-500/15 px-2 py-0.2 font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
              {stagedFiles.length} {stagedFiles.length === 1 ? "file" : "files"}
            </span>
          </button>

          <span className="hidden sm:inline text-[11px] text-slate-400">
            • Files stay in this tray so you can switch tools without re-uploading
          </span>
        </div>

        <div className="flex items-center gap-2">
          {stagedFiles.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => onSendToTool(activeTool, stagedFiles)}
                className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs hover:bg-cyan-500"
                title={`Send all files to ${activeToolDef.name}`}
              >
                <Send size={10} />
                <span>Load All into {activeToolDef.shortName}</span>
              </button>

              <button
                type="button"
                onClick={onClearFiles}
                className="text-[11px] text-rose-500 hover:text-rose-600"
              >
                Clear
              </button>
            </>
          )}

          <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-white dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-300">
            <Plus size={11} />
            <span>Add File</span>
            <input
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) onAddFiles(Array.from(e.target.files));
              }}
            />
          </label>
        </div>
      </div>

      {/* Expanded File Carousel */}
      {isOpen && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files) {
              onAddFiles(Array.from(e.dataTransfer.files));
            }
          }}
          className={`flex items-center gap-3 overflow-x-auto p-3 transition-colors ${
            dragOver
              ? "bg-cyan-500/10 border-cyan-500/40"
              : "bg-slate-50/50 dark:bg-slate-900/40"
          }`}
        >
          {stagedFiles.length === 0 ? (
            <div className="flex w-full items-center justify-center py-2 text-center text-xs text-slate-400">
              <span>
                Drop any images or PDFs here anytime to keep them ready across tools
              </span>
            </div>
          ) : (
            stagedFiles.map((file, idx) => {
              const isPdf = file.type.includes("pdf") || file.name.endsWith(".pdf");
              return (
                <div
                  key={`${file.name}-${idx}`}
                  className="group relative flex shrink-0 items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-2 shadow-xs transition hover:border-cyan-400 dark:border-white/[0.08] dark:bg-slate-900"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {isPdf ? <FileText size={15} className="text-rose-500" /> : <FileImage size={15} className="text-cyan-500" />}
                  </div>

                  <div className="max-w-[140px] text-left">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200" title={file.name}>
                      {file.name}
                    </p>
                    <p className="font-mono text-[10px] text-slate-400">
                      {formatBytes(file.size)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSendToTool(activeTool, [file])}
                      className="rounded-lg bg-slate-100 p-1 text-slate-600 hover:bg-cyan-50 hover:text-cyan-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-400"
                      title={`Send to ${activeToolDef.name}`}
                    >
                      <Send size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveFile(idx)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                      title="Remove file"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
