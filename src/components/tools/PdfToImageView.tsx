import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  Copy,
  Download,
  FileImage,
  Layers,
  Monitor,
  Printer,
  QrCode,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import UploadZone from "../UploadZone";
import { NumberField, OptionGrid, Select, TextField } from "../ui/Controls";
import {
  PdfFileInfo,
  PdfImageFormat,
  PdfImageOutput,
  downloadBlob,
  estimateFileSize,
  formatBytes,
  getImageExtension,
  parsePageRanges,
  pdfPagesToImages,
  readPdfInfo,
  zipAndDownload
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;
type SizeMode = "dpi" | "scale" | "width";
type FormatCategory = "all" | "standard" | "web" | "print" | "vector";
export type FormatKey =
  | "jpg"
  | "jpeg"
  | "jepg"
  | "png"
  | "webp"
  | "tiff"
  | "bmp"
  | "svg"
  | "avif"
  | "gif";

interface FormatDefinition {
  key: FormatKey;
  mime: PdfImageFormat;
  ext: string;
  name: string;
  desc: string;
  badge?: string;
  category: "standard" | "web" | "print" | "vector";
  isLossless?: boolean;
}

const ALL_IMAGE_FORMATS: FormatDefinition[] = [
  {
    key: "jpg",
    mime: "image/jpeg",
    ext: "jpg",
    name: "JPG (.jpg)",
    desc: "Standard 3-letter • Compact size",
    badge: "Most Popular",
    category: "standard"
  },
  {
    key: "jpeg",
    mime: "image/jpeg",
    ext: "jpeg",
    name: "JPEG (.jpeg)",
    desc: "Official 4-letter • Submission portals",
    badge: "Official Spec",
    category: "standard"
  },
  {
    key: "jepg",
    mime: "image/jpeg",
    ext: "jepg",
    name: "JEPG (.jepg)",
    desc: "Portal & submission alias format",
    badge: "Direct .jepg",
    category: "standard"
  },
  {
    key: "png",
    mime: "image/png",
    ext: "png",
    name: "PNG (.png)",
    desc: "Lossless crisp graphics & alpha",
    badge: "Lossless",
    category: "standard",
    isLossless: true
  },
  {
    key: "webp",
    mime: "image/webp",
    ext: "webp",
    name: "WebP (.webp)",
    desc: "Modern ultra-compact web standard",
    badge: "High Ratio",
    category: "web"
  },
  {
    key: "tiff",
    mime: "image/tiff",
    ext: "tiff",
    name: "TIFF (.tiff)",
    desc: "Archival print-grade lossless RGBA",
    badge: "Print Master",
    category: "print",
    isLossless: true
  },
  {
    key: "bmp",
    mime: "image/bmp",
    ext: "bmp",
    name: "BMP (.bmp)",
    desc: "Raw Windows uncompressed bitmap",
    badge: "Uncompressed",
    category: "print",
    isLossless: true
  },
  {
    key: "svg",
    mime: "image/svg+xml",
    ext: "svg",
    name: "SVG (.svg)",
    desc: "Scalable vector container (Figma)",
    badge: "Vector",
    category: "vector",
    isLossless: true
  },
  {
    key: "avif",
    mime: "image/avif",
    ext: "avif",
    name: "AVIF (.avif)",
    desc: "Next-gen AV1 efficiency format",
    badge: "Next-Gen",
    category: "web"
  },
  {
    key: "gif",
    mime: "image/gif",
    ext: "gif",
    name: "GIF (.gif)",
    desc: "Universal 8-bit web graphic",
    badge: "Graphic",
    category: "web"
  }
];

export default function PdfToImageView({
  notify,
  onSwitchViceVersa,
  initialFiles,
  onShareFile
}: {
  notify: ToastNotify;
  onSwitchViceVersa?: () => void;
  initialFiles?: File[];
  onShareFile?: (file: { name: string; blob: Blob; size?: number; url?: string }) => void;
}) {
  const [info, setInfo] = useState<PdfFileInfo | null>(null);
  const [ranges, setRanges] = useState("1");
  const [formatKey, setFormatKey] = useState<FormatKey>("jpg");
  const [categoryFilter, setCategoryFilter] = useState<FormatCategory>("all");
  const [quality, setQuality] = useState(88);

  const activeFormat = ALL_IMAGE_FORMATS.find((f) => f.key === formatKey) || ALL_IMAGE_FORMATS[0];

  // Size Controls
  const [sizeMode, setSizeMode] = useState<SizeMode>("dpi");
  const [dpi, setDpi] = useState<number>(300);
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(2.0);
  const [targetWidth, setTargetWidth] = useState<number>(1920);

  const [outputs, setOutputs] = useState<PdfImageOutput[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    try {
      const pdf = await readPdfInfo(picked, 8);
      setInfo(pdf);
      setRanges(`1-${Math.min(pdf.pages, 4)}`);
      setOutputs([]);
      notify(`PDF loaded (${pdf.pages} pages).`, "info");
    } catch {
      notify("Failed to read PDF file.", "error");
    }
  };

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      load(initialFiles);
    }
  }, [initialFiles]);

  // Calculate estimated dimensions based on PDF page 1 base size
  const baseW = info?.baseWidth || 595;
  const baseH = info?.baseHeight || 842;

  let estimatedW = baseW * 2;
  let estimatedH = baseH * 2;

  if (sizeMode === "dpi") {
    const scale = dpi / 72;
    estimatedW = Math.round(baseW * scale);
    estimatedH = Math.round(baseH * scale);
  } else if (sizeMode === "scale") {
    estimatedW = Math.round(baseW * scaleMultiplier);
    estimatedH = Math.round(baseH * scaleMultiplier);
  } else if (sizeMode === "width") {
    estimatedW = targetWidth;
    estimatedH = Math.round(baseH * (targetWidth / baseW));
  }

  const selectedPages = info ? parsePageRanges(ranges, info.pages) : [1];
  const pageCount = Math.max(1, selectedPages.length);

  const basePageSize = info?.file.size
    ? Math.max(20000, Math.round(info.file.size / Math.max(1, info.pages)))
    : 200000;

  const estimatedPerPage = estimateFileSize({
    originalSize: basePageSize,
    originalWidth: baseW,
    originalHeight: baseH,
    targetWidth: estimatedW,
    targetHeight: estimatedH,
    quality: quality / 100,
    format: activeFormat.mime
  });

  const estimatedTotalBytes = estimatedPerPage.bytes * pageCount;

  const run = async () => {
    if (!info) return notify("Upload a PDF first.", "error");
    const pages = parsePageRanges(ranges, info.pages);
    if (!pages.length) return notify("Specify at least one valid page number.", "error");
    setBusy(true);
    try {
      const result = await pdfPagesToImages(info.file, pages, {
        type: activeFormat.mime,
        quality: quality / 100,
        scaleMode: sizeMode,
        dpi,
        scale: scaleMultiplier,
        targetWidth,
        extension: activeFormat.ext
      });
      setOutputs(result);
      notify(`Converted ${result.length} page(s) into ${estimatedW}×${estimatedH}px ${activeFormat.name} images!`, "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not convert PDF pages.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start min-h-0">
      {/* Left Area: Upload, Thumbnails, & Output Results */}
      <div className="space-y-6 xl:max-h-[calc(100vh-210px)] xl:overflow-y-auto pr-1">
        {onSwitchViceVersa && (
          <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs dark:bg-amber-950/20">
            <span className="font-medium text-slate-700 dark:text-amber-200">
              Need the reverse? Assemble images into a single PDF document?
            </span>
            <button
              type="button"
              onClick={onSwitchViceVersa}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-white px-3 py-1.5 font-bold text-amber-700 shadow-sm transition hover:bg-amber-50 dark:bg-slate-900 dark:text-amber-300"
            >
              <ArrowLeftRight size={13} />
              Switch to Image to PDF
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
            label="Upload PDF to convert to JPG or PNG images"
            helperText="Extract pages into high-resolution JPG or PNG with custom DPI, scale, or pixel width"
          />
        </div>

        {/* Page Thumbnail Selector */}
        {info && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Document Pages ({info.pages} total)
              </span>
              <span className="text-[11px] text-slate-400">
                Click a thumbnail to extract that page
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {info.thumbnails.map((thumb, idx) => {
                const page = idx + 1;
                return (
                  <button
                    key={thumb}
                    type="button"
                    onClick={() => setRanges(String(page))}
                    className="group rounded-2xl border border-slate-200/80 bg-white p-2 text-left transition hover:border-cyan-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="mb-2 flex h-32 w-full items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-950">
                      <img
                        src={thumb}
                        alt={`Page ${page}`}
                        className="max-h-full max-w-full object-contain p-1"
                      />
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

        {/* Generated Image Outputs with Dimensions & Size */}
        {outputs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Rendered Images ({outputs.length})
              </h3>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {estimatedW} × {estimatedH} px
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {outputs.map((out) => (
                <div
                  key={out.name}
                  className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="checkerboard flex h-52 items-center justify-center p-3 relative">
                    <img
                      src={out.url}
                      alt={out.name}
                      className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                    <span className="absolute top-2.5 right-2.5 rounded-lg bg-slate-900/80 px-2 py-1 font-mono text-[11px] font-bold text-white backdrop-blur-md">
                      {out.width} × {out.height} px
                    </span>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200" title={out.name}>
                        {out.name}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-300 uppercase">
                          {out.name.split(".").pop()?.toUpperCase() || "IMG"}
                        </span>
                        <span className="font-mono text-xs text-slate-500 font-semibold">
                          {formatBytes(out.blob.size)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => downloadBlob(out.blob, out.name)}
                        className="btn-primary flex-1 py-1.5 text-xs flex items-center justify-center gap-1"
                      >
                        <Download size={13} />
                        <span>Download {out.name.split(".").pop()?.toUpperCase() || "Image"}</span>
                      </button>
                      {onShareFile && (
                        <button
                          type="button"
                          onClick={() =>
                            onShareFile({
                              name: out.name,
                              blob: out.blob,
                              size: out.blob.size,
                              url: out.url
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
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Area: Size Controls, DPI, & Format */}
      <div className="space-y-5 xl:sticky xl:top-0 xl:max-h-[calc(100vh-210px)] xl:overflow-y-auto pr-1">
        <div className="panel space-y-5">
          {/* Output Size Mode Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label">Output Size Control</span>
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-cyan-700 dark:text-cyan-300">
                  {estimatedW} × {estimatedH} px
                </span>
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-teal-700 dark:text-teal-300">
                  ~{formatBytes(estimatedPerPage.bytes)} / page
                </span>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-1 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setSizeMode("dpi")}
                className={`rounded-lg py-1.5 text-xs font-bold transition ${
                  sizeMode === "dpi"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                By DPI
              </button>
              <button
                type="button"
                onClick={() => setSizeMode("scale")}
                className={`rounded-lg py-1.5 text-xs font-bold transition ${
                  sizeMode === "scale"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                By Scale
              </button>
              <button
                type="button"
                onClick={() => setSizeMode("width")}
                className={`rounded-lg py-1.5 text-xs font-bold transition ${
                  sizeMode === "width"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Custom Width
              </button>
            </div>
          </div>

          {/* Mode 1: DPI Presets */}
          {sizeMode === "dpi" && (
            <div className="space-y-2.5">
              <span className="label block">DPI Presets</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "72 DPI", sub: "Web/Screen", val: 72 },
                  { label: "150 DPI", sub: "HD Sharp", val: 150 },
                  { label: "300 DPI", sub: "Ultra Print", val: 300 }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setDpi(item.val)}
                    className={`rounded-xl border p-2 text-center transition ${
                      dpi === item.val
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.sub}</p>
                  </button>
                ))}
              </div>
              <NumberField
                label="Custom DPI"
                value={dpi}
                onChange={setDpi}
                min={36}
                max={600}
                suffix="DPI"
              />
            </div>
          )}

          {/* Mode 2: Scale Multiplier */}
          {sizeMode === "scale" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="label">Scale Factor</span>
                <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  {scaleMultiplier}×
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={4.0}
                step={0.25}
                value={scaleMultiplier}
                onChange={(e) => setScaleMultiplier(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
              <div className="grid grid-cols-4 gap-1.5">
                {[1.0, 1.5, 2.0, 3.0].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScaleMultiplier(s)}
                    className={`rounded-lg border py-1 text-xs font-bold ${
                      scaleMultiplier === s
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-600"
                        : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode 3: Target Width (Pixels) */}
          {sizeMode === "width" && (
            <div className="space-y-2.5">
              <NumberField
                label="Target Width (Height auto-calculated)"
                value={targetWidth}
                onChange={setTargetWidth}
                min={320}
                max={7680}
                suffix="px"
              />
              <div className="flex flex-wrap gap-1.5">
                {[1080, 1920, 2400, 3840].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setTargetWidth(w)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                      targetWidth === w
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-600"
                        : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800"
                    }`}
                  >
                    {w}px {w === 1920 ? "(FHD)" : w === 3840 ? "(4K)" : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Dimension Summary Card */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-50/50 p-3.5 text-xs dark:border-cyan-500/30 dark:bg-cyan-950/20">
            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
              <span>Target Image Dimensions:</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                {estimatedW} × {estimatedH} px
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Original PDF page base: {baseW} × {baseH} pt
            </p>
          </div>

          <div className="border-t border-slate-200/80 pt-4 dark:border-slate-800 space-y-4">
            <TextField
              label="Pages to Convert"
              value={ranges}
              onChange={setRanges}
              placeholder="e.g. 1-3, 5"
              helper="Specify pages or ranges separated by commas"
            />

            {/* ALL Formats Selector with Category Tabs */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="label block">
                  Output Image Format ({ALL_IMAGE_FORMATS.length} Supported)
                </label>
                <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                  Selected: {activeFormat.name}
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "all", label: "All (10)" },
                  { id: "standard", label: "Standard (JPG, JPEG, JEPG, PNG)" },
                  { id: "web", label: "Web (WebP, AVIF, GIF)" },
                  { id: "print", label: "Print & Raw (TIFF, BMP)" },
                  { id: "vector", label: "Vector (SVG)" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id as any)}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${
                      categoryFilter === cat.id
                        ? "bg-cyan-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid of Format Cards */}
              <div className="grid grid-cols-2 gap-2">
                {(categoryFilter === "all"
                  ? ALL_IMAGE_FORMATS
                  : ALL_IMAGE_FORMATS.filter((f) => f.category === categoryFilter)
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFormatKey(item.key)}
                    className={`relative rounded-xl border p-2.5 text-left transition ${
                      formatKey === item.key
                        ? "border-cyan-500 bg-cyan-500/10 text-slate-900 shadow-sm ring-1 ring-cyan-500/50 dark:text-white dark:bg-cyan-500/15"
                        : "border-slate-200/80 bg-slate-50/70 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black tracking-wider text-cyan-600 dark:text-cyan-400">
                        {item.ext.toUpperCase()}
                      </span>
                      {item.badge && (
                        <span className="rounded bg-slate-200/70 px-1 py-0.2 text-[9px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Controls for Tunable formats vs Lossless notice */}
            {!activeFormat.isLossless ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="label">
                    {activeFormat.name} Quality & Compression ({quality}%)
                  </span>
                  <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    {quality}%
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 rounded-lg dark:bg-slate-800"
                />
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {[
                    { label: "Economy", val: 50 },
                    { label: "Balanced", val: 75 },
                    { label: "High", val: 90 },
                    { label: "Max", val: 100 }
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
            ) : (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs dark:bg-emerald-950/20">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                  <Sparkles size={13} />
                  <span>
                    {activeFormat.name} is Lossless & High-Fidelity
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Full 100% pixel data is preserved without compression loss or degradation.
                </p>
              </div>
            )}

            {/* Real-Time Live File Size Indicator Card */}
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-tr from-cyan-500/10 via-teal-500/5 to-transparent p-4 space-y-3 dark:border-cyan-500/25 dark:bg-slate-900/60">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-cyan-500" />
                  <span>New File Size Indicator</span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-extrabold ${
                    estimatedPerPage.isReduction
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/20 text-amber-600"
                  }`}
                >
                  {estimatedPerPage.changePercent > 0
                    ? `+${estimatedPerPage.changePercent}% Scale`
                    : `${estimatedPerPage.changePercent}% Compact`}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Estimated Size / Page:</span>
                  <span className="font-extrabold text-sm text-cyan-600 dark:text-cyan-400">
                    ~{formatBytes(estimatedPerPage.bytes)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
                  <span className="font-sans font-semibold">Total for {pageCount} page(s):</span>
                  <span className="font-extrabold font-mono text-slate-900 dark:text-slate-100">
                    ~{formatBytes(estimatedTotalBytes)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span>Format & Resolution:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {activeFormat.ext.toUpperCase()} {activeFormat.isLossless ? "(Lossless)" : `(${quality}%)`} • {estimatedW}×{estimatedH} px
                  </span>
                </div>
              </div>

              {/* Visual bar */}
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          10,
                          Math.round(
                            (estimatedPerPage.bytes / Math.max(1, basePageSize * 2)) * 100
                          )
                        )
                      )}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Low Res / Compact</span>
                  <span>Standard</span>
                  <span>High Res / 300 DPI</span>
                </div>
              </div>
            </div>
          </div>

          <button
            className="btn-primary w-full"
            disabled={busy || !info}
            onClick={run}
          >
            <FileImage size={16} />
            {busy
              ? `Rendering ${activeFormat.ext.toUpperCase()} Images...`
              : `Render ${pageCount} ${activeFormat.ext.toUpperCase()} Page(s) (~${formatBytes(estimatedTotalBytes)} • ${estimatedW}×${estimatedH}px)`}
          </button>

          {outputs.length > 0 && (
            <button
              className="btn-secondary w-full"
              onClick={() => {
                const extLabel = activeFormat.ext.toLowerCase();
                return outputs.length === 1
                  ? downloadBlob(outputs[0].blob, outputs[0].name)
                  : zipAndDownload(outputs, `imagepro-pdf-${extLabel}-images.zip`);
              }}
            >
              <Download size={16} />
              Download {outputs.length > 1 ? `ZIP (${outputs.length} ${activeFormat.ext.toUpperCase()} Images)` : `${activeFormat.ext.toUpperCase()} Image`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
