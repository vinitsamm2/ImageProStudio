import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Download,
  Eye,
  FileText,
  Grid,
  Image as ImageIcon,
  QrCode,
  RotateCw,
  Sparkles,
  Type
} from "lucide-react";
import UploadZone from "../UploadZone";
import { NumberField, OptionGrid, Select, TextField } from "../ui/Controls";
import {
  PdfFileInfo,
  WatermarkConfig,
  downloadBlob,
  formatBytes,
  parsePageRanges,
  readPdfInfo,
  watermarkPdf
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

const PRESET_WORDS = [
  "CONFIDENTIAL",
  "DRAFT",
  "DO NOT COPY",
  "SAMPLE",
  "APPROVED",
  "ORIGINAL"
];

const PRESET_COLORS = [
  { label: "Slate Gray", hex: "#64748b" },
  { label: "Crimson Red", hex: "#ef4444" },
  { label: "Cobalt Blue", hex: "#3b82f6" },
  { label: "Emerald Green", hex: "#10b981" },
  { label: "Violet Purple", hex: "#8b5cf6" },
  { label: "Charcoal Dark", hex: "#1e293b" }
];

export default function PdfWatermarkView({
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
  const [info, setInfo] = useState<PdfFileInfo | null>(null);
  const [watermarkedFile, setWatermarkedFile] = useState<File | null>(null);
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");

  // Text watermark state
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(35);
  const [rotation, setRotation] = useState(45);
  const [colorHex, setColorHex] = useState("#64748b");
  const [position, setPosition] = useState<WatermarkConfig["position"]>("center");
  const [pageRange, setPageRange] = useState("all");

  // Image watermark state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");

  const [busy, setBusy] = useState(false);

  const load = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    try {
      const pdf = await readPdfInfo(picked, 8);
      setInfo(pdf);
      setWatermarkedFile(null);
      notify(`Loaded PDF with ${pdf.pages} page(s).`, "info");
    } catch {
      notify("Could not read PDF file.", "error");
    }
  };

  const handleLogoUpload = (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    setLogoFile(picked);
    setLogoUrl(URL.createObjectURL(picked));
    notify("Logo watermark image loaded!", "info");
  };

  const run = async () => {
    if (!info) return notify("Upload a PDF document first.", "error");
    if (watermarkType === "text" && !text.trim()) return notify("Please enter watermark text.", "error");
    if (watermarkType === "image" && !logoFile) return notify("Please upload a watermark logo image.", "error");

    setBusy(true);
    try {
      const pages = pageRange.toLowerCase() === "all" ? [] : parsePageRanges(pageRange, info.pages);
      const blob = await watermarkPdf(info.file, {
        type: watermarkType,
        text,
        imageBlob: logoFile || undefined,
        fontSize,
        opacity: opacity / 100,
        rotation,
        colorHex,
        position,
        pages
      });
      const generated = new File([blob], `${info.file.name.replace(/\.pdf$/i, "")}-watermarked.pdf`, { type: "application/pdf" });
      setWatermarkedFile(generated);
      downloadBlob(blob, `${info.file.name.replace(/\.pdf$/i, "")}-watermarked.pdf`);
      notify("Watermark successfully applied & PDF downloaded!", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not apply watermark.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <span className="font-medium text-slate-700 dark:text-indigo-200">
            Need to sign or add electronic signatures instead of a watermark?
          </span>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-white px-3 py-1.5 font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300"
          >
            <ArrowLeftRight size={13} />
            Switch to Sign PDF
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start xl:h-full min-h-0">
      {/* Left Area: Upload & Real-Time Live Preview */}
      <div className="space-y-6 xl:h-full xl:max-h-[calc(100vh-175px)] xl:overflow-y-auto overscroll-contain pr-1">
        <div className="panel">
          <UploadZone
            accept="application/pdf"
            files={info ? [info.file] : []}
            formats="PDF"
            onFiles={load}
            onRemove={() => {
              setInfo(null);
            }}
            label="Upload PDF to add watermark"
            helperText="Stamp text or graphic logos over document pages with live preview"
          />
        </div>

        {info && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye size={14} className="text-cyan-500" />
                <span>Live Page Preview (Page 1)</span>
              </span>
              <span className="font-mono text-xs text-slate-400">
                Shows exact watermark appearance
              </span>
            </div>

            {/* Interactive Preview Canvas */}
            <div className="relative mx-auto flex max-h-[550px] w-full max-w-[500px] items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/30 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {info.thumbnails[0] ? (
                <div className="relative h-full w-full flex items-center justify-center">
                  <img
                    src={info.thumbnails[0]}
                    alt="Page 1 Preview"
                    className="max-h-[500px] max-w-full object-contain rounded-lg shadow-sm"
                  />

                  {/* Watermark Overlay Simulation */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                    {watermarkType === "text" && text && (
                      position === "tile" ? (
                        <div
                          className="absolute inset-0 flex flex-wrap items-center justify-center gap-16"
                          style={{
                            opacity: opacity / 100,
                            transform: `rotate(${rotation}deg)`
                          }}
                        >
                          {[...Array(6)].map((_, i) => (
                            <span
                              key={i}
                              style={{
                                color: colorHex,
                                fontSize: `${Math.max(16, fontSize * 0.4)}px`,
                                fontWeight: "bold"
                              }}
                              className="font-sans select-none tracking-wider"
                            >
                              {text}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div
                          className={`absolute flex p-6 ${
                            position === "top-left"
                              ? "top-0 left-0"
                              : position === "top-right"
                              ? "top-0 right-0"
                              : position === "bottom-left"
                              ? "bottom-0 left-0"
                              : position === "bottom-right"
                              ? "bottom-0 right-0"
                              : "inset-0 items-center justify-center"
                          }`}
                        >
                          <span
                            style={{
                              color: colorHex,
                              opacity: opacity / 100,
                              transform: `rotate(${rotation}deg)`,
                              fontSize: `${Math.max(18, fontSize * 0.55)}px`,
                              fontWeight: "bold"
                            }}
                            className="font-sans select-none tracking-wider whitespace-nowrap"
                          >
                            {text}
                          </span>
                        </div>
                      )
                    )}

                    {watermarkType === "image" && logoUrl && (
                      <div
                        className={`absolute flex p-6 ${
                          position === "top-left"
                            ? "top-0 left-0"
                            : position === "top-right"
                            ? "top-0 right-0"
                            : position === "bottom-left"
                            ? "bottom-0 left-0"
                            : position === "bottom-right"
                            ? "bottom-0 right-0"
                            : "inset-0 items-center justify-center"
                        }`}
                      >
                        <img
                          src={logoUrl}
                          alt="Logo Watermark"
                          style={{
                            opacity: opacity / 100,
                            transform: `rotate(${rotation}deg)`,
                            maxWidth: "160px",
                            maxHeight: "160px"
                          }}
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Loading document preview...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Area: Watermark Controls & Settings */}
      <div className="space-y-5 xl:h-full xl:max-h-[calc(100vh-175px)] xl:overflow-y-auto overscroll-contain pr-1">
        <div className="panel space-y-5">
          {/* Watermark Type Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label">Watermark Type</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWatermarkType("text")}
                className={`rounded-xl border p-2.5 text-center text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  watermarkType === "text"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 shadow-xs"
                    : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <Type size={14} />
                <span>Text Stamp</span>
              </button>
              <button
                type="button"
                onClick={() => setWatermarkType("image")}
                className={`rounded-xl border p-2.5 text-center text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  watermarkType === "image"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 shadow-xs"
                    : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <ImageIcon size={14} />
                <span>Logo Image</span>
              </button>
            </div>
          </div>

          {watermarkType === "text" ? (
            <div className="space-y-4">
              <TextField
                label="Watermark Text"
                value={text}
                onChange={setText}
                placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
              />

              {/* Quick Word Presets */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Presets
                </span>
                <div className="flex flex-wrap gap-1">
                  {PRESET_WORDS.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => setText(word)}
                      className={`rounded-lg border px-2 py-0.5 text-[11px] font-bold transition ${
                        text === word
                          ? "border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                          : "border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div className="space-y-1.5">
                <span className="label block">Watermark Color</span>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColorHex(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        colorHex === c.hex
                          ? "scale-110 ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-slate-900"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <OptionGrid>
                <NumberField
                  label="Font Size"
                  value={fontSize}
                  onChange={setFontSize}
                  min={12}
                  max={120}
                  suffix="px"
                />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="label">Rotation</span>
                    <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      {rotation}°
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={-90}
                      max={90}
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-full accent-cyan-600"
                    />
                  </div>
                </div>
              </OptionGrid>
            </div>
          ) : (
            <div className="space-y-4">
              <UploadZone
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                files={logoFile ? [logoFile] : []}
                formats="PNG, JPG, SVG"
                onFiles={handleLogoUpload}
                onRemove={() => {
                  setLogoFile(null);
                  setLogoUrl("");
                }}
                label="Upload logo or watermark stamp"
                helperText="Transparent PNG is recommended"
              />
            </div>
          )}

          {/* Opacity Slider */}
          <div className="space-y-1.5 border-t border-slate-200/80 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="label">Transparency / Opacity</span>
              <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                {opacity}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </div>

          {/* Position Selector */}
          <div className="space-y-2 border-t border-slate-200/80 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="label">Placement Position</span>
              <span className="font-mono text-[11px] text-slate-400 uppercase">
                {position}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "top-left", label: "Top Left" },
                { id: "center", label: "Center" },
                { id: "top-right", label: "Top Right" },
                { id: "bottom-left", label: "Bottom Left" },
                { id: "tile", label: "Repeat Tile" },
                { id: "bottom-right", label: "Bottom Right" }
              ].map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setPosition(pos.id as any)}
                  className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                    position === pos.id
                      ? "border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <TextField
            label="Page Range"
            value={pageRange}
            onChange={setPageRange}
            placeholder="all or e.g. 1-3, 5"
            helper="Type 'all' to stamp every page, or specify ranges"
          />

          <button
            className="btn-primary w-full"
            disabled={busy || !info}
            onClick={run}
          >
            <Download size={16} />
            {busy ? "Applying Watermark..." : "Stamp Watermark & Download PDF"}
          </button>

          {watermarkedFile && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => downloadBlob(watermarkedFile, watermarkedFile.name)}
                className="btn-secondary w-full py-2.5 text-xs font-bold"
              >
                <Download size={14} />
                Download Watermarked PDF Again
              </button>
              {onShareFile && (
                <button
                  type="button"
                  onClick={() => onShareFile(watermarkedFile)}
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
