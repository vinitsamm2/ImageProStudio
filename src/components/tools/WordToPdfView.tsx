import { useEffect, useState } from "react";
import {
  AlignLeft,
  ArrowLeftRight,
  BookOpen,
  Check,
  Copy,
  Download,
  Eye,
  FileCode,
  FileText,
  FileType,
  Hash,
  Layers,
  QrCode,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Type
} from "lucide-react";
import UploadZone from "../UploadZone";
import {
  WordDocumentInfo,
  WordToPdfOptions,
  convertWordToPdf,
  downloadBlob,
  formatBytes,
  parseWordDocument
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

interface WordToPdfViewProps {
  notify: ToastNotify;
  initialFiles?: File[];
  onSwitchViceVersa?: () => void;
  onShareFile?: (file: File) => void;
}

export default function WordToPdfView({
  notify,
  initialFiles,
  onSwitchViceVersa,
  onShareFile
}: WordToPdfViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [docInfo, setDocInfo] = useState<WordDocumentInfo | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Layout & Styling Options
  const [pageSize, setPageSize] = useState<"A4" | "Letter">("A4");
  const [margin, setMargin] = useState<"normal" | "narrow" | "wide">("normal");
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">("sans");
  const [lineSpacing, setLineSpacing] = useState(1.35);
  const [showPageNumbers, setShowPageNumbers] = useState(true);

  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedResult, setConvertedResult] = useState<{
    blob: Blob;
    fileName: string;
    fileSize: number;
    file: File;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  // Load and parse Word file
  const handleLoadFiles = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;

    setFile(picked);
    setConvertedResult(null);
    setIsParsing(true);

    try {
      const parsed = await parseWordDocument(picked);
      setDocInfo(parsed);
      notify(`Loaded ${picked.name} (${parsed.paragraphCount} paragraphs)`, "info");
    } catch (err) {
      console.error(err);
      notify("Failed to parse Word document. Please ensure it is a valid DOCX or DOC file.", "error");
    } finally {
      setIsParsing(false);
    }
  };

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const wordFile = initialFiles.find((f) => {
        const name = f.name.toLowerCase();
        return (
          name.endsWith(".docx") ||
          name.endsWith(".doc") ||
          name.endsWith(".docm") ||
          name.endsWith(".dotx") ||
          name.endsWith(".dot") ||
          f.type.includes("word") ||
          f.type.includes("document")
        );
      });
      if (wordFile) {
        handleLoadFiles([wordFile]);
      }
    }
  }, [initialFiles]);

  const handleConvert = async () => {
    if (!file || !docInfo) {
      notify("Please upload a Word document first.", "error");
      return;
    }

    setIsConverting(true);
    setProgress(15);

    try {
      const options: WordToPdfOptions = {
        pageSize,
        margin,
        fontFamily,
        lineSpacing,
        showPageNumbers,
        onProgress: (pct) => setProgress(Math.min(95, pct))
      };

      const pdfBlob = await convertWordToPdf(file, options);
      setProgress(100);

      const baseName = file.name.replace(/\.[^.]+$/, "");
      const outputName = `${baseName}.pdf`;
      const pdfFile = new File([pdfBlob], outputName, { type: "application/pdf" });

      setConvertedResult({
        blob: pdfBlob,
        fileName: outputName,
        fileSize: pdfBlob.size,
        file: pdfFile
      });

      notify(`Converted ${outputName} successfully!`, "success");
    } catch (err) {
      console.error("Word to PDF error:", err);
      notify("Failed to generate PDF from Word document.", "error");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedResult) return;
    downloadBlob(convertedResult.blob, convertedResult.fileName);
    notify(`Downloaded ${convertedResult.fileName}`, "success");
  };

  const handleCopyText = async () => {
    if (!docInfo || docInfo.elements.length === 0) return;
    const text = docInfo.elements
      .map((el) => {
        if (el.type === "heading") {
          return `\n${el.rawText.toUpperCase()}\n`;
        } else if (el.type === "list") {
          return `• ${el.rawText}`;
        }
        return el.rawText;
      })
      .join("\n\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    notify("Copied document text to clipboard!", "success");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-sky-500/10 p-4 backdrop-blur-md dark:border-indigo-500/30">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 text-white shadow-sm">
            <FileText size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Word to PDF Converter
              </h2>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                DOCX & DOC to PDF
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Convert Microsoft Word (.docx, .doc, .docm, .dotx, .dot) to high-fidelity vector PDF
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
            100% In-Browser Private
          </span>
          {onSwitchViceVersa && (
            <button
              type="button"
              onClick={onSwitchViceVersa}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700 shadow-sm"
              title="Switch to PDF to Word converter"
            >
              <ArrowLeftRight size={13} className="text-indigo-600 dark:text-indigo-400" />
              Switch to PDF to Word (Vice Versa)
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_390px] xl:items-start min-h-0">
        {/* Left Column: Upload, Settings & Live Content Preview */}
        <div className="space-y-6">
          {/* Upload Zone */}
          <div className="panel">
            <UploadZone
              accept=".docx,.doc,.docm,.dot,.dotx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              files={file ? [file] : []}
              formats="DOCX, DOC, DOCM, DOTX, DOT"
              onFiles={handleLoadFiles}
              onRemove={() => {
                setFile(null);
                setDocInfo(null);
                setConvertedResult(null);
              }}
              label="Upload Word document to convert to PDF"
              helperText="Accepts .docx, .doc, .docm, .dotx, and .dot with headings, lists & layout preserved"
            />
          </div>

          {/* Layout & Typography Controls */}
          <div className="panel space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Settings2 size={16} className="text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                PDF Page & Typography Settings
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Page Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page Dimensions
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["A4", "Letter"] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setPageSize(sz)}
                      className={`rounded-xl border py-2 text-xs font-bold transition ${
                        pageSize === sz
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300 ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Margins */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page Margins
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: "narrow", label: "0.5″" },
                      { id: "normal", label: "1.0″" },
                      { id: "wide", label: "1.25″" }
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMargin(m.id)}
                      className={`rounded-xl border py-2 text-xs font-bold transition ${
                        margin === m.id
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300 ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Typography Font
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: "sans", label: "Sans" },
                      { id: "serif", label: "Serif" },
                      { id: "mono", label: "Mono" }
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontFamily(f.id)}
                      className={`rounded-xl border py-2 text-xs font-bold transition ${
                        fontFamily === f.id
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300 ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Layout Options */}
            <div className="grid gap-3 pt-1 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPageNumbers}
                  onChange={(e) => setShowPageNumbers(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Hash size={13} className="text-indigo-500" />
                    Footer Page Numbers
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Stamps &quot;Page X of Y&quot; at the bottom of each page
                  </p>
                </div>
              </label>

              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <AlignLeft size={13} className="text-indigo-500" />
                    Line Spacing
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lineSpacing === 1.15 ? "Compact (1.15x)" : lineSpacing === 1.35 ? "Standard (1.35x)" : "Spacious (1.6x)"}
                  </p>
                </div>
                <div className="flex gap-1">
                  {[1.15, 1.35, 1.6].map((ls) => (
                    <button
                      key={ls}
                      type="button"
                      onClick={() => setLineSpacing(ls)}
                      className={`rounded-lg px-2 py-1 text-xs font-bold transition ${
                        lineSpacing === ls
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {ls}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Document Structure Preview */}
          {docInfo && (
            <div className="panel space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-indigo-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Extracted Document Content
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Document Text</span>
                    </>
                  )}
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center dark:border-slate-800/60 dark:bg-slate-800/40">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Paragraphs</p>
                  <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                    {docInfo.paragraphCount}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center dark:border-slate-800/60 dark:bg-slate-800/40">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Headings</p>
                  <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                    {docInfo.headingCount}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center dark:border-slate-800/60 dark:bg-slate-800/40">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Words</p>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {docInfo.wordCount.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center dark:border-slate-800/60 dark:bg-slate-800/40">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Characters</p>
                  <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                    {docInfo.charCount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Scrollable Document Reader */}
              <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-4 font-sans text-xs dark:border-slate-800 dark:bg-slate-950/80 space-y-3">
                {docInfo.elements.map((el, idx) => {
                  if (el.type === "page-break") {
                    return (
                      <div
                        key={idx}
                        className="my-3 flex items-center gap-2 border-y border-dashed border-indigo-200 py-1.5 text-center text-[10px] font-bold uppercase text-indigo-500 dark:border-indigo-900/60"
                      >
                        <div className="h-px flex-1 bg-indigo-200 dark:bg-indigo-900/60" />
                        <span>Page Break</span>
                        <div className="h-px flex-1 bg-indigo-200 dark:bg-indigo-900/60" />
                      </div>
                    );
                  }

                  if (el.type === "heading") {
                    const HeadingTag =
                      el.headingLevel === 1 ? "h3" : el.headingLevel === 2 ? "h4" : "h5";
                    return (
                      <div key={idx} className="flex items-start gap-2 pt-1">
                        <span className="mt-0.5 rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 uppercase">
                          H{el.headingLevel || 1}
                        </span>
                        <HeadingTag
                          className={`font-bold text-slate-950 dark:text-white ${
                            el.headingLevel === 1 ? "text-sm text-indigo-950 dark:text-indigo-200" : "text-xs"
                          }`}
                        >
                          {el.rawText}
                        </HeadingTag>
                      </div>
                    );
                  }

                  if (el.type === "list") {
                    return (
                      <div key={idx} className="flex items-start gap-2 pl-2">
                        <span className="text-indigo-500 font-bold">•</span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {el.rawText.replace(/^([•\-*]|\d+\.)\s+/, "")}
                        </p>
                      </div>
                    );
                  }

                  if (el.type === "image") {
                    return (
                      <div key={idx} className="my-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-center text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                        <span>[Embedded Document Image]</span>
                      </div>
                    );
                  }

                  return (
                    <p
                      key={idx}
                      className="leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line"
                    >
                      {el.rawText}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Action Summary & Download */}
        <div className="space-y-4 xl:sticky xl:top-20">
          <div className="panel space-y-4 border-indigo-500/20 bg-gradient-to-b from-white to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Conversion Target
              </span>
              <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                .PDF
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Vector PDF Document
              </h4>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Clean, searchable, high-resolution vector PDF generated entirely inside your browser.
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Page Size:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{pageSize}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Margins:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
                  {margin}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Font:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
                  {fontFamily === "sans" ? "Helvetica (Sans)" : fontFamily === "serif" ? "Times (Serif)" : "Courier (Mono)"}
                </span>
              </div>
              {file && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Source File:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatBytes(file.size)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {!convertedResult ? (
                <button
                  type="button"
                  disabled={!file || !docInfo || isConverting}
                  onClick={handleConvert}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-md transition-all ${
                    !file || !docInfo || isConverting
                      ? "cursor-not-allowed bg-slate-300 opacity-60 dark:bg-slate-800"
                      : "bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-lg active:scale-[0.99]"
                  }`}
                >
                  {isConverting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Generating PDF Document...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Convert to PDF</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg active:scale-[0.99]"
                  >
                    <Download size={15} />
                    <span>Download {convertedResult.fileName}</span>
                  </button>

                  <div className="flex gap-2">
                    {onShareFile && (
                      <button
                        type="button"
                        onClick={() => onShareFile(convertedResult.file)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300/80 bg-white py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <QrCode size={14} />
                        <span>QR Code</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setConvertedResult(null)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300/80 bg-white py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <RefreshCw size={13} />
                      <span>Convert Again</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isConverting && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>Typesetting pages with pdf-lib...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Converted Success Details */}
            {convertedResult && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3 text-xs text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Ready for Download</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  {convertedResult.fileName} • {formatBytes(convertedResult.fileSize)}
                </p>
              </div>
            )}
          </div>

          {/* Quick Guide Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-2.5">
            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileCode size={14} className="text-indigo-500" />
              <span>Features & Fidelity</span>
            </p>
            <div className="space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
              <p>
                <strong className="text-slate-700 dark:text-slate-300">Vector Text:</strong> Embedded standard fonts ensure text remains crystal clear at any zoom level.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">Headings & Lists:</strong> Automatically renders Title, Heading 1, 2, 3 and bullet point lists with appropriate hierarchy.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">Pagination:</strong> Automatically splits flowing text across pages with optional &quot;Page X of Y&quot; footers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
