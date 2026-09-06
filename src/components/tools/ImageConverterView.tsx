import { useMemo, useState } from "react";
import { ArrowLeftRight, CheckCircle2, Download, QrCode, RefreshCw, Sparkles, Zap } from "lucide-react";
import UploadZone from "../UploadZone";
import { Select } from "../ui/Controls";
import {
  compressOrConvertImage,
  createZipBlob,
  downloadBlob,
  estimateFileSize,
  formatBytes,
  zipAndDownload
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

export type ConvertFormatKey =
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

export interface ConvertFormatDef {
  key: ConvertFormatKey;
  mime: string;
  ext: string;
  label: string;
  isLossless?: boolean;
}

export const CONVERT_FORMATS: ConvertFormatDef[] = [
  { key: "jpg", mime: "image/jpeg", ext: "jpg", label: "JPG (.jpg) — Standard 3-letter" },
  { key: "jpeg", mime: "image/jpeg", ext: "jpeg", label: "JPEG (.jpeg) — Official 4-letter" },
  { key: "jepg", mime: "image/jpeg", ext: "jepg", label: "JEPG (.jepg) — Portal Alias Format" },
  { key: "png", mime: "image/png", ext: "png", label: "PNG (.png) — Lossless, Transparency", isLossless: true },
  { key: "webp", mime: "image/webp", ext: "webp", label: "WebP (.webp) — Modern Web Standard" },
  { key: "tiff", mime: "image/tiff", ext: "tiff", label: "TIFF (.tiff) — Archival Print Master", isLossless: true },
  { key: "bmp", mime: "image/bmp", ext: "bmp", label: "BMP (.bmp) — Bitmap Graphic", isLossless: true },
  { key: "svg", mime: "image/svg+xml", ext: "svg", label: "SVG (.svg) — Scalable Vector Wrapper", isLossless: true },
  { key: "avif", mime: "image/avif", ext: "avif", label: "AVIF (.avif) — Next-Gen AV1 Web" },
  { key: "gif", mime: "image/gif", ext: "gif", label: "GIF (.gif) — Universal 8-bit Graphic" }
];

function outputName(name: string, ext: string) {
  return `${name.replace(/\.[^.]+$/, "")}.${ext}`;
}

const imageAccept =
  "image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/svg+xml,image/avif,image/gif,.jpg,.jpeg,.jepg,.png,.webp,.bmp,.tiff,.tif,.svg,.avif,.gif";
const imageFormats = "JPG, JPEG, JEPG, PNG, WEBP, BMP, TIFF, SVG, AVIF, GIF";

export default function ImageConverterView({
  notify,
  onSwitchViceVersa,
  onShareFile
}: {
  notify: ToastNotify;
  onSwitchViceVersa?: () => void;
  onShareFile?: (file: File) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [targetKey, setTargetKey] = useState<ConvertFormatKey>("png");
  const [quality, setQuality] = useState(92);
  const [outputs, setOutputs] = useState<Array<{ name: string; blob: Blob }>>([]);
  const [busy, setBusy] = useState(false);

  const activeDef = CONVERT_FORMATS.find((f) => f.key === targetKey) || CONVERT_FORMATS[0];

  const handleFilesAdded = (next: File[]) => {
    setFiles((curr) => {
      const combined = [...curr, ...next];
      const first = combined[0];
      if (first) {
        const nameLow = first.name.toLowerCase();
        if (first.type === "image/png" || nameLow.endsWith(".png")) {
          setTargetKey("jpg");
        } else if (
          first.type === "image/jpeg" ||
          nameLow.endsWith(".jpg") ||
          nameLow.endsWith(".jpeg") ||
          nameLow.endsWith(".jepg")
        ) {
          setTargetKey("png");
        } else if (first.type === "image/webp" || nameLow.endsWith(".webp")) {
          setTargetKey("png");
        }
      }
      return combined;
    });
    setOutputs([]);
  };

  // Vice-versa format inverter
  const invertFormat = () => {
    if (targetKey === "png") setTargetKey("jpg");
    else if (targetKey === "jpg" || targetKey === "jpeg" || targetKey === "jepg") setTargetKey("png");
    else if (targetKey === "webp") setTargetKey("png");
    else setTargetKey("png");
  };

  // Live dynamic file size estimation
  const liveEstimate = useMemo(() => {
    if (!files[0]) return null;
    const est = estimateFileSize({
      originalSize: files[0].size,
      quality: quality / 100,
      format: activeDef.mime
    });
    const totalOriginal = files.reduce((acc, f) => acc + f.size, 0);
    const totalEstimated = est.bytes * files.length;
    return {
      est,
      totalOriginal,
      totalEstimated
    };
  }, [files, activeDef, quality]);

  const run = async () => {
    if (!files.length) return notify("Upload or paste one or more images first.", "error");
    setBusy(true);
    try {
      const converted = await Promise.all(
        files.map(async (file) => ({
          name: outputName(file.name, activeDef.ext),
          blob: await compressOrConvertImage(file, activeDef.mime, quality / 100)
        }))
      );
      setOutputs(converted);
      notify(
        `Successfully converted ${converted.length} image(s) to ${activeDef.ext.toUpperCase()}!`,
        "success"
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not convert images.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <span className="font-medium text-slate-700 dark:text-indigo-200">
            Need to shrink and optimize file size with live savings feedback?
          </span>
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

      <div className="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start min-h-0">
      {/* Left Area: Upload & Results */}
      <div className="space-y-6 xl:max-h-[calc(100vh-210px)] xl:overflow-y-auto pr-1">
        <div className="panel">
          <UploadZone
            accept={imageAccept}
            multiple
            files={files}
            formats={imageFormats}
            onFiles={handleFilesAdded}
            onRemove={(index) => {
              setFiles((curr) => curr.filter((_, i) => i !== index));
              setOutputs([]);
            }}
            onClear={() => {
              setFiles([]);
              setOutputs([]);
            }}
            label="Upload images to convert format"
            helperText="Supports JPG, JPEG, JEPG, PNG, WebP, TIFF, BMP, SVG, AVIF, GIF"
          />
        </div>

        {outputs.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              Converted Output ({outputs.length} {outputs.length === 1 ? "image" : "images"})
            </span>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {outputs.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-300 uppercase">
                        {item.name.split(".").pop()?.toUpperCase() || "IMG"}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {formatBytes(item.blob.size)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => downloadBlob(item.blob, item.name)}
                      className="btn-secondary h-8 px-2.5 text-xs font-semibold"
                      title="Download converted image"
                    >
                      <Download size={13} />
                      Save
                    </button>
                    {onShareFile && (
                      <button
                        type="button"
                        onClick={() =>
                          onShareFile(new File([item.blob], item.name, { type: activeDef.mime }))
                        }
                        className="h-8 px-2.5 inline-flex items-center gap-1 rounded-xl border border-indigo-500/30 bg-indigo-50 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 transition"
                        title="Download on mobile via QR code"
                      >
                        <QrCode size={13} />
                        📱 QR
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Area: Controls & Vice-Versa Shortcuts */}
      <div className="space-y-5 xl:sticky xl:top-0 xl:max-h-[calc(100vh-210px)] xl:overflow-y-auto pr-1">
        <div className="panel space-y-5">
          {/* Quick Vice-Versa Switches */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label">1-Click Vice-Versa Conversion</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "JPG ➔ PNG", key: "png" as ConvertFormatKey },
                { label: "PNG ➔ JPG", key: "jpg" as ConvertFormatKey },
                { label: "PNG ➔ JPEG", key: "jpeg" as ConvertFormatKey },
                { label: "PNG ➔ JEPG", key: "jepg" as ConvertFormatKey },
                { label: "PNG ➔ WEBP", key: "webp" as ConvertFormatKey },
                { label: "WEBP ➔ JPG", key: "jpg" as ConvertFormatKey }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setTargetKey(item.key)}
                  className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                    targetKey === item.key
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200/80 pt-4 dark:border-slate-800 space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  label="Target Output Format"
                  value={targetKey}
                  onChange={(val) => setTargetKey(val as ConvertFormatKey)}
                  options={CONVERT_FORMATS.map((f) => ({
                    label: f.label,
                    value: f.key
                  }))}
                />
              </div>
              <button
                type="button"
                onClick={invertFormat}
                className="btn-secondary h-11 px-3 text-xs mb-0.5"
                title="Invert format (Vice-Versa)"
              >
                <ArrowLeftRight size={14} />
              </button>
            </div>

            {!activeDef.isLossless ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="label">{activeDef.ext.toUpperCase()} Quality</span>
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
                  className="w-full accent-cyan-600"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {activeDef.ext.toUpperCase()} is a Lossless Format.
                </span>{" "}
                Every pixel is preserved with 100% mathematical fidelity.
              </div>
            )}

            {/* Live New File Size Indicator Card */}
            {liveEstimate && (
              <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-tr from-cyan-500/10 via-teal-500/5 to-transparent p-4 space-y-2 dark:border-cyan-500/25 dark:bg-slate-900/60">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-cyan-500" />
                    <span>New File Size Indicator</span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-extrabold ${
                      liveEstimate.est.isReduction
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/20 text-amber-600"
                    }`}
                  >
                    {liveEstimate.est.changePercent > 0
                      ? `+${liveEstimate.est.changePercent}% Increase`
                      : `${liveEstimate.est.changePercent}% Reduction`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Original Size:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatBytes(liveEstimate.totalOriginal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Estimated Output:</span>
                  <span className="font-extrabold text-cyan-600 dark:text-cyan-400">
                    ~{formatBytes(liveEstimate.totalEstimated)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            className="btn-primary w-full"
            disabled={busy || files.length === 0}
            onClick={run}
          >
            <RefreshCw size={16} />
            {busy
              ? `Converting to ${activeDef.ext.toUpperCase()}...`
              : `Convert to ${activeDef.ext.toUpperCase()} (${files.length})`}
          </button>

          {outputs.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() =>
                  outputs.length === 1
                    ? downloadBlob(outputs[0].blob, outputs[0].name)
                    : zipAndDownload(outputs, `imagepro-converted-${activeDef.ext}.zip`)
                }
              >
                <Download size={16} />
                Download {outputs.length > 1 ? `ZIP (${outputs.length} files)` : `${activeDef.ext.toUpperCase()} File`}
              </button>
              {onShareFile && (
                <button
                  type="button"
                  onClick={async () => {
                    if (outputs.length === 1) {
                      onShareFile(new File([outputs[0].blob], outputs[0].name, { type: activeDef.mime }));
                    } else {
                      const zipBlob = await createZipBlob(outputs);
                      onShareFile(new File([zipBlob], `imagepro-converted-${activeDef.ext}.zip`, { type: "application/zip" }));
                    }
                  }}
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
