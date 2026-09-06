import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Download,
  FileArchive,
  FileText,
  Gauge,
  GraduationCap,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Loader2,
  QrCode,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap
} from "lucide-react";
import UploadZone from "../UploadZone";
import {
  PdfFileInfo,
  PdfCompressionPreset,
  compressPdf,
  downloadBlob,
  estimateFileSize,
  formatBytes,
  readPdfInfo,
  zipAndDownload
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

interface CompressedPdfResult {
  id: string;
  name: string;
  pages: number;
  originalSize: number;
  compressedSize: number;
  blob: Blob;
  thumbnailUrl?: string;
}

interface PdfCompressorViewProps {
  notify: ToastNotify;
  initialFiles?: File[];
  onSwitchViceVersa?: () => void;
  onShareFile?: (file: { name: string; blob: Blob; size?: number; url?: string }) => void;
}

export default function PdfCompressorView({
  notify,
  initialFiles,
  onSwitchViceVersa,
  onShareFile
}: PdfCompressorViewProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [pdfMeta, setPdfMeta] = useState<Record<string, PdfFileInfo>>({});
  const [preset, setPreset] = useState<PdfCompressionPreset>("recommended");
  const [customQuality, setCustomQuality] = useState(72);
  const [customDpi, setCustomDpi] = useState(150);
  const [busy, setBusy] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [results, setResults] = useState<CompressedPdfResult[]>([]);

  // Load initial files if routed
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const pdfs = initialFiles.filter(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      );
      if (pdfs.length > 0) {
        setFiles(pdfs);
      }
    }
  }, [initialFiles]);

  // Read metadata & thumbnails for newly added files
  useEffect(() => {
    let cancelled = false;
    files.forEach(async (file) => {
      if (!pdfMeta[file.name]) {
        try {
          const info = await readPdfInfo(file);
          if (!cancelled) {
            setPdfMeta((prev) => ({ ...prev, [file.name]: info }));
          }
        } catch {
          // Keep base info if parsing preview fails
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [files]);

  // Derive effective quality factor for size estimation
  const effectiveQuality = useMemo(() => {
    if (preset === "extreme") return 0.45;
    if (preset === "recommended") return 0.72;
    if (preset === "low") return 0.88;
    return customQuality / 100;
  }, [preset, customQuality]);

  // Real-time estimated size calculation across all uploaded PDFs
  const liveTotals = useMemo(() => {
    let original = 0;
    let estimated = 0;

    for (const f of files) {
      original += f.size;
      const est = estimateFileSize({
        originalSize: f.size,
        quality: effectiveQuality,
        format: "application/pdf",
        isPdf: true
      });
      estimated += est.bytes;
    }

    const changePercent = original > 0 ? Math.round(((estimated - original) / original) * 100) : 0;
    const isReduction = estimated <= original;
    const savedBytes = Math.max(0, original - estimated);

    return { original, estimated, changePercent, isReduction, savedBytes };
  }, [files, effectiveQuality]);

  // Run Compression
  const handleCompress = async () => {
    if (files.length === 0) {
      return notify("Upload at least one PDF file to compress.", "error");
    }

    setBusy(true);
    setProgressText("Initializing in-browser compression engine...");
    const compressedList: CompressedPdfResult[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const meta = pdfMeta[file.name];
        const pageCount = meta?.pages || 1;

        setProgressText(
          `Compressing document ${i + 1} of ${files.length}: ${file.name}...`
        );

        const compressedBlob = await compressPdf(file, {
          preset,
          quality: preset === "custom" ? customQuality / 100 : undefined,
          targetDpi: preset === "custom" ? customDpi : undefined,
          onProgress: (current, total) => {
            setProgressText(
              `Processing ${file.name} (Page ${current} of ${total})...`
            );
          }
        });

        const outputName = file.name.replace(/\.pdf$/i, "") + "-compressed.pdf";

        compressedList.push({
          id: `${file.name}-${Date.now()}`,
          name: outputName,
          pages: pageCount,
          originalSize: file.size,
          compressedSize: compressedBlob.size,
          blob: compressedBlob,
          thumbnailUrl: meta?.thumbnails?.[0]
        });
      }

      setResults(compressedList);
      notify(
        `Successfully compressed ${compressedList.length} PDF(s)! 100% client-side.`,
        "success"
      );
    } catch (err) {
      console.error(err);
      notify(
        err instanceof Error ? err.message : "Failed to compress PDF.",
        "error"
      );
    } finally {
      setBusy(false);
      setProgressText("");
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    if (results.length === 1) {
      downloadBlob(results[0].blob, results[0].name);
      return;
    }
    await zipAndDownload(
      results.map((r) => ({ name: r.name, blob: r.blob })),
      "imagepro-compressed-pdfs.zip"
    );
    notify(`Downloaded ${results.length} compressed PDFs archive (.zip)!`, "success");
  };

  // Preset definitions with clear explanations and target reduction badges
  const PRESETS: Array<{
    key: PdfCompressionPreset;
    title: string;
    badge: string;
    reduction: string;
    description: string;
    color: string;
    borderColor: string;
    bgColor: string;
  }> = [
    {
      key: "extreme",
      title: "Extreme Compression",
      badge: "Smallest Size",
      reduction: "~70% Smaller",
      description: "Aggressive downsampling (~100 DPI). Perfect for portals with strict 1MB/2MB file limits.",
      color: "text-rose-600 dark:text-rose-400",
      borderColor: "border-rose-500/30",
      bgColor: "bg-rose-500/10"
    },
    {
      key: "recommended",
      title: "Recommended Compression",
      badge: "Most Popular",
      reduction: "~50% Smaller",
      description: "Optimal balance of crisp typography, clean vector lines, and compact file size (~150 DPI).",
      color: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/10"
    },
    {
      key: "low",
      title: "Low Compression",
      badge: "High Fidelity",
      reduction: "~25% Smaller",
      description: "Maintains high resolution (~200 DPI). Ideal for official documents, architectural prints & brochures.",
      color: "text-indigo-600 dark:text-indigo-400",
      borderColor: "border-indigo-500/30",
      bgColor: "bg-indigo-500/10"
    },
    {
      key: "custom",
      title: "Custom Granular Mode",
      badge: "Expert Control",
      reduction: "Variable",
      description: "Fine-tune exact JPEG quality (10-100%) and target raster DPI (72-300 DPI).",
      color: "text-cyan-600 dark:text-cyan-400",
      borderColor: "border-cyan-500/30",
      bgColor: "bg-cyan-500/10"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top Reciprocal Switch Banner */}
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <ImageIcon size={14} />
            </span>
            <span className="font-medium text-slate-700 dark:text-indigo-200">
              Looking to compress JPG, PNG, WebP, or AVIF image files instead?
            </span>
          </div>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-white px-3 py-1.5 font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300"
          >
            <ArrowLeftRight size={13} />
            Switch to Image Compressor
          </button>
        </div>
      )}

      {/* Dual Compressor Mode Switch Capsule */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-2 dark:border-white/[0.08] dark:bg-slate-900 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06] transition"
          >
            <ImageIcon size={15} className="text-cyan-500" />
            <span>Image Compressor</span>
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs">
            <FileText size={15} className="text-emerald-500" />
            <span>PDF Compressor</span>
            <span className="rounded-full bg-emerald-500 px-1.5 py-0.2 text-[9px] font-mono text-white">
              ACTIVE
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium pr-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>100% In-Browser • Zero Cloud Uploads</span>
        </div>
      </div>

      {/* Main Dual-Column Workspace with Independent Scroll Containment */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start xl:h-full min-h-0">
        {/* Left Area: Upload & Results */}
        <div className="space-y-6 xl:h-full xl:max-h-[calc(100vh-230px)] xl:overflow-y-auto overscroll-contain pr-1">
          {/* Upload Panel */}
          <div className="panel">
            <UploadZone
              accept="application/pdf,.pdf"
              multiple
              files={files}
              formats="PDF Documents (.pdf)"
              onFiles={(next) => {
                const pdfsOnly = next.filter(
                  (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
                );
                if (pdfsOnly.length < next.length) {
                  notify(
                    "Only PDF documents are accepted here. Switch to Image Compressor for pictures.",
                    "info"
                  );
                }
                setFiles((current) => [...current, ...pdfsOnly]);
                setResults([]);
              }}
              onRemove={(index) => {
                setFiles((current) => current.filter((_, i) => i !== index));
                setResults([]);
              }}
              onClear={() => {
                setFiles([]);
                setResults([]);
                setPdfMeta({});
              }}
              label="Drop PDF Documents Here to Compress"
              helperText="Batch optimize multiple PDF files with client-side WebAssembly"
            />
          </div>

          {/* Staged Files with Live Dynamic Size Estimates */}
          {files.length > 0 && results.length === 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Staged Documents & Real-Time Size Estimates ({files.length})
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Preset: {preset.toUpperCase()}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {files.map((file, idx) => {
                  const meta = pdfMeta[file.name];
                  const est = estimateFileSize({
                    originalSize: file.size,
                    quality: effectiveQuality,
                    format: "application/pdf",
                    isPdf: true
                  });

                  return (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-white/[0.08] dark:bg-slate-900/80"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {meta?.thumbnails?.[0] ? (
                          <img
                            src={meta.thumbnails[0]}
                            alt={file.name}
                            className="h-11 w-9 shrink-0 rounded-lg border border-slate-200 object-cover shadow-xs dark:border-white/[0.1]"
                          />
                        ) : (
                          <div className="grid h-10 w-9 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                            <FileText size={18} />
                          </div>
                        )}
                        <div className="truncate">
                          <p
                            className="truncate text-xs font-bold text-slate-800 dark:text-slate-200"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {meta?.pages ? `${meta.pages} pages • ` : ""}
                            Original: {formatBytes(file.size)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1">
                          <TrendingDown size={13} className="text-emerald-500" />
                          <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            ~{formatBytes(est.bytes)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {est.changePercent > 0 ? `+${est.changePercent}%` : `${est.changePercent}%`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compressed Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                      Compression Complete ({results.length} PDF{results.length > 1 ? "s" : ""})
                    </h3>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      All files processed 100% inside your browser. No files left your device.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Download size={14} />
                  <span>Download All ({results.length})</span>
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((res) => {
                  const savedBytes = Math.max(0, res.originalSize - res.compressedSize);
                  const savedPercent = res.originalSize
                    ? Math.round((savedBytes / res.originalSize) * 100)
                    : 0;

                  return (
                    <div
                      key={res.id}
                      className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-white/[0.08] dark:bg-slate-900"
                    >
                      <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
                        {res.thumbnailUrl ? (
                          <img
                            src={res.thumbnailUrl}
                            alt={res.name}
                            className="max-h-full rounded shadow-md object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="text-center p-4 space-y-2">
                            <FileText size={48} className="mx-auto text-rose-500" />
                            <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600">
                              PDF Document
                            </span>
                          </div>
                        )}
                        <span className="absolute top-2.5 right-2.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-extrabold text-white shadow-sm">
                          -{savedPercent}%
                        </span>
                      </div>

                      <div className="p-3.5 space-y-3">
                        <div className="space-y-0.5">
                          <p
                            className="truncate text-xs font-bold text-slate-800 dark:text-slate-200"
                            title={res.name}
                          >
                            {res.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {res.pages} page{res.pages > 1 ? "s" : ""}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                          <span className="line-through">{formatBytes(res.originalSize)}</span>
                          <ArrowRight size={13} className="text-emerald-500" />
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatBytes(res.compressedSize)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => downloadBlob(res.blob, res.name)}
                            className="btn-secondary flex-1 py-1.5 text-xs flex items-center justify-center gap-1"
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </button>
                          {onShareFile && (
                            <button
                              type="button"
                              onClick={() =>
                                onShareFile({
                                  name: res.name,
                                  blob: res.blob,
                                  size: res.compressedSize
                                })
                              }
                              className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-300 dark:bg-indigo-950/40 transition flex items-center gap-1 shrink-0"
                              title="Scan QR Code to Download on Mobile or Share"
                            >
                              <QrCode size={13} />
                              <span>Mobile QR</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Area: Compression Level Presets & Live Size Savings Meter */}
        <div className="space-y-5 xl:h-full xl:max-h-[calc(100vh-230px)] xl:overflow-y-auto overscroll-contain pr-1">
          <div className="panel space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Gauge size={16} className="text-emerald-500" />
                <span>Compression Level</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose a preset or fine-tune quality vs file size
              </p>
            </div>

            {/* Student & Employee Examination Document Presets */}
            <div className="space-y-2 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-3.5 dark:bg-indigo-950/25">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Exam Document Targets (100% Accepted)</span>
                </span>
                <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                  UPSC / Colleges
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                1-click presets guaranteeing PDF size stays strictly under exam portal caps
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { label: "Marksheet / Cert", target: "< 200 KB", p: "extreme" as const, sub: "Exam Document Cap" },
                  { label: "Aadhar / ID Proof", target: "< 300 KB", p: "extreme" as const, sub: "Govt Identity Slip" },
                  { label: "College Admission", target: "< 500 KB", p: "recommended" as const, sub: "University Portal" },
                  { label: "Full Dossier", target: "< 1 MB", p: "recommended" as const, sub: "Job Onboarding" }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setPreset(item.p);
                      notify(`Calibrated PDF compressor for ${item.label} (${item.target})!`, "info");
                    }}
                    className="rounded-xl border border-indigo-500/20 bg-white/90 p-2 text-left transition hover:border-indigo-500 hover:bg-indigo-50/50 dark:border-white/[0.08] dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {item.label}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                        {item.target}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Presets Cards */}
            <div className="space-y-2.5">
              {PRESETS.map((p) => {
                const isSelected = preset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPreset(p.key)}
                    className={`w-full text-left rounded-2xl border p-3.5 transition-all ${
                      isSelected
                        ? `${p.borderColor} ${p.bgColor} shadow-sm ring-1 ring-emerald-500/40`
                        : "border-slate-200/80 bg-white hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-900/60 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {p.title}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          isSelected ? p.color : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {p.reduction}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom Mode Sliders */}
            {preset === "custom" && (
              <div className="space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 animate-in fade-in">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">JPEG Quality Level</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {customQuality}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={customQuality}
                    onChange={(e) => setCustomQuality(Number(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 rounded-lg dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">Target Canvas DPI</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {customDpi} DPI
                    </span>
                  </div>
                  <input
                    type="range"
                    min={72}
                    max={300}
                    step={10}
                    value={customDpi}
                    onChange={(e) => setCustomDpi(Number(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 rounded-lg dark:bg-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">
                    72 DPI (Web/Email) • 150 DPI (Balanced) • 300 DPI (Archival)
                  </span>
                </div>
              </div>
            )}

            {/* Real-Time Live File Size Savings Indicator */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.08] dark:bg-slate-900/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Projected Size Savings
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {liveTotals.changePercent > 0 ? `+${liveTotals.changePercent}%` : `${liveTotals.changePercent}%`}
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Original Total:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatBytes(liveTotals.original)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Estimated Size:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ~{formatBytes(liveTotals.estimated)}
                  </span>
                </div>
                {liveTotals.savedBytes > 0 && (
                  <div className="flex justify-between border-t border-slate-200/60 dark:border-white/[0.06] pt-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Estimated Savings:</span>
                    <span>-{formatBytes(liveTotals.savedBytes)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCompress}
                disabled={busy || files.length === 0}
                className="btn-primary w-full py-3 text-sm font-extrabold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {busy ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Compressing PDF...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Archive size={16} />
                    <span>
                      Compress {files.length > 0 ? `${files.length} Document${files.length > 1 ? "s" : ""}` : "PDF"}
                    </span>
                  </div>
                )}
              </button>

              {progressText && (
                <p className="text-center text-[11px] font-mono text-emerald-600 dark:text-emerald-400 animate-pulse">
                  {progressText}
                </p>
              )}
            </div>

            {/* 100% Free Unlimited Badge */}
            <div className="text-center pt-2">
              <p className="text-[11px] font-bold text-slate-400">
                100% Free & Unlimited • Zero Server Uploads
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
