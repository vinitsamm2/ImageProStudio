import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Download,
  FileArchive,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap
} from "lucide-react";
import UploadZone from "../UploadZone";
import { Select } from "../ui/Controls";
import {
  compressOrConvertImage,
  compressPdf,
  downloadBlob,
  estimateFileSize,
  formatBytes,
  zipAndDownload
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

const COMPRESS_FORMAT_MAP: Record<string, { mime: string; ext: string }> = {
  jpg: { mime: "image/jpeg", ext: "jpg" },
  jpeg: { mime: "image/jpeg", ext: "jpeg" },
  jepg: { mime: "image/jpeg", ext: "jepg" },
  webp: { mime: "image/webp", ext: "webp" },
  png: { mime: "image/png", ext: "png" }
};

function outputName(name: string, ext: string) {
  if (name.toLowerCase().endsWith(".pdf")) {
    return `${name.replace(/\.pdf$/i, "")}-compressed.pdf`;
  }
  return `${name.replace(/\.[^.]+$/, "")}.${ext}`;
}

const mediaAccept =
  "image/jpeg,image/png,image/webp,image/bmp,image/tiff,application/pdf,.jpg,.jpeg,.jepg,.png,.webp,.bmp,.tiff,.tif,.pdf";
const mediaFormats = "JPG, JPEG, JEPG, PNG, WEBP, PDF";

export default function ImageCompressorView({
  notify,
  initialFiles,
  onSwitchViceVersa,
  onShareFile
}: {
  notify: ToastNotify;
  initialFiles?: File[];
  onSwitchViceVersa?: () => void;
  onShareFile?: (file: { name: string; blob: Blob; size?: number; url?: string }) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(72);
  const [format, setFormat] = useState("jpg");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<
    Array<{ name: string; original: number; blob: Blob; url: string; isPdf?: boolean }>
  >([]);

  // Load initial files if provided from shelf or omni dropzone
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setFiles(initialFiles);
    }
  }, [initialFiles]);

  // Live dynamic file size estimation that updates instantaneously when quality or format changes
  const liveTotals = useMemo(() => {
    let original = 0;
    let estimated = 0;
    const activeDef = COMPRESS_FORMAT_MAP[format] || COMPRESS_FORMAT_MAP.jpg;

    for (const f of files) {
      original += f.size;
      const isPdf = f.type.includes("pdf") || f.name.endsWith(".pdf");
      const est = estimateFileSize({
        originalSize: f.size,
        quality: quality / 100,
        format: isPdf ? "application/pdf" : activeDef.mime,
        isPdf
      });
      estimated += est.bytes;
    }

    const changePercent = original > 0 ? Math.round(((estimated - original) / original) * 100) : 0;
    const isReduction = estimated <= original;
    return { original, estimated, changePercent, isReduction };
  }, [files, quality, format]);

  // Accurate Live Measured Output Size (probes canvas / compression in background)
  const [measuredTotal, setMeasuredTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!files.length) {
      setMeasuredTotal(null);
      return;
    }
    let active = true;
    const activeDef = COMPRESS_FORMAT_MAP[format] || COMPRESS_FORMAT_MAP.jpg;
    const timer = setTimeout(async () => {
      try {
        let totalProbed = 0;
        const sample = files.slice(0, 5);
        for (const file of sample) {
          const isPdf = file.type.includes("pdf") || file.name.endsWith(".pdf");
          if (isPdf) {
            const est = estimateFileSize({
              originalSize: file.size,
              quality: quality / 100,
              format: "application/pdf",
              isPdf: true
            });
            totalProbed += est.bytes;
          } else {
            const blob = await compressOrConvertImage(file, activeDef.mime, quality / 100);
            if (!active) return;
            totalProbed += blob.size;
          }
        }
        if (active) {
          const scaledTotal =
            files.length > sample.length
              ? Math.round((totalProbed / sample.length) * files.length)
              : totalProbed;
          setMeasuredTotal(scaledTotal);
        }
      } catch {
        // fallback to formula
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [files, quality, format]);

  // Exact total bytes from completed compression runs
  const actualCompressedTotal = useMemo(() => {
    if (!results.length) return null;
    return results.reduce((acc, r) => acc + r.blob.size, 0);
  }, [results]);

  // Unified effective output size & indicator status
  const effectiveCompressedBytes =
    actualCompressedTotal !== null
      ? actualCompressedTotal
      : measuredTotal !== null
      ? measuredTotal
      : liveTotals.estimated;

  const compressIndicatorStatus =
    actualCompressedTotal !== null
      ? { label: "Actual Compressed Output", exact: true, color: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" }
      : measuredTotal !== null
      ? { label: "Live Measured Probe", exact: true, color: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400" }
      : { label: "Projected Estimate", exact: false, color: "bg-amber-500/20 text-amber-600" };

  const effectiveCompressChangePercent =
    liveTotals.original > 0
      ? Math.round(((effectiveCompressedBytes - liveTotals.original) / liveTotals.original) * 100)
      : 0;
  const effectiveCompressIsReduction = effectiveCompressedBytes <= liveTotals.original;

  // Quality Tier descriptor
  const qualityTier =
    quality <= 45
      ? { label: "Max Compression / Smallest Size", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
      : quality <= 75
      ? { label: "Balanced / Web Recommended", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" }
      : quality <= 88
      ? { label: "High Clarity / Print Ready", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" }
      : { label: "Near Lossless / Maximum Fidelity", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" };

  const run = async () => {
    if (!files.length) return notify("Upload or paste one or more files first.", "error");
    setBusy(true);
    const activeDef = COMPRESS_FORMAT_MAP[format] || COMPRESS_FORMAT_MAP.jpg;
    try {
      const compressed = await Promise.all(
        files.map(async (file) => {
          const isPdf = file.type.includes("pdf") || file.name.endsWith(".pdf");
          if (isPdf) {
            const blob = await compressPdf(file, quality / 100);
            return {
              name: outputName(file.name, "pdf"),
              original: file.size,
              blob,
              url: URL.createObjectURL(blob),
              isPdf: true
            };
          } else {
            const blob = await compressOrConvertImage(file, activeDef.mime, quality / 100);
            return {
              name: outputName(file.name, activeDef.ext),
              original: file.size,
              blob,
              url: URL.createObjectURL(blob),
              isPdf: false
            };
          }
        })
      );
      setResults(compressed);
      notify(`Successfully compressed ${compressed.length} file(s)!`, "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not compress files.", "error");
    } finally {
      setBusy(false);
    }
  };

  const totals = results.reduce(
    (sum, item) => ({
      original: sum.original + item.original,
      compressed: sum.compressed + item.blob.size
    }),
    { original: 0, compressed: 0 }
  );

  const actualReduction = totals.original
    ? Math.max(0, Math.round((1 - totals.compressed / totals.original) * 100))
    : 0;

  return (
    <div className="space-y-4">
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <FileText size={14} />
            </span>
            <span className="font-medium text-slate-700 dark:text-indigo-200">
              Looking to shrink and optimize PDF documents instead?
            </span>
          </div>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-white px-3 py-1.5 font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300"
          >
            <ArrowLeftRight size={13} />
            Switch to PDF Compressor
          </button>
        </div>
      )}

      {/* Dual Compressor Mode Switch Capsule */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-2 dark:border-white/[0.08] dark:bg-slate-900 shadow-xs">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-2 rounded-xl bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-xs">
            <ImageIcon size={15} className="text-cyan-500" />
            <span>Image Compressor</span>
            <span className="rounded-full bg-cyan-500 px-1.5 py-0.2 text-[9px] font-mono text-white">
              ACTIVE
            </span>
          </div>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06] transition"
          >
            <FileText size={15} className="text-emerald-500" />
            <span>PDF Compressor</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium pr-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>100% In-Browser • Zero Cloud Uploads</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start min-h-0">
      {/* Left Area: Upload & Results */}
      <div className="space-y-6 xl:max-h-[calc(100vh-210px)] xl:overflow-y-auto pr-1">
        <div className="panel">
          <UploadZone
            accept={mediaAccept}
            multiple
            files={files}
            formats={mediaFormats}
            onFiles={(next) => setFiles((current) => [...current, ...next])}
            onRemove={(index) => {
              setFiles((current) => current.filter((_, i) => i !== index));
              setResults([]);
            }}
            onClear={() => {
              setFiles([]);
              setResults([]);
            }}
            label="Upload Images or PDFs to Reduce Size"
            helperText="Drag & drop images (JPG, PNG, WebP) or PDF documents to optimize size"
          />
        </div>

        {/* Live Per-File Size Estimation Cards */}
        {files.length > 0 && results.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Staged Files & Real-Time Size Estimates ({files.length})
              </span>
              <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                Quality: {quality}%
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {files.map((file, idx) => {
                const isPdf = file.type.includes("pdf") || file.name.endsWith(".pdf");
                const est = estimateFileSize({
                  originalSize: file.size,
                  quality: quality / 100,
                  format,
                  isPdf
                });
                return (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-white/[0.08] dark:bg-slate-900/80"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {isPdf ? <FileText size={16} className="text-rose-500" /> : <ImageIcon size={16} className="text-cyan-500" />}
                      </div>
                      <div className="truncate">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Original: {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1">
                        {est.isReduction ? (
                          <TrendingDown size={12} className="text-emerald-500" />
                        ) : (
                          <TrendingUp size={12} className="text-amber-500" />
                        )}
                        <span className="font-mono text-xs font-extrabold text-cyan-600 dark:text-cyan-400">
                          ~{formatBytes(est.bytes)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold ${est.isReduction ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`}>
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Compressed Results ({results.length})</span>
              </h3>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {actualReduction}% Total Size Reduction
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((result) => {
                const itemSaved = Math.max(
                  0,
                  Math.round((1 - result.blob.size / result.original) * 100)
                );
                return (
                  <div
                    key={result.name}
                    className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-white/[0.08] dark:bg-slate-900"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-950 checkerboard flex items-center justify-center p-2">
                      {result.isPdf ? (
                        <div className="text-center p-4 space-y-2">
                          <FileText size={48} className="mx-auto text-rose-500" />
                          <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600">
                            Optimized PDF
                          </span>
                        </div>
                      ) : (
                        <img
                          src={result.url}
                          alt={result.name}
                          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      <span className="absolute top-2.5 right-2.5 rounded-lg bg-emerald-600/90 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                        -{itemSaved}%
                      </span>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200" title={result.name}>
                        {result.name}
                      </p>
                      <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                        <span className="line-through">{formatBytes(result.original)}</span>
                        <ArrowRight size={13} className="text-emerald-500" />
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatBytes(result.blob.size)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => downloadBlob(result.blob, result.name)}
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
                                name: result.name,
                                blob: result.blob,
                                size: result.blob.size,
                                url: result.url
                              })
                            }
                            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-bold text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-300 dark:bg-cyan-950/40 transition flex items-center gap-1 shrink-0"
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

      {/* Right Area: Controls, Quality Slider & Dynamic Size Indicator */}
      <div className="space-y-5 xl:sticky xl:top-0 xl:max-h-[calc(100vh-210px)] xl:overflow-y-auto pr-1">
        <div className="panel space-y-5">
          {/* Quality Level Slider with Dynamic New Size Feedback */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="label">Quality Level (Size vs Clarity)</label>
              <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                {quality}%
              </span>
            </div>

            <input
              className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 rounded-lg dark:bg-slate-800"
              type="range"
              min={10}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />

            {/* Live Quality Description Tag */}
            <div className={`rounded-xl border px-3 py-1.5 text-xs font-semibold flex items-center justify-between ${qualityTier.bg} ${qualityTier.border}`}>
              <span className={qualityTier.color}>{qualityTier.label}</span>
              {files.length > 0 && (
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  Est: ~{formatBytes(liveTotals.estimated)}
                </span>
              )}
            </div>
          </div>

          {/* Student & Employee Examination Form Target Presets */}
          <div className="space-y-2 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-3.5 dark:bg-indigo-950/25">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <GraduationCap size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span>Exam Form Size Targets (100% Accepted)</span>
              </span>
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                UPSC / SSC / NTA
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              1-click calibration to guarantee compliance with strict portal upload quotas
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { label: "Exam Photo", target: "20–50 KB", q: 48, sub: "UPSC / SSC / Colleges" },
                { label: "Signature", target: "10–20 KB", q: 32, sub: "Exam Signature Box" },
                { label: "ID / Proof", target: "50–100 KB", q: 68, sub: "Aadhar / Voter Card" },
                { label: "Marksheet", target: "100–300 KB", q: 80, sub: "Academic Scan" }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setQuality(item.q);
                    setFormat("jpg");
                    notify(`Calibrated quality for ${item.label} (${item.target}) in JPG format!`, "info");
                  }}
                  className="rounded-xl border border-indigo-500/20 bg-white/90 p-2 text-left transition hover:border-indigo-500 hover:bg-indigo-50/50 dark:border-white/[0.08] dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {item.target}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Quality Presets */}
          <div className="space-y-1.5">
            <span className="label block">Standard Quality Presets</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "Economy", val: 40, sub: "Smallest" },
                { label: "Balanced", val: 70, sub: "Standard" },
                { label: "High", val: 85, sub: "Crisp" },
                { label: "Max", val: 95, sub: "Lossless" }
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setQuality(preset.val)}
                  className={`rounded-xl border py-2 px-1 text-center transition ${
                    quality === preset.val
                      ? "border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold"
                      : "border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700 dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  <p className="text-xs font-bold">{preset.label}</p>
                  <p className="text-[10px] opacity-70 font-mono">{preset.val}%</p>
                </button>
              ))}
            </div>
          </div>

          <Select
            label="Image Output Format"
            value={format}
            onChange={setFormat}
            options={[
              { label: "JPG (.jpg) — Standard 3-letter", value: "jpg" },
              { label: "JPEG (.jpeg) — Official 4-letter", value: "jpeg" },
              { label: "JEPG (.jepg) — Portal Alias Format", value: "jepg" },
              { label: "WebP (.webp) — Modern ultra-compact", value: "webp" },
              { label: "PNG (.png) — Lossless graphics", value: "png" }
            ]}
          />

          {/* Real-Time Live File Size Indicator Card */}
          {files.length > 0 && (
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-tr from-cyan-500/10 via-teal-500/5 to-transparent p-4 space-y-3 dark:border-cyan-500/25 dark:bg-slate-900/60">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  New File Size Indicator
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${compressIndicatorStatus.color}`}>
                    {compressIndicatorStatus.label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-extrabold ${
                      effectiveCompressIsReduction
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/20 text-amber-600"
                    }`}
                  >
                    {effectiveCompressChangePercent > 0
                      ? `+${effectiveCompressChangePercent}% Increase`
                      : `${effectiveCompressChangePercent}% Reduction`}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Current Input:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatBytes(liveTotals.original)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-800 dark:text-slate-100">
                  <span className="font-sans font-bold">
                    {actualCompressedTotal !== null
                      ? "Compressed Output Size:"
                      : measuredTotal !== null
                      ? "Live Measured Output:"
                      : "Estimated Output:"}
                  </span>
                  <span className="font-extrabold text-sm text-cyan-600 dark:text-cyan-400">
                    {!compressIndicatorStatus.exact ? "~" : ""}
                    {formatBytes(effectiveCompressedBytes)}
                  </span>
                </div>
              </div>

              {/* Progress bar visualizing size change */}
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      effectiveCompressIsReduction
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500"
                        : "bg-gradient-to-r from-amber-500 to-rose-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          10,
                          Math.round(
                            (effectiveCompressedBytes / Math.max(1, liveTotals.original)) * 100
                          )
                        )
                      )}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Smaller</span>
                  <span>Original (100%)</span>
                  <span>Larger</span>
                </div>
              </div>

              {actualCompressedTotal !== null ? (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 pt-1 border-t border-cyan-500/15 flex items-center gap-1">
                  <span>✓ Exact match:</span>
                  <span>Directly reflects the real compressed file size in the results list.</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-cyan-500/15">
                  {measuredTotal !== null
                    ? "⚡ Live offscreen probe: Exact canvas re-encoding bytes for your settings."
                    : "Formula projection: Updates dynamically as quality slider moves."}
                </p>
              )}
            </div>
          )}

          {/* Action Trigger */}
          <div className="space-y-2.5">
            <button
              className="btn-primary w-full py-3 text-sm font-bold shadow-md"
              disabled={busy || files.length === 0}
              onClick={run}
            >
              <Zap size={16} />
              {busy
                ? "Compressing Files..."
                : `Compress & Reduce Size (${files.length ? `${files.length} file${files.length > 1 ? "s" : ""}` : "0"})`}
            </button>

            {results.length > 0 && (
              <button
                className="btn-secondary w-full"
                onClick={() =>
                  results.length === 1
                    ? downloadBlob(results[0].blob, results[0].name)
                    : zipAndDownload(results, "imagepro-compressed.zip")
                }
              >
                <Download size={16} />
                Download {results.length > 1 ? "All as ZIP" : "Compressed File"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
