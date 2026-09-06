import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowLeftRight,
  ArrowRight,
  Check,
  Download,
  GraduationCap,
  Lock,
  QrCode,
  RotateCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Unlock,
  Zap
} from "lucide-react";
import UploadZone from "../UploadZone";
import { NumberField, OptionGrid, Select } from "../ui/Controls";
import {
  ImageItem,
  Unit,
  convertLength,
  createImageItem,
  downloadBlob,
  estimateFileSize,
  formatBytes,
  resizeImage
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;
type ResizeUnit = Unit | "percent";

const imageAccept =
  "image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/svg+xml,image/avif,image/gif,.jpg,.jpeg,.jepg,.png,.webp,.bmp,.tiff,.tif,.svg,.avif,.gif";
const imageFormats = "JPG, JPEG, JEPG, PNG, WEBP, BMP, TIFF, SVG, AVIF, GIF";

const FORMAT_MAP: Record<string, { mime: string; ext: string }> = {
  jpg: { mime: "image/jpeg", ext: "jpg" },
  jpeg: { mime: "image/jpeg", ext: "jpeg" },
  jepg: { mime: "image/jpeg", ext: "jepg" },
  png: { mime: "image/png", ext: "png" },
  webp: { mime: "image/webp", ext: "webp" },
  bmp: { mime: "image/bmp", ext: "bmp" },
  tiff: { mime: "image/tiff", ext: "tiff" }
};

export interface ResizerPreset {
  label: string;
  sub?: string;
  w: number;
  h: number;
  u: ResizeUnit;
  dpi: number;
  badge?: string;
}

const EXAM_PRESETS: ResizerPreset[] = [
  {
    label: "Exam Passport Photo",
    sub: "UPSC, SSC, NEET, JEE, Colleges",
    w: 35,
    h: 45,
    u: "mm",
    dpi: 300,
    badge: "35×45mm"
  },
  {
    label: "Candidate Signature",
    sub: "Exam Form Signature Box",
    w: 35,
    h: 15,
    u: "mm",
    dpi: 200,
    badge: "35×15mm"
  },
  {
    label: "Thumb Impression",
    sub: "Biometric Slip Upload",
    w: 30,
    h: 30,
    u: "mm",
    dpi: 200,
    badge: "30×30mm"
  },
  {
    label: "Digital Portal Spec",
    sub: "SSC / NTA / Web Upload",
    w: 200,
    h: 230,
    u: "px",
    dpi: 96,
    badge: "200×230px"
  },
  {
    label: "Visa / NTA 2×2\"",
    sub: "US / Schengen / Gate",
    w: 51,
    h: 51,
    u: "mm",
    dpi: 300,
    badge: "2×2 inch"
  },
  {
    label: "Exam Marksheet A4",
    sub: "Academic Certificate",
    w: 210,
    h: 297,
    u: "mm",
    dpi: 200,
    badge: "210×297mm"
  }
];

const SOCIAL_PRESETS: ResizerPreset[] = [
  { label: "IG Square (1:1)", w: 1080, h: 1080, u: "px", dpi: 72 },
  { label: "IG Story (9:16)", w: 1080, h: 1920, u: "px", dpi: 72 },
  { label: "YT Thumbnail (16:9)", w: 1280, h: 720, u: "px", dpi: 72 },
  { label: "Twitter Banner", w: 1500, h: 500, u: "px", dpi: 72 }
];

export default function ImageResizerView({
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
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<ImageItem | null>(null);
  const [unit, setUnit] = useState<ResizeUnit>("px");
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [dpi, setDpi] = useState(300);
  const [locked, setLocked] = useState(true);
  const [quality, setQuality] = useState(85);
  const [format, setFormat] = useState("jpg");
  const [resultUrl, setResultUrl] = useState("");
  const [lastResult, setLastResult] = useState<{ blob: Blob; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    try {
      const image = await createImageItem(picked);
      setFile(picked);
      setSource(image);
      setWidth(image.width);
      setHeight(image.height);
      setResultUrl("");
      notify("Image loaded successfully!", "info");
    } catch {
      notify("Failed to load image.", "error");
    }
  };

  const applyPreset = (p: ResizerPreset) => {
    setUnit(p.u);
    setWidth(p.w);
    setHeight(p.h);
    setDpi(p.dpi);
    setLocked(false);
  };

  const swapDimensions = () => {
    const temp = width;
    setWidth(height);
    setHeight(temp);
  };

  const scaleBy = (factor: number) => {
    setWidth((prev) => Math.round(prev * factor));
    setHeight((prev) => Math.round(prev * factor));
  };

  // Convert current input values into target physical pixels
  const targetPx = useMemo(() => {
    if (!source) return { width: 0, height: 0 };
    if (unit === "percent") {
      return {
        width: Math.max(1, (source.width * width) / 100),
        height: Math.max(1, (source.height * height) / 100)
      };
    }
    return {
      width: Math.max(1, convertLength(width, unit, "px", dpi)),
      height: Math.max(1, convertLength(height, unit, "px", dpi))
    };
  }, [source, unit, width, height, dpi]);

  const activeFormatDef = FORMAT_MAP[format] || FORMAT_MAP.jpg;

  // Real-Time Dynamic File Size Estimation based on resolution scaling & format quality curve
  const sizeEstimate = estimateFileSize({
    originalSize: file?.size || 0,
    originalWidth: source?.width,
    originalHeight: source?.height,
    targetWidth: targetPx.width,
    targetHeight: targetPx.height,
    quality: quality / 100,
    format: activeFormatDef.mime
  });

  const runResize = async () => {
    if (!file) return notify("Upload or paste an image first.", "error");
    setBusy(true);
    try {
      const blob = await resizeImage(
        file,
        targetPx.width,
        targetPx.height,
        activeFormatDef.mime,
        quality / 100
      );
      const url = URL.createObjectURL(blob);
      const outName = `resized-${Math.round(targetPx.width)}x${Math.round(targetPx.height)}.${activeFormatDef.ext}`;
      setResultUrl(url);
      setLastResult({ blob, name: outName });
      downloadBlob(blob, outName);
      notify(`Resized ${activeFormatDef.ext.toUpperCase()} image downloaded successfully!`, "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not resize image.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (    <div className="space-y-4 lg:h-full lg:flex lg:flex-col min-h-0">
      {/* Vice-Versa Quick Banner */}
      {onSwitchViceVersa && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs dark:bg-cyan-950/20">
          <div>
            <span className="font-bold text-cyan-800 dark:text-cyan-200">
              Need to convert units, DPI, or print sizes bidirectionally?
            </span>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Calculate exact physical millimeter, inch, and pixel dimensions with live vice-versa flipping.
            </p>
          </div>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="btn-secondary h-8 px-3 text-xs"
          >
            <ArrowLeftRight size={13} />
            Switch to Unit & DPI Calculator
          </button>
        </div>
      )}

      {/* Studio Header Subtitle */}
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            3-Stage Left-to-Right Studio Workflow
          </span>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>Input Image</span>
            <ArrowRight size={14} className="text-cyan-500" />
            <span>Resize Settings</span>
            <ArrowRight size={14} className="text-cyan-500" />
            <span>Target Output & Export</span>
          </h3>
        </div>

        {source && (
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300">
            Original: {source.width} × {source.height} px
          </span>
        )}
      </div>

      {/* 3-Column Left-to-Right Grid on Large Screens */}
      <div className="flex-1 min-h-0 grid gap-6 lg:grid-cols-[1fr_380px_1fr] lg:items-start">
        {/* STAGE 1 (LEFT): Original Source Input */}
        <div className="panel space-y-4 flex flex-col justify-between lg:h-full lg:max-h-[calc(100vh-175px)] lg:overflow-y-auto overscroll-contain pr-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-600 text-xs font-extrabold text-white">
                  1
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Original Image (Input)
                </span>
              </div>
              {source && (
                <span className="font-mono text-[11px] font-semibold text-slate-500">
                  {formatBytes(file?.size || 0)}
                </span>
              )}
            </div>

            {!source ? (
              <UploadZone
                accept={imageAccept}
                files={file ? [file] : []}
                formats={imageFormats}
                onFiles={load}
                onRemove={() => {
                  setFile(null);
                  setSource(null);
                  setResultUrl("");
                }}
                label="Drop image to resize"
                helperText="Browse, drag & drop, or Cmd+V"
              />
            ) : (
              <div className="space-y-3">
                <div className="checkerboard flex h-64 w-full items-center justify-center rounded-2xl border border-slate-200/80 p-3 relative overflow-hidden bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                  <img
                    src={source.url}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                  />
                  <span className="absolute bottom-2.5 left-2.5 rounded-lg bg-slate-900/80 px-2 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-md">
                    {source.width} × {source.height} px
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <p className="truncate font-semibold text-slate-800 dark:text-slate-200 max-w-[200px]" title={file?.name}>
                    {file?.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setSource(null);
                      setResultUrl("");
                    }}
                    className="font-bold text-rose-500 hover:text-rose-600 text-[11px]"
                  >
                    Change image
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-[11px] text-slate-500 dark:border-slate-800/80 dark:bg-slate-800/40">
            Original proportions: {source ? `${(source.width / source.height).toFixed(2)}:1 aspect ratio` : "Awaiting image upload"}
          </div>
        </div>

        {/* STAGE 2 (CENTER): Resize Controls & Transformation */}
        <div className="panel space-y-5 lg:h-full lg:max-h-[calc(100vh-175px)] lg:overflow-y-auto overscroll-contain pr-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-600 text-xs font-extrabold text-white">
                2
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Resize Settings (Transform)
              </span>
            </div>
            <button
              type="button"
              onClick={swapDimensions}
              className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-bold text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-300"
              title="Swap Width ⟷ Height (Portrait ⟷ Landscape)"
            >
              ⇄ Swap W/H
            </button>
          </div>

          {/* Student & Employee Examination Form Presets */}
          <div className="space-y-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <GraduationCap size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span>Exam Form Presets (Students & Employees)</span>
              </span>
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                100% Accepted
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Official dimensions for UPSC, SSC, NEET, JEE, GATE, Colleges, & Recruitment Portals
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {EXAM_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-xl border border-indigo-500/20 bg-white/90 p-2 text-left transition hover:border-indigo-500 hover:bg-indigo-50 dark:border-white/[0.08] dark:bg-slate-900 dark:hover:border-indigo-400"
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {p.label}
                    </p>
                    {p.badge && (
                      <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  {p.sub && (
                    <p className="text-[10px] text-slate-400 truncate">
                      {p.sub}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Social Media & Screen Presets */}
          <div className="space-y-2">
            <span className="label block">Social & Web Presets</span>
            <div className="grid grid-cols-2 gap-2">
              {SOCIAL_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 text-left transition hover:border-cyan-400 hover:bg-cyan-50/30 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-cyan-500"
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {p.label}
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    {p.w}×{p.h} {p.u}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Scale Multipliers */}
          <div className="space-y-1.5">
            <span className="label block">Quick Multipliers</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "0.5× Half", val: 0.5 },
                { label: "0.75×", val: 0.75 },
                { label: "1.5×", val: 1.5 },
                { label: "2.0× Double", val: 2.0 }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => scaleBy(item.val)}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/80 py-1.5 text-center text-xs font-bold hover:border-cyan-400 hover:bg-cyan-50/30 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                >
                  {item.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions Controls */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-800 space-y-4">
            <OptionGrid>
              <Select
                label="Unit Mode"
                value={unit}
                onChange={(v) => setUnit(v as ResizeUnit)}
                options={[
                  { label: "Pixels (px)", value: "px" },
                  { label: "Millimeters (mm)", value: "mm" },
                  { label: "Centimeters (cm)", value: "cm" },
                  { label: "Inches (in)", value: "in" },
                  { label: "Percentage (%)", value: "percent" }
                ]}
              />
              <NumberField
                label="DPI Resolution"
                value={dpi}
                onChange={setDpi}
                min={1}
                suffix="DPI"
              />
            </OptionGrid>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Lock Aspect Ratio
              </span>
              <button
                type="button"
                onClick={() => setLocked(!locked)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  locked
                    ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                    : "bg-slate-200/60 text-slate-500 dark:bg-slate-800"
                }`}
              >
                {locked ? <Lock size={13} /> : <Unlock size={13} />}
                {locked ? "Locked" : "Unlocked"}
              </button>
            </div>

            <OptionGrid>
              <NumberField
                label={`Target Width (${unit})`}
                value={width}
                onChange={(val) => {
                  setWidth(val);
                  if (locked && source && source.width > 0) {
                    setHeight(val * (source.height / source.width));
                  }
                }}
                min={1}
              />
              <NumberField
                label={`Target Height (${unit})`}
                value={height}
                onChange={(val) => {
                  setHeight(val);
                  if (locked && source && source.height > 0) {
                    setWidth(val * (source.width / source.height));
                  }
                }}
                min={1}
              />
            </OptionGrid>

            {/* Quality Level Slider with Dynamic Size Indication */}
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="label">Quality Level (Affects Output File Size)</label>
                <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  {quality}%
                </span>
              </div>

              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 rounded-lg dark:bg-slate-800"
              />

              {/* Live Quality Description Tag */}
              <div
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold flex items-center justify-between ${
                  quality <= 50
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : quality <= 75
                    ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                    : quality <= 90
                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                    : "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                }`}
              >
                <span>
                  {quality <= 50
                    ? "Economy / Small File Size"
                    : quality <= 75
                    ? "Balanced / Web & Socials"
                    : quality <= 90
                    ? "High Clarity / Crisp Details"
                    : "Max / Studio Master"}
                </span>
                {file && (
                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    Est: ~{formatBytes(sizeEstimate.bytes)}
                  </span>
                )}
              </div>

              {/* Quick Quality Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                {[
                  { label: "Economy", val: 50, sub: "Small" },
                  { label: "Balanced", val: 75, sub: "Web" },
                  { label: "High", val: 85, sub: "Sharp" },
                  { label: "Max", val: 95, sub: "Master" }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setQuality(preset.val)}
                    className={`rounded-xl border py-1.5 px-1 text-center transition ${
                      quality === preset.val
                        ? "border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold"
                        : "border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700 dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-300"
                    }`}
                  >
                    <p className="text-[11px] font-bold">{preset.label}</p>
                    <p className="text-[9px] opacity-70 font-mono">{preset.val}%</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* STAGE 3 (RIGHT): Target Output & Download */}
        <div className="panel space-y-5 flex flex-col justify-between lg:h-full lg:max-h-[calc(100vh-175px)] lg:overflow-y-auto overscroll-contain pr-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-600 text-xs font-extrabold text-white">
                  3
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Resized Output (Result)
                </span>
              </div>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400">
                {Math.round(targetPx.width)} × {Math.round(targetPx.height)} px
              </span>
            </div>

            {/* Target Preview Canvas */}
            <div className="checkerboard flex h-64 w-full items-center justify-center rounded-2xl border border-cyan-500/30 p-3 relative overflow-hidden bg-slate-100 dark:border-cyan-500/30 dark:bg-slate-950">
              {source ? (
                <img
                  src={resultUrl || source.url}
                  alt="Resized Result Preview"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center p-4 space-y-1.5 text-slate-400">
                  <ArrowDownUp size={24} className="mx-auto opacity-50" />
                  <p className="text-xs">Upload image to preview resize</p>
                </div>
              )}
              {source && (
                <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-cyan-600/90 px-2 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-md">
                  Output: {Math.round(targetPx.width)} × {Math.round(targetPx.height)} px
                </span>
              )}
            </div>

            <Select
              label="Output Format"
              value={format}
              onChange={setFormat}
              options={[
                { label: "JPG (.jpg) — Standard 3-letter", value: "jpg" },
                { label: "JPEG (.jpeg) — Official 4-letter", value: "jpeg" },
                { label: "JEPG (.jepg) — Portal Alias Format", value: "jepg" },
                { label: "PNG (.png) — Lossless Quality", value: "png" },
                { label: "WebP (.webp) — Modern Web Format", value: "webp" },
                { label: "BMP (.bmp) — Bitmap Graphic", value: "bmp" },
                { label: "TIFF (.tiff) — Archival Print Master", value: "tiff" }
              ]}
            />

            {/* Real-Time Live File Size Indicator Card */}
            {file && (
              <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-tr from-cyan-500/10 via-teal-500/5 to-transparent p-4 space-y-3 dark:border-cyan-500/25 dark:bg-slate-900/60">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-cyan-500" />
                    <span>New File Size Indicator</span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-extrabold ${
                      sizeEstimate.isReduction
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/20 text-amber-600"
                    }`}
                  >
                    {sizeEstimate.changePercent > 0
                      ? `+${sizeEstimate.changePercent}% Increase`
                      : `${sizeEstimate.changePercent}% Reduction`}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Current File Size:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-800 dark:text-slate-100">
                    <span className="font-sans font-bold">Estimated Output Size:</span>
                    <span className="font-extrabold text-sm text-cyan-600 dark:text-cyan-400">
                      ~{formatBytes(sizeEstimate.bytes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span>Quality & Dimensions:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {quality}% • {Math.round(targetPx.width)}×{Math.round(targetPx.height)} px
                    </span>
                  </div>
                </div>

                {/* Progress bar visualizing size change */}
                <div className="space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        sizeEstimate.isReduction
                          ? "bg-gradient-to-r from-teal-500 to-emerald-500"
                          : "bg-gradient-to-r from-amber-500 to-rose-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            10,
                            Math.round((sizeEstimate.bytes / Math.max(1, file.size)) * 100)
                          )
                        )}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Smaller</span>
                    <span>Original ({formatBytes(file.size)})</span>
                    <span>Larger</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              className="btn-primary w-full py-3"
              disabled={busy || !file}
              onClick={runResize}
            >
              <Download size={16} />
              {busy
                ? "Resizing Image..."
                : file
                ? `Download Resized (~${formatBytes(sizeEstimate.bytes)} • ${Math.round(targetPx.width)}×${Math.round(targetPx.height)}px)`
                : `Download Resized Image`}
            </button>

            {lastResult && onShareFile && (
              <button
                type="button"
                onClick={() =>
                  onShareFile({
                    name: lastResult.name,
                    blob: lastResult.blob,
                    size: lastResult.blob.size
                  })
                }
                className="w-full rounded-2xl border border-indigo-500/30 bg-indigo-500/10 py-2.5 text-xs font-extrabold text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-300 dark:bg-indigo-950/40 transition flex items-center justify-center gap-2"
              >
                <QrCode size={15} />
                <span>Download on Mobile via QR Code / Share</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
