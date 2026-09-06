import { useState } from "react";
import { ArrowLeftRight, Download, Expand, QrCode, Sparkles } from "lucide-react";
import UploadZone from "../UploadZone";
import { NumberField, OptionGrid, Select } from "../ui/Controls";
import {
  ImageItem,
  Unit,
  convertLength,
  createImageItem,
  downloadBlob,
  expandCanvas
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;
type ExpandAlign = "all sides" | "top" | "bottom" | "left" | "right";

const imageAccept =
  "image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/svg+xml,image/avif,image/gif,.jpg,.jpeg,.jepg,.png,.webp,.bmp,.tiff,.tif,.svg,.avif,.gif";
const imageFormats = "JPG, JPEG, JEPG, PNG, WEBP, BMP, TIFF, SVG, AVIF, GIF";

export default function CanvasExtenderView({
  notify,
  onSwitchViceVersa,
  onShareFile
}: {
  notify: ToastNotify;
  onSwitchViceVersa?: () => void;
  onShareFile?: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [extendedFile, setExtendedFile] = useState<File | null>(null);
  const [source, setSource] = useState<ImageItem | null>(null);
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(1200);
  const [unit, setUnit] = useState<Unit>("px");
  const [dpi, setDpi] = useState(300);
  const [align, setAlign] = useState<ExpandAlign>("all sides");
  const [background, setBackground] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    try {
      const image = await createImageItem(picked);
      setFile(picked);
      setSource(image);
      setWidth(image.width + 200);
      setHeight(image.height + 200);
      setUrl("");
      setExtendedFile(null);
      notify("Image loaded for extension!", "info");
    } catch {
      notify("Failed to load image.", "error");
    }
  };

  const swapDimensions = () => {
    const temp = width;
    setWidth(height);
    setHeight(temp);
  };

  const addPadding = (amount: number) => {
    if (!source) return;
    setWidth(source.width + amount * 2);
    setHeight(source.height + amount * 2);
  };

  const run = async () => {
    if (!file) return notify("Upload or paste an image first.", "error");
    setBusy(true);
    try {
      const targetWidth = unit === "px" ? width : convertLength(width, unit, "px", dpi);
      const targetHeight = unit === "px" ? height : convertLength(height, unit, "px", dpi);
      const blob = await expandCanvas(
        file,
        targetWidth,
        targetHeight,
        background,
        transparent,
        align
      );
      const newUrl = URL.createObjectURL(blob);
      setUrl(newUrl);
      const outName = transparent ? "imagepro-expanded.png" : "imagepro-expanded.jpg";
      const outMime = transparent ? "image/png" : "image/jpeg";
      const generated = new File([blob], outName, { type: outMime });
      setExtendedFile(generated);
      downloadBlob(blob, outName);
      notify("Canvas extended and image downloaded!", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not expand canvas.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <span className="font-medium text-slate-700 dark:text-indigo-200">
            Need to resize and scale image dimensions instead of extending canvas padding?
          </span>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-white px-3 py-1.5 font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300"
          >
            <ArrowLeftRight size={13} />
            Switch to Image Resizer
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start xl:h-full min-h-0">
      {/* Left: Upload & Canvas Preview */}
      <div className="space-y-6 xl:h-full xl:max-h-[calc(100vh-175px)] xl:overflow-y-auto overscroll-contain pr-1">
        <div className="panel">
          <UploadZone
            accept={imageAccept}
            files={file ? [file] : []}
            formats={imageFormats}
            onFiles={load}
            onRemove={() => {
              setFile(null);
              setSource(null);
              setUrl("");
            }}
            label="Upload image to expand canvas"
            helperText="Add padding or borders around your image"
          />
        </div>

        {source && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Expanded Canvas Preview
              </span>
              <span className="font-mono text-xs text-slate-400">
                Target: {width} x {height} {unit}
              </span>
            </div>
            <div className="checkerboard flex h-80 items-center justify-center p-6">
              <div
                className="relative flex items-center justify-center shadow-md transition-all"
                style={{
                  backgroundColor: transparent ? "transparent" : background,
                  aspectRatio: `${width}/${height}`,
                  maxHeight: "100%",
                  maxWidth: "100%"
                }}
              >
                <img
                  src={url || source.url}
                  alt="Expanded"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Dimension & Color Controls */}
      <div className="space-y-5 xl:h-full xl:max-h-[calc(100vh-175px)] xl:overflow-y-auto overscroll-contain pr-1">
        <div className="panel space-y-5">
          <div className="flex items-center justify-between">
            <span className="label">Quick Padding Presets</span>
            <button
              type="button"
              onClick={swapDimensions}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              title="Swap Width and Height"
            >
              ⇄ Swap W/H
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[25, 50, 100, 200].map((pad) => (
              <button
                key={pad}
                type="button"
                onClick={() => addPadding(pad)}
                className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-xs font-bold text-slate-700 hover:border-cyan-400 hover:bg-cyan-50/40 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
              >
                +{pad}px
              </button>
            ))}
          </div>

          <OptionGrid>
            <Select
              label="Units"
              value={unit}
              onChange={(v) => setUnit(v as Unit)}
              options={["px", "mm", "cm", "in"]}
            />
            <NumberField
              label="DPI Resolution"
              value={dpi}
              onChange={setDpi}
              min={1}
              suffix="DPI"
            />
          </OptionGrid>

          <OptionGrid>
            <NumberField
              label={`Target Width (${unit})`}
              value={width}
              onChange={setWidth}
              min={1}
            />
            <NumberField
              label={`Target Height (${unit})`}
              value={height}
              onChange={setHeight}
              min={1}
            />
          </OptionGrid>

          <Select
            label="Alignment / Anchor"
            value={align}
            onChange={(v) => setAlign(v as ExpandAlign)}
            options={[
              { label: "Center (Equal all sides)", value: "all sides" },
              { label: "Top (Add to bottom)", value: "top" },
              { label: "Bottom (Add to top)", value: "bottom" },
              { label: "Left (Add to right)", value: "left" },
              { label: "Right (Add to left)", value: "right" }
            ]}
          />

          <div className="space-y-2">
            <span className="label block">Background Fill</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={background}
                disabled={transparent}
                onChange={(e) => {
                  setBackground(e.target.value);
                  setTransparent(false);
                }}
                className="h-10 w-14 cursor-pointer rounded-xl border border-slate-200 bg-transparent dark:border-slate-800 disabled:opacity-30"
              />
              <input
                className="field font-mono text-xs"
                value={background}
                disabled={transparent}
                onChange={(e) => {
                  setBackground(e.target.value);
                  setTransparent(false);
                }}
                placeholder="#ffffff"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                className="btn-secondary py-1.5 text-xs"
                onClick={() => {
                  setBackground("#ffffff");
                  setTransparent(false);
                }}
              >
                White
              </button>
              <button
                type="button"
                className="btn-secondary py-1.5 text-xs"
                onClick={() => {
                  setBackground("#000000");
                  setTransparent(false);
                }}
              >
                Black
              </button>
              <button
                type="button"
                className={`btn-secondary py-1.5 text-xs ${
                  transparent ? "border-cyan-500 text-cyan-600 dark:border-cyan-400" : ""
                }`}
                onClick={() => setTransparent(!transparent)}
              >
                {transparent ? "Transparent ✓" : "Transparent"}
              </button>
            </div>
          </div>

          <button
            className="btn-primary w-full"
            disabled={busy || !file}
            onClick={run}
          >
            <Download size={16} />
            {busy ? "Extending..." : "Download Expanded Image"}
          </button>

          {extendedFile && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => downloadBlob(extendedFile, extendedFile.name)}
                className="btn-secondary w-full py-2.5 text-xs font-bold"
              >
                <Download size={14} />
                Download Expanded Image Again
              </button>
              {onShareFile && (
                <button
                  type="button"
                  onClick={() => onShareFile(extendedFile)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 py-2.5 px-3 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition shadow-sm"
                >
                  <QrCode size={14} className="text-indigo-600 dark:text-indigo-400" />
                  📱 Download on Mobile via QR Code / Share
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
