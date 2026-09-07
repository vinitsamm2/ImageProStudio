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
  FileType,
  QrCode,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Type
} from "lucide-react";
import UploadZone from "../UploadZone";
import {
  ExtractedPdfPage,
  PdfFileInfo,
  PdfToWordOptions,
  WORD_FORMATS,
  WordFormatKey,
  convertPdfToWord,
  downloadBlob,
  extractPdfStructuredText,
  formatBytes,
  readPdfInfo
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

interface PdfToWordViewProps {
  notify: ToastNotify;
  initialFiles?: File[];
  onSwitchViceVersa?: () => void;
  onShareFile?: (file: File) => void;
}

export default function PdfToWordView({
  notify,
  initialFiles,
  onSwitchViceVersa,
  onShareFile
}: PdfToWordViewProps) {
  const [pdfInfo, setPdfInfo] = useState<PdfFileInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<WordFormatKey>("docx");
  const [detectHeadings, setDetectHeadings] = useState(true);
  const [preserveLineBreaks, setPreserveLineBreaks] = useState(false);
  const [pageRange, setPageRange] = useState("");

  // Extracted preview state
  const [extractedPages, setExtractedPages] = useState<ExtractedPdfPage[]>([]);
  const [isExtractingPreview, setIsExtractingPreview] = useState(false);
  const [activePreviewPage, setActivePreviewPage] = useState(1);
  const [copied, setCopied] = useState(false);

  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [convertedResult, setConvertedResult] = useState<{
    blob: Blob;
    fileName: string;
    fileSize: number;
    file: File;
  } | null>(null);

  // Load PDF file
  const handleLoadFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    try {
      const info = await readPdfInfo(file, 6);
      setPdfInfo(info);
      setConvertedResult(null);
      notify(`Loaded PDF with ${info.pages} page(s).`, "info");
      loadTextPreview(file);
    } catch (err) {
      console.error(err);
      notify("Failed to read PDF document. Please check the file.", "error");
    }
  };

  // Load preview data
  const loadTextPreview = async (file: File, optionsOverride?: Partial<PdfToWordOptions>) => {
    setIsExtractingPreview(true);
    try {
      const opts: PdfToWordOptions = {
        detectHeadings,
        preserveLineBreaks,
        pageRanges: pageRange,
        ...optionsOverride
      };
      const pages = await extractPdfStructuredText(file, opts);
      setExtractedPages(pages);
      setActivePreviewPage(1);
    } catch (err) {
      console.error("Preview extraction error:", err);
    } finally {
      setIsExtractingPreview(false);
    }
  };

  // React to initialFiles if passed
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const pdf = initialFiles.find(
        (f) => f.type.includes("pdf") || f.name.toLowerCase().endsWith(".pdf")
      );
      if (pdf) {
        handleLoadFiles([pdf]);
      }
    }
  }, [initialFiles]);

  // Re-run preview extraction when layout settings change
  useEffect(() => {
    if (pdfInfo) {
      loadTextPreview(pdfInfo.file);
    }
  }, [detectHeadings, preserveLineBreaks, pageRange]);

  // Execute conversion
  const handleConvert = async () => {
    if (!pdfInfo) {
      notify("Please upload a PDF document first.", "error");
      return;
    }

    setIsConverting(true);
    setConversionProgress(25);

    try {
      setConversionProgress(50);
      const options: PdfToWordOptions = {
        detectHeadings,
        preserveLineBreaks,
        pageRanges: pageRange
      };

      const blob = await convertPdfToWord(pdfInfo.file, selectedFormat, options);
      setConversionProgress(90);

      const baseName = pdfInfo.file.name.replace(/\.[^.]+$/, "");
      const outputName = `${baseName}.${selectedFormat}`;
      const convertedFile = new File([blob], outputName, { type: blob.type });

      setConvertedResult({
        blob,
        fileName: outputName,
        fileSize: blob.size,
        file: convertedFile
      });

      setConversionProgress(100);
      notify(`Successfully converted to .${selectedFormat.toUpperCase()}!`, "success");
    } catch (err) {
      console.error("Conversion error:", err);
      notify("Failed to convert PDF. Please verify the document structure.", "error");
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
    if (extractedPages.length === 0) return;
    const fullText = extractedPages
      .map((p) => `--- PAGE ${p.pageNumber} ---\n\n${p.rawText}`)
      .join("\n\n");
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    notify("Copied extracted text to clipboard!", "success");
  };

  const currentFormatDef = WORD_FORMATS.find((f) => f.key === selectedFormat) || WORD_FORMATS[0];

  // Calculate totals
  const totalWords = extractedPages.reduce((acc, p) => acc + p.wordCount, 0);
  const totalChars = extractedPages.reduce((acc, p) => acc + p.charCount, 0);
  const totalParas = extractedPages.reduce((acc, p) => acc + p.paragraphs.length, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-sky-500/10 p-4 backdrop-blur-md dark:border-blue-500/30">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white shadow-sm">
            <FileType size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                PDF to Word / Office Converter
              </h2>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                6 Formats Supported
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Convert PDF to DOC, DOCX, DOCM, DOT, DOTX & DOTM with formatting & headings preserved
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
              className="flex items-center gap-1.5 rounded-xl border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ArrowLeftRight size={13} />
              Switch to PDF Editor
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_390px] xl:items-start min-h-0">
        {/* Left Column: Upload, Format Selection & Live Preview */}
        <div className="space-y-6">
          {/* Upload Box */}
          <div className="panel">
            <UploadZone
              accept="application/pdf"
              files={pdfInfo ? [pdfInfo.file] : []}
              formats="PDF"
              onFiles={handleLoadFiles}
              onRemove={() => {
                setPdfInfo(null);
                setExtractedPages([]);
                setConvertedResult(null);
              }}
              label="Upload PDF to convert to Word"
              helperText="Extracts text, headings, lists, and pages into native Microsoft Word formats"
            />
          </div>

          {/* 6 Word Format Selection Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileType size={14} className="text-blue-500" />
                <span>Choose Target Word Format</span>
              </span>
              <span className="font-mono text-xs text-slate-400">
                Active: <span className="font-bold text-blue-600 dark:text-blue-400">.{selectedFormat.toUpperCase()}</span>
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {WORD_FORMATS.map((fmt) => {
                const isSelected = selectedFormat === fmt.key;
                return (
                  <button
                    key={fmt.key}
                    type="button"
                    onClick={() => {
                      setSelectedFormat(fmt.key);
                      setConvertedResult(null);
                    }}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/40 dark:ring-blue-500/30"
                        : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-lg px-2 py-1 font-mono text-xs font-extrabold uppercase transition-colors ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-700 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                            }`}
                          >
                            .{fmt.ext}
                          </span>
                          {fmt.badge && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                fmt.isMacro
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                  : fmt.isTemplate
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                              }`}
                            >
                              {fmt.badge}
                            </span>
                          )}
                        </div>
                        <div
                          className={`grid h-5 w-5 place-items-center rounded-full border transition-all ${
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 text-transparent group-hover:border-slate-400 dark:border-slate-700"
                          }`}
                        >
                          <Check size={11} strokeWidth={3} />
                        </div>
                      </div>

                      <p className="mt-2.5 text-xs font-bold text-slate-900 dark:text-white">
                        {fmt.name}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {fmt.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[10px] text-slate-400 dark:border-slate-800/80">
                      <span>MIME:</span>
                      <span className="truncate font-mono">{fmt.mime.split("/")[1]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formatting & Layout Options */}
          <div className="panel space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Settings2 size={16} className="text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Document Structure & Extraction Settings
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Heading Detection Toggle */}
              <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={detectHeadings}
                  onChange={(e) => setDetectHeadings(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Type size={13} className="text-blue-500" />
                    Detect Headings Automatically
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Maps prominent font sizes to Word Heading 1, 2, and 3 styles.
                  </p>
                </div>
              </label>

              {/* Line Breaks vs Flowing Paragraphs */}
              <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveLineBreaks}
                  onChange={(e) => setPreserveLineBreaks(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <AlignLeft size={13} className="text-blue-500" />
                    Preserve Exact Line Breaks
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Keep hard line returns instead of merging text into flowing paragraphs.
                  </p>
                </div>
              </label>
            </div>

            {/* Page Range Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Page Selection (Optional)</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Leave empty to convert all pages
                </span>
              </label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g. 1-3, 5, 8"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Live Extracted Content Preview Drawer */}
          {pdfInfo && (
            <div className="panel space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-blue-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Live Extracted Content Preview
                  </h3>
                </div>

                <div className="flex items-center gap-2">
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
                        <span>Copy All Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center dark:border-slate-800/60 dark:bg-slate-800/40">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Pages</p>
                  <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                    {extractedPages.length || pdfInfo.pages}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center dark:border-slate-800/60 dark:bg-slate-800/40">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Paragraphs</p>
                  <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                    {totalParas}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center dark:border-slate-800/60 dark:bg-slate-800/40">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Words</p>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {totalWords.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center dark:border-slate-800/60 dark:bg-slate-800/40">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Characters</p>
                  <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                    {totalChars.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Page Selector Tabs */}
              {extractedPages.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {extractedPages.map((p) => (
                    <button
                      key={p.pageNumber}
                      type="button"
                      onClick={() => setActivePreviewPage(p.pageNumber)}
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        activePreviewPage === p.pageNumber
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      Page {p.pageNumber}
                    </button>
                  ))}
                </div>
              )}

              {/* Page Content View */}
              {isExtractingPreview ? (
                <div className="flex h-48 items-center justify-center gap-2 text-xs text-slate-400">
                  <RefreshCw size={16} className="animate-spin text-blue-500" />
                  <span>Parsing document structure...</span>
                </div>
              ) : (
                (() => {
                  const currPage =
                    extractedPages.find((p) => p.pageNumber === activePreviewPage) ||
                    extractedPages[0];

                  if (!currPage || currPage.paragraphs.length === 0) {
                    return (
                      <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
                        <BookOpen size={24} className="mb-1 text-slate-300 dark:text-slate-600" />
                        <span>No text detected on this page (it may be a scanned image or empty).</span>
                      </div>
                    );
                  }

                  return (
                    <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-4 font-sans text-xs dark:border-slate-800 dark:bg-slate-950/80 space-y-3">
                      {currPage.paragraphs.map((para, idx) => {
                        if (para.isHeading) {
                          const HeadingTag =
                            para.headingLevel === 1 ? "h3" : para.headingLevel === 2 ? "h4" : "h5";
                          return (
                            <div key={idx} className="flex items-start gap-2 pt-1">
                              <span className="mt-0.5 rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 uppercase">
                                H{para.headingLevel || 1}
                              </span>
                              <HeadingTag
                                className={`font-bold text-blue-950 dark:text-blue-200 ${
                                  para.headingLevel === 1
                                    ? "text-sm"
                                    : "text-xs"
                                }`}
                              >
                                {para.text}
                              </HeadingTag>
                            </div>
                          );
                        }

                        if (para.isListItem) {
                          return (
                            <div key={idx} className="flex items-start gap-2 pl-2">
                              <span className="text-blue-500">•</span>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                {para.text.replace(/^([•\-*]|\d+\.)\s+/, "")}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <p
                            key={idx}
                            className="leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line"
                          >
                            {para.text}
                          </p>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>

        {/* Right Column: Target Summary, Conversion Button, Progress & Download */}
        <div className="space-y-4 xl:sticky xl:top-20">
          {/* Format Summary Card */}
          <div className="panel space-y-4 border-blue-500/20 bg-gradient-to-b from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Conversion Target
              </span>
              <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                .{currentFormatDef.ext.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {currentFormatDef.name}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {currentFormatDef.description}
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>File Format:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Microsoft Word (.{currentFormatDef.ext})
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Architecture:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedFormat === "doc" || selectedFormat === "dot"
                    ? "Word 97–2003 XML/HTML"
                    : "Office Open XML (OOXML)"}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Privacy / Server:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  0 bytes uploaded (100% local)
                </span>
              </div>
              {pdfInfo && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Source Size:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatBytes(pdfInfo.file.size)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {!convertedResult ? (
                <button
                  type="button"
                  disabled={!pdfInfo || isConverting}
                  onClick={handleConvert}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-md transition-all ${
                    !pdfInfo || isConverting
                      ? "cursor-not-allowed bg-slate-300 opacity-60 dark:bg-slate-800"
                      : "bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-[0.99]"
                  }`}
                >
                  {isConverting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Converting Document...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Convert to .{selectedFormat.toUpperCase()}</span>
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

              {/* Progress Bar when converting */}
              {isConverting && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>Synthesizing Word structure...</span>
                    <span>{conversionProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                      style={{ width: `${conversionProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Conversion Success Notification Details */}
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

          {/* Format Comparison Quick Reference */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-2.5">
            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileCode size={14} className="text-blue-500" />
              <span>Format Guide</span>
            </p>
            <div className="space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
              <p>
                <strong className="text-slate-700 dark:text-slate-300">.docx</strong> — Recommended for all modern Microsoft Word versions, Google Docs, Apple Pages.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">.doc</strong> — Use if opening in legacy Microsoft Word 97–2003 or enterprise internal systems.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">.docm / .dotm</strong> — Macro-ready container with the appropriate MIME types for automated workflows.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">.dot / .dotx</strong> — Generates an office template so double-clicking spawns a fresh document copy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
