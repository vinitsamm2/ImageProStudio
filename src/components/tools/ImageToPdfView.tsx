import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Download,
  FileImage,
  FileText,
  QrCode,
  RotateCw,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import UploadZone from "../UploadZone";
import { NumberField, OptionGrid, Select } from "../ui/Controls";
import {
  FitMode,
  ImageItem,
  Orientation,
  PageSizeName,
  createImageItem,
  downloadBlob,
  estimateFileSize,
  formatBytes,
  imagesToPdf,
  pageSizes
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

const imageAccept =
  "image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/svg+xml,image/avif,image/gif,.jpg,.jpeg,.jepg,.png,.webp,.bmp,.tiff,.tif,.svg,.avif,.gif";
const imageFormats = "JPG, JPEG, JEPG, PNG, WEBP, BMP, TIFF, SVG, AVIF, GIF";

export default function ImageToPdfView({
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
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeName>("A4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [fit, setFit] = useState<FitMode>("fit");
  const [margin, setMargin] = useState(24);
  const [quality, setQuality] = useState(80);
  const [customWidth, setCustomWidth] = useState(595);
  const [customHeight, setCustomHeight] = useState(842);
  const [lastGenerated, setLastGenerated] = useState<{ blob: Blob; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const addFiles = async (files: File[]) => {
    try {
      const next = await Promise.all(files.map(createImageItem));
      setImages((curr) => [...curr, ...next]);
      notify(`Added ${next.length} image(s)!`, "success");
    } catch (err) {
      notify("Could not load some images. Please check file format.", "error");
    }
  };

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      addFiles(initialFiles);
    }
  }, [initialFiles]);

  const totalInputBytes = useMemo(() => {
    return images.reduce((acc, img) => acc + (img.file?.size || 0), 0);
  }, [images]);

  const sizeEstimate = useMemo(() => {
    return estimateFileSize({
      originalSize: totalInputBytes,
      quality: quality / 100,
      isPdf: true
    });
  }, [totalInputBytes, quality]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages((curr) => {
      const copy = [...curr];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const rotateImage = (id: string) => {
    setImages((curr) =>
      curr.map((img) =>
        img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
      )
    );
  };

  const removeImage = (id: string) => {
    setImages((curr) => curr.filter((img) => img.id !== id));
  };

  const generate = async () => {
    if (!images.length) return notify("Add at least one image first.", "error");
    setBusy(true);
    try {
      const blob = await imagesToPdf(images, {
        pageSize,
        orientation,
        fit,
        margin,
        customWidth,
        customHeight,
        quality: quality / 100
      });
      const outName = "imagepro-document.pdf";
      setLastGenerated({ blob, name: outName });
      downloadBlob(blob, outName);
      notify("PDF generated and downloaded successfully!", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not generate PDF.", "error");
    } finally {
      setBusy(false);
    }
  };

  const [pw, ph] = pageSize === "Custom" ? [customWidth, customHeight] : pageSizes[pageSize];
  const aspectRatio = orientation === "portrait" ? `${pw}/${ph}` : `${ph}/${pw}`;

  return (
    <div className="space-y-6">
      {/* Vice-Versa Banner */}
      {onSwitchViceVersa && (
        <div className="flex items-center justify-between rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 text-xs dark:bg-indigo-950/20">
          <span className="font-medium text-slate-700 dark:text-indigo-200">
            Need the reverse? Convert an existing PDF document into JPG or PNG images?
          </span>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-white px-3 py-1.5 font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300"
          >
            <ArrowLeftRight size={13} />
            Switch to PDF to JPG
          </button>
        </div>
      )}

      {/* Main Left-to-Right Studio Grid */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start xl:h-full min-h-0">
        {/* Left Area: Upload & Left-to-Right Storyboard Page Sequencer */}
        <div className="space-y-6 xl:h-full xl:max-h-[calc(100vh-175px)] xl:overflow-y-auto overscroll-contain pr-1">
          <div className="panel">
            <UploadZone
              accept={imageAccept}
              multiple
              files={images.map((i) => i.file)}
              formats={imageFormats}
              onFiles={addFiles}
              onRemove={(index) => setImages((curr) => curr.filter((_, i) => i !== index))}
              onClear={() => setImages([])}
              label="Upload or paste images to assemble into PDF"
              helperText="Drag & drop pictures, browse, or paste with Cmd+V"
            />
          </div>

          {/* Left-to-Right Page Sequencer (Horizontal Gallery Cards) */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Page Sequence ({images.length} pages)</span>
                    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                      Left ➔ Right Reading Order
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pages are exported in order from left to right. Use the left/right arrows to rearrange.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setImages([])}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400"
                >
                  Clear all pages
                </button>
              </div>

              {/* Grid of Pages Laid Out Left-to-Right */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-cyan-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* Card Header: Page Number & Rotation Badge */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-3 py-2 text-xs font-bold dark:border-slate-800 dark:bg-slate-800/60">
                      <span className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300">
                        <span className="grid h-5 w-5 place-items-center rounded-md bg-cyan-600 text-[10px] text-white font-extrabold">
                          {index + 1}
                        </span>
                        <span>Page {index + 1}</span>
                      </span>

                      {image.rotation > 0 && (
                        <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] font-mono text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {image.rotation}°
                        </span>
                      )}
                    </div>

                    {/* Image Preview Box */}
                    <div className="checkerboard flex h-48 w-full items-center justify-center p-3 relative overflow-hidden bg-slate-100 dark:bg-slate-950">
                      <img
                        src={image.url}
                        alt={image.file.name}
                        className="max-h-full max-w-full object-contain transition-transform duration-200"
                        style={{ transform: `rotate(${image.rotation}deg)` }}
                      />
                    </div>

                    {/* File Meta */}
                    <div className="px-3 pt-2">
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200" title={image.file.name}>
                        {image.file.name}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">
                        {image.width} × {image.height} px
                      </p>
                    </div>

                    {/* Card Action Controls: Left ➔ Right Reordering */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 p-2.5 dark:border-slate-800">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                          className="btn-secondary h-7 px-2 text-[11px] font-bold"
                          title="Move Left (Earlier in PDF)"
                        >
                          <ArrowLeft size={12} />
                          <span className="hidden sm:inline">Left</span>
                        </button>
                        <button
                          type="button"
                          disabled={index === images.length - 1}
                          onClick={() => move(index, index + 1)}
                          className="btn-secondary h-7 px-2 text-[11px] font-bold"
                          title="Move Right (Later in PDF)"
                        >
                          <span className="hidden sm:inline">Right</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => rotateImage(image.id)}
                          className="btn-secondary h-7 w-7 p-0"
                          title="Rotate 90° Clockwise"
                        >
                          <RotateCw size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="btn-ghost h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          title="Remove Page"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Area: PDF Settings & Export */}
        <div className="space-y-5 xl:h-full xl:max-h-[calc(100vh-175px)] xl:overflow-y-auto overscroll-contain pr-1">
          <div className="panel space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                PDF Document Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure page size, orientation, and layout margins
              </p>
            </div>

            <OptionGrid>
              <Select
                label="Page Size"
                value={pageSize}
                onChange={(v) => setPageSize(v as PageSizeName)}
                options={["A4", "A3", "A5", "Letter", "Legal", "Custom"]}
              />
              <Select
                label="Orientation"
                value={orientation}
                onChange={(v) => setOrientation(v as Orientation)}
                options={[
                  { label: "Portrait", value: "portrait" },
                  { label: "Landscape", value: "landscape" }
                ]}
              />
            </OptionGrid>

            <OptionGrid>
              <Select
                label="Image Fit"
                value={fit}
                onChange={(v) => setFit(v as FitMode)}
                options={[
                  { label: "Fit within Page", value: "fit" },
                  { label: "Fill Page (Crop)", value: "fill" },
                  { label: "Original Size", value: "original" }
                ]}
              />
              <NumberField
                label="Page Margin"
                value={margin}
                onChange={setMargin}
                min={0}
                suffix="pt"
              />
            </OptionGrid>

            {pageSize === "Custom" && (
              <OptionGrid>
                <NumberField
                  label="Custom Width"
                  value={customWidth}
                  onChange={setCustomWidth}
                  min={100}
                  suffix="pt"
                />
                <NumberField
                  label="Custom Height"
                  value={customHeight}
                  onChange={setCustomHeight}
                  min={100}
                  suffix="pt"
                />
              </OptionGrid>
            )}

            {/* Quality Level Slider with Dynamic Size Indication */}
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="label">PDF Image Quality (Affects PDF Size)</label>
                <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  {quality}%
                </span>
              </div>

              <input
                type="range"
                min={30}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 rounded-lg dark:bg-slate-800"
              />

              {/* Quality Description Tag */}
              <div
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold flex items-center justify-between ${
                  quality <= 65
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : quality <= 85
                    ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                    : quality <= 98
                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                    : "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                }`}
              >
                <span>
                  {quality <= 65
                    ? "Compact / Small Email PDF"
                    : quality <= 85
                    ? "Standard / Balanced Quality"
                    : quality <= 98
                    ? "High / Crisp Print Document"
                    : "Lossless / PNG Embedded"}
                </span>
                {images.length > 0 && (
                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    Est: ~{formatBytes(sizeEstimate.bytes)}
                  </span>
                )}
              </div>

              {/* Quick Quality Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                {[
                  { label: "Compact", val: 60, sub: "Small" },
                  { label: "Standard", val: 80, sub: "Balanced" },
                  { label: "High", val: 92, sub: "Crisp" },
                  { label: "Lossless", val: 100, sub: "PNG" }
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

            {images.length > 0 && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
                <span className="label block mb-2">Live Page Preview (Left ➔ Right Sequence)</span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <div
                      key={img.id}
                      className="relative flex h-28 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-950"
                      style={{ aspectRatio }}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                        style={{ transform: `rotate(${img.rotation}deg)` }}
                      />
                      <span className="absolute bottom-1 right-1 rounded bg-slate-900/80 px-1.5 py-0.2 text-[9px] font-extrabold text-white">
                        {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real-Time Live PDF File Size Indicator Card */}
            {images.length > 0 && (
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
                    <span>Total Input Images:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatBytes(totalInputBytes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-800 dark:text-slate-100">
                    <span className="font-sans font-bold">Estimated Output PDF:</span>
                    <span className="font-extrabold text-sm text-cyan-600 dark:text-cyan-400">
                      ~{formatBytes(sizeEstimate.bytes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span>Quality Level:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {quality}% ({images.length} page{images.length > 1 ? "s" : ""})
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
                            Math.round(
                              (sizeEstimate.bytes / Math.max(1, totalInputBytes)) * 100
                            )
                          )
                        )}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Smaller PDF</span>
                    <span>Images ({formatBytes(totalInputBytes)})</span>
                    <span>Larger</span>
                  </div>
                </div>
              </div>
            )}

            <button
              className="btn-primary w-full py-3"
              disabled={busy || images.length === 0}
              onClick={generate}
            >
              <Download size={16} />
              {busy
                ? "Generating PDF Document..."
                : images.length > 0
                ? `Export ${images.length} Page(s) as PDF (~${formatBytes(sizeEstimate.bytes)})`
                : "Export as PDF"}
            </button>

            {lastGenerated && onShareFile && (
              <button
                type="button"
                onClick={() =>
                  onShareFile({
                    name: lastGenerated.name,
                    blob: lastGenerated.blob,
                    size: lastGenerated.blob.size
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
