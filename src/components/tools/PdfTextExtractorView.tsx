import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  BookOpen,
  Check,
  Clock,
  Copy,
  Download,
  FileCode,
  FileDown,
  FileText,
  Hash,
  Layers,
  QrCode,
  RefreshCw,
  Search,
  Type,
  X
} from "lucide-react";
import UploadZone from "../UploadZone";
import {
  downloadBlob,
  formatBytes,
  readPdfInfo,
  PdfFileInfo
} from "../../lib/files";
import { getDocument } from "pdfjs-dist";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

type ExtractedPage = {
  pageNumber: number;
  text: string;
  words: number;
  chars: number;
};

export default function PdfTextExtractorView({
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
  const [file, setFile] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfFileInfo | null>(null);
  const [pages, setPages] = useState<ExtractedPage[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(-1); // -1 for all pages
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const extractText = async (picked: File) => {
    setFile(picked);
    setBusy(true);
    setPages([]);
    setSearchQuery("");
    setSelectedPageIndex(-1);

    try {
      const info = await readPdfInfo(picked, 1);
      setPdfInfo(info);

      const arrayBuffer = await picked.arrayBuffer();
      const loadingTask = getDocument({ data: new Uint8Array(arrayBuffer) });
      const doc = await loadingTask.promise;

      const extracted: ExtractedPage[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        
        // Combine text items preserving layout line breaks
        let pageStr = "";
        let lastY: number | null = null;

        for (const item of textContent.items as any[]) {
          if (!("str" in item)) continue;
          const currentY = item.transform ? item.transform[5] : null;
          
          if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
            pageStr += "\n";
          } else if (pageStr.length > 0 && !pageStr.endsWith(" ") && !pageStr.endsWith("\n")) {
            pageStr += " ";
          }
          pageStr += item.str;
          lastY = currentY;
        }

        const trimmed = pageStr.trim();
        const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
        const chars = trimmed.length;

        extracted.push({
          pageNumber: i,
          text: trimmed,
          words,
          chars
        });
      }

      setPages(extracted);
      notify(`Successfully extracted text from ${extracted.length} page(s)!`, "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to extract text from PDF.", "error");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      extractText(initialFiles[0]);
    }
  }, [initialFiles]);

  const totalWords = pages.reduce((acc, p) => acc + p.words, 0);
  const totalChars = pages.reduce((acc, p) => acc + p.chars, 0);
  const readingTimeMinutes = Math.max(1, Math.round(totalWords / 200));

  const getActiveText = () => {
    if (selectedPageIndex === -1) {
      return pages.map((p) => `--- Page ${p.pageNumber} ---\n\n${p.text}`).join("\n\n");
    }
    return pages[selectedPageIndex]?.text || "";
  };

  const getMarkdownText = () => {
    return `# Document Text: ${file?.name || "Extracted Text"}\n\n` +
      `**Total Pages**: ${pages.length} | **Total Words**: ${totalWords} | **Reading Time**: ~${readingTimeMinutes} min\n\n---\n\n` +
      pages.map((p) => `## Page ${p.pageNumber}\n\n${p.text}`).join("\n\n");
  };

  const handleCopy = async () => {
    const textToCopy = getActiveText();
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      notify("Text copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify("Failed to copy to clipboard.", "error");
    }
  };

  const handleDownloadTxt = () => {
    const text = getActiveText();
    if (!text || !file) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const name = `${file.name.replace(/\.pdf$/i, "")}-text.txt`;
    downloadBlob(blob, name);
    notify("Downloaded plain text (.txt)", "success");
  };

  const handleDownloadMd = () => {
    const text = getMarkdownText();
    if (!text || !file) return;
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const name = `${file.name.replace(/\.pdf$/i, "")}-text.md`;
    downloadBlob(blob, name);
    notify("Downloaded Markdown (.md)", "success");
  };

  const displayedText = getActiveText();

  return (
    <div className="space-y-4">
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <span className="font-medium text-slate-700 dark:text-indigo-200">
            Need to convert your PDF into a formatted Word (.docx) document instead?
          </span>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="btn-secondary h-8 gap-1.5 px-3 text-xs font-bold cursor-pointer"
          >
            <ArrowLeftRight size={13} />
            <span>Switch to PDF to Word</span>
          </button>
        </div>
      )}

      {!file ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
                <FileText size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">PDF Text Extractor</h2>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    Word Count & Markdown
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Extract readable text, calculate word counts, search content, and export as clean TXT or Markdown.
                </p>
              </div>
            </div>
          </div>

          <UploadZone
            accept="application/pdf"
            formats="PDF"
            files={[]}
            onFiles={(files: File[]) => files[0] && extractText(files[0])}
            multiple={false}
            label="Drag & Drop PDF to Extract Text"
            helperText="Fast vector text extraction with reading analytics"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <FileText size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-xs">
                    {file.name}
                  </h3>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {formatBytes(file.size)}
                  </span>
                  <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {pages.length} Page(s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Text extracted & indexed</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPages([]);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:border-white/[0.1] dark:bg-slate-800 dark:text-slate-300 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Change File</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 dark:border-white/[0.08] dark:bg-slate-900/60 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Type size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400">Total Words</span>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  {totalWords.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 dark:border-white/[0.08] dark:bg-slate-900/60 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Hash size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400">Characters</span>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  {totalChars.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 dark:border-white/[0.08] dark:bg-slate-900/60 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400">Read Time</span>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  ~{readingTimeMinutes} min
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 dark:border-white/[0.08] dark:bg-slate-900/60 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Layers size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400">Total Pages</span>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  {pages.length}
                </div>
              </div>
            </div>
          </div>

          {/* Main Workstation: Toolbar + Text Area */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/[0.06]">
              {/* Page Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setSelectedPageIndex(-1)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    selectedPageIndex === -1
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  All Pages ({pages.length})
                </button>
                {pages.slice(0, 12).map((p, idx) => (
                  <button
                    key={p.pageNumber}
                    type="button"
                    onClick={() => setSelectedPageIndex(idx)}
                    className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      selectedPageIndex === idx
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    P.{p.pageNumber}
                  </button>
                ))}
              </div>

              {/* Action Buttons: Copy, Download TXT, Download MD */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <FileDown size={14} />
                  <span>Download .TXT</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMd}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
                >
                  <FileCode size={14} />
                  <span>Download .MD</span>
                </button>
              </div>
            </div>

            {/* In-Text Search Filter */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search words within extracted document..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-white/[0.08] dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            {/* Extracted Text Content Box */}
            <div className="relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 font-mono text-xs text-slate-800 leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap dark:border-white/[0.08] dark:bg-slate-950/40 dark:text-slate-200">
              {displayedText ? (
                displayedText
              ) : (
                <span className="text-slate-400 italic">No text found on this page.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
