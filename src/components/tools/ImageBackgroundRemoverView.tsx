import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Columns,
  Download,
  Eye,
  Layers,
  Maximize2,
  Paintbrush,
  Palette,
  Pipette,
  QrCode,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Scissors,
  ShieldCheck,
  Sliders,
  Sparkles,
  Undo2,
  Redo2,
  Wand2,
  X,
  Zap
} from "lucide-react";
import UploadZone from "../UploadZone";
import { formatBytes, downloadBlob } from "../../lib/files";
import {
  processBackgroundRemoval,
  samplePerimeterColor,
  applyBrushStroke,
  renderCompositeToCanvas,
  ColorRGB,
  RemoveBackgroundOptions,
  BackdropConfig
} from "../../lib/backgroundRemoval";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

interface PresetColor {
  id: string;
  name: string;
  color: string;
  badge?: string;
  textColor?: string;
}

const BACKDROP_PRESETS: PresetColor[] = [
  { id: "white", name: "Pure White", color: "#ffffff", badge: "UPSC / Passport", textColor: "text-slate-900" },
  { id: "offwhite", name: "Off-White", color: "#f3f4f6", badge: "Formal", textColor: "text-slate-800" },
  { id: "lightblue", name: "Sky Blue", color: "#e0f2fe", badge: "Visa", textColor: "text-blue-900" },
  { id: "visablue", name: "Royal Blue", color: "#0284c7", badge: "ID Card", textColor: "text-white" },
  { id: "grey", name: "Studio Grey", color: "#475569", badge: "Portrait", textColor: "text-white" },
  { id: "cream", name: "Soft Beige", color: "#fef3c7", textColor: "text-amber-900" }
];

const GRADIENT_PRESETS = [
  { id: "navy", name: "Deep Navy", from: "#0f172a", to: "#1e293b" },
  { id: "sky", name: "Vibrant Cyan", from: "#0284c7", to: "#38bdf8" },
  { id: "sunset", name: "Warm Sunset", from: "#7c2d12", to: "#f97316" }
];

export default function ImageBackgroundRemoverView({
  notify,
  initialFiles,
  onSwitchToResizer,
  onSwitchToCompressor,
  onShareFile
}: {
  notify: ToastNotify;
  initialFiles?: File[];
  onSwitchToResizer?: (file: File) => void;
  onSwitchToCompressor?: (file: File) => void;
  onShareFile?: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  // Settings
  const [tolerance, setTolerance] = useState(24);
  const [feather, setFeather] = useState(2);
  const [contiguous, setContiguous] = useState(true);
  const [despill, setDespill] = useState(true);
  const [targetColor, setTargetColor] = useState<ColorRGB>({ r: 255, g: 255, b: 255 });
  const [eyedropperActive, setEyedropperActive] = useState(false);

  // Backdrop options
  const [backdropType, setBackdropType] = useState<"transparent" | "color" | "gradient">("transparent");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0]);
  const [customHex, setCustomHex] = useState("#ffffff");

  // Touchup Brush
  const [activeTab, setActiveTab] = useState<"smart" | "brush" | "backdrop">("smart");
  const [brushMode, setBrushMode] = useState<"erase" | "restore">("erase");
  const [brushRadius, setBrushRadius] = useState(25);
  const [isBrushing, setIsBrushing] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState<"split" | "side" | "result">("split");
  const [splitPos, setSplitPos] = useState(50);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Image buffers stored in memory
  const originalImageDataRef = useRef<ImageData | null>(null);
  const currentCutoutDataRef = useRef<ImageData | null>(null);
  const undoHistoryRef = useRef<ImageData[]>([]);
  const redoHistoryRef = useRef<ImageData[]>([]);

  // Canvas refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Load Image into Canvas & initialize
  const loadImage = useCallback((picked: File) => {
    setFile(picked);
    const img = new Image();
    const url = URL.createObjectURL(picked);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      setImageSize({ width, height });

      // Draw original image into offscreen canvas to get ImageData
      const offCanvas = document.createElement("canvas");
      offCanvas.width = width;
      offCanvas.height = height;
      const ctx = offCanvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const origData = ctx.getImageData(0, 0, width, height);
      originalImageDataRef.current = origData;

      // Auto-sample perimeter color
      const sampled = samplePerimeterColor(origData);
      setTargetColor(sampled);

      // Initial run
      runMatting(origData, sampled, 24, 2, true, true);
    };

    img.src = url;
  }, []);

  const runMatting = (
    origData: ImageData,
    color: ColorRGB,
    tol: number,
    feath: number,
    contig: boolean,
    desp: boolean
  ) => {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const cutout = processBackgroundRemoval(origData, {
          targetColor: color,
          tolerance: tol,
          feather: feath,
          contiguous: contig,
          despill: desp
        });

        currentCutoutDataRef.current = cutout;
        undoHistoryRef.current = [cutout];
        redoHistoryRef.current = [];
        renderToDisplay();
      } catch (err) {
        console.error("Matting error:", err);
      } finally {
        setIsProcessing(false);
      }
    }, 10);
  };

  // Re-run matting when slider settings change
  const handleApplySettings = () => {
    if (!originalImageDataRef.current) return;
    runMatting(originalImageDataRef.current, targetColor, tolerance, feather, contiguous, despill);
  };

  // Render composite to display canvas
  const renderToDisplay = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !currentCutoutDataRef.current) return;

    const cutout = currentCutoutDataRef.current;
    const { width, height } = cutout;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background
    if (backdropType === "color") {
      ctx.fillStyle = selectedColor;
      ctx.fillRect(0, 0, width, height);
    } else if (backdropType === "gradient") {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, selectedGradient.from);
      grad.addColorStop(1, selectedGradient.to);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Clear for transparent
      ctx.clearRect(0, 0, width, height);
    }

    // Draw Cutout
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.putImageData(cutout, 0, 0);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }, [backdropType, selectedColor, selectedGradient]);

  useEffect(() => {
    renderToDisplay();
  }, [renderToDisplay]);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      loadImage(initialFiles[0]);
    }
  }, [initialFiles, loadImage]);

  // Eyedropper / Click to pick background color
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!originalImageDataRef.current || !previewCanvasRef.current) return;
    if (!eyedropperActive) return;

    const canvas = previewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      const orig = originalImageDataRef.current.data;
      const idx = (y * canvas.width + x) * 4;
      const picked: ColorRGB = {
        r: orig[idx],
        g: orig[idx + 1],
        b: orig[idx + 2]
      };
      setTargetColor(picked);
      setEyedropperActive(false);
      notify(`Sampled color: rgb(${picked.r}, ${picked.g}, ${picked.b}). Re-analyzing...`, "info");
      runMatting(originalImageDataRef.current, picked, tolerance, feather, contiguous, despill);
    }
  };

  // Brush Event Handlers
  const handleBrushStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== "brush" || !currentCutoutDataRef.current || !originalImageDataRef.current) return;
    setIsBrushing(true);
    applyBrushAtEvent(e);
  };

  const handleBrushMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isBrushing || activeTab !== "brush") return;
    applyBrushAtEvent(e);
  };

  const handleBrushEnd = () => {
    if (isBrushing) {
      setIsBrushing(false);
      // Save state to undo history
      if (currentCutoutDataRef.current) {
        const copy = new ImageData(
          new Uint8ClampedArray(currentCutoutDataRef.current.data),
          currentCutoutDataRef.current.width,
          currentCutoutDataRef.current.height
        );
        undoHistoryRef.current.push(copy);
        redoHistoryRef.current = [];
      }
    }
  };

  const applyBrushAtEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !currentCutoutDataRef.current || !originalImageDataRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    applyBrushStroke(
      currentCutoutDataRef.current,
      originalImageDataRef.current,
      x,
      y,
      brushRadius,
      brushMode
    );
    renderToDisplay();
  };

  // Undo / Redo
  const handleUndo = () => {
    if (undoHistoryRef.current.length > 1) {
      const current = undoHistoryRef.current.pop()!;
      redoHistoryRef.current.push(current);
      const prev = undoHistoryRef.current[undoHistoryRef.current.length - 1];
      currentCutoutDataRef.current = new ImageData(
        new Uint8ClampedArray(prev.data),
        prev.width,
        prev.height
      );
      renderToDisplay();
    }
  };

  const handleRedo = () => {
    if (redoHistoryRef.current.length > 0) {
      const next = redoHistoryRef.current.pop()!;
      undoHistoryRef.current.push(next);
      currentCutoutDataRef.current = new ImageData(
        new Uint8ClampedArray(next.data),
        next.width,
        next.height
      );
      renderToDisplay();
    }
  };

  // Downloads
  const downloadPng = () => {
    if (!currentCutoutDataRef.current || !file) return;
    const canvas = renderCompositeToCanvas(currentCutoutDataRef.current, { type: "transparent" });
    canvas.toBlob((blob) => {
      if (blob) {
        const outName = `${file.name.replace(/\.[^/.]+$/, "")}-no-bg.png`;
        downloadBlob(blob, outName);
        notify("Transparent PNG downloaded successfully!", "success");
      }
    }, "image/png");
  };

  const downloadJpgWithBackdrop = () => {
    if (!currentCutoutDataRef.current || !file) return;
    const canvas = renderCompositeToCanvas(currentCutoutDataRef.current, {
      type: backdropType === "transparent" ? "color" : backdropType,
      color: backdropType === "transparent" ? "#ffffff" : selectedColor,
      gradient: selectedGradient
    });

    canvas.toBlob((blob) => {
      if (blob) {
        const outName = `${file.name.replace(/\.[^/.]+$/, "")}-studio-bg.jpg`;
        downloadBlob(blob, outName);
        notify("Photo with custom backdrop downloaded!", "success");
      }
    }, "image/jpeg", 0.95);
  };

  const sendToResizer = () => {
    if (!currentCutoutDataRef.current || !file || !onSwitchToResizer) return;
    const canvas = renderCompositeToCanvas(currentCutoutDataRef.current, {
      type: backdropType,
      color: selectedColor,
      gradient: selectedGradient
    });
    canvas.toBlob((blob) => {
      if (blob) {
        const gen = new File([blob], `${file.name.replace(/\.[^/.]+$/, "")}-cutout.png`, {
          type: "image/png"
        });
        onSwitchToResizer(gen);
      }
    }, "image/png");
  };

  const sendToCompressor = () => {
    if (!currentCutoutDataRef.current || !file || !onSwitchToCompressor) return;
    const canvas = renderCompositeToCanvas(currentCutoutDataRef.current, {
      type: backdropType,
      color: selectedColor,
      gradient: selectedGradient
    });
    canvas.toBlob((blob) => {
      if (blob) {
        const gen = new File([blob], `${file.name.replace(/\.[^/.]+$/, "")}-cutout.jpg`, {
          type: "image/jpeg"
        });
        onSwitchToCompressor(gen);
      }
    }, "image/jpeg", 0.95);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-pink-500/20 bg-pink-500/5 p-3 text-xs dark:bg-pink-950/20">
        <span className="font-medium text-slate-700 dark:text-pink-200">
          Need official 35×45mm dimensions for exam or passport portals?
        </span>
        <button
          type="button"
          onClick={() => {
            if (file && onSwitchToResizer) {
              sendToResizer();
            } else if (onSwitchToResizer) {
              // Switch directly
            }
          }}
          className="btn-secondary h-8 gap-1.5 px-3 text-xs font-bold cursor-pointer"
        >
          <ArrowLeftRight size={13} />
          <span>Switch to Image Resizer</span>
        </button>
      </div>

      {!file ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white shadow-md shadow-pink-500/20">
                <Scissors size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Remove Background
                  </h2>
                  <span className="rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-600 dark:text-pink-400">
                    Smart Matting Studio
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Isolate subjects from photos, signatures, and portraits in 1 click. Replace with transparent PNG, passport white (UPSC/SSC), visa blue, or studio colors.
                </p>
              </div>
            </div>
          </div>

          <UploadZone
            accept="image/*"
            formats="JPG, PNG, WebP, HEIC, BMP"
            files={[]}
            onFiles={(files) => files[0] && loadImage(files[0])}
            multiple={false}
            label="Drag & Drop Image or Click to Browse"
            helperText="100% private in-browser edge matting — zero bytes ever leave your device"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-xs">
                    {file.name}
                  </h3>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {formatBytes(file.size)}
                  </span>
                  {imageSize && (
                    <span className="rounded-full bg-pink-50 dark:bg-pink-950/50 px-2 py-0.5 text-[10px] font-bold text-pink-600 dark:text-pink-400">
                      {imageSize.width} × {imageSize.height} px
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {isProcessing ? "Processing edge segmentation..." : "Ready for export or backdrop replacement"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode("split")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    viewMode === "split"
                      ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                  title="Before / After Split Slider"
                >
                  Split
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("result")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    viewMode === "result"
                      ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                  title="Cutout View"
                >
                  Result
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setImageSize(null);
                  originalImageDataRef.current = null;
                  currentCutoutDataRef.current = null;
                  undoHistoryRef.current = [];
                  redoHistoryRef.current = [];
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:border-white/[0.1] dark:bg-slate-800 dark:text-slate-300 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <X size={14} />
                <span>Change Image</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Studio Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Center Canvas Workspace (Col 8) */}
            <div className="lg:col-span-8 space-y-4">
              <div
                ref={canvasContainerRef}
                className="relative rounded-3xl border border-slate-200/80 bg-slate-100/80 p-4 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 min-h-[460px] flex items-center justify-center overflow-hidden"
              >
                {/* Checkerboard Pattern for Transparency */}
                <div
                  className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-300 dark:border-slate-800 max-h-[580px] max-w-full flex items-center justify-center"
                  style={{
                    backgroundImage:
                      backdropType === "transparent"
                        ? "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)"
                        : "none",
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                    backgroundColor:
                      backdropType === "transparent" ? "#ffffff" : "transparent"
                  }}
                >
                  <canvas
                    ref={previewCanvasRef}
                    onClick={handleCanvasClick}
                    onMouseDown={handleBrushStart}
                    onMouseMove={handleBrushMove}
                    onMouseUp={handleBrushEnd}
                    onMouseLeave={handleBrushEnd}
                    className={`max-h-[560px] max-w-full object-contain ${
                      eyedropperActive
                        ? "cursor-crosshair"
                        : activeTab === "brush"
                        ? "cursor-cell"
                        : "cursor-default"
                    }`}
                  />

                  {/* Split Comparison Slider Overlay */}
                  {viewMode === "split" && originalImageDataRef.current && (
                    <div
                      className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none border-r-2 border-white shadow-2xl"
                      style={{ width: `${splitPos}%` }}
                    >
                      <img
                        src={file ? URL.createObjectURL(file) : ""}
                        alt="Original"
                        className="max-h-[560px] max-w-none h-full object-contain"
                        style={{
                          width: previewCanvasRef.current ? previewCanvasRef.current.clientWidth : "auto"
                        }}
                      />
                    </div>
                  )}

                  {/* Split Slider Handle */}
                  {viewMode === "split" && (
                    <div
                      className="absolute inset-y-0 flex items-center justify-center pointer-events-none"
                      style={{ left: `calc(${splitPos}% - 14px)` }}
                    >
                      <div className="h-8 w-8 rounded-full bg-white shadow-lg border border-slate-300 flex items-center justify-center text-slate-700">
                        <Columns size={14} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Eyedropper Notice */}
                {eyedropperActive && (
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-2xl bg-slate-900/90 text-white px-3.5 py-2 text-xs font-bold shadow-lg animate-pulse backdrop-blur-md">
                    <Pipette size={14} className="text-cyan-400" />
                    <span>Click anywhere on the preview to sample that background color</span>
                    <button
                      type="button"
                      onClick={() => setEyedropperActive(false)}
                      className="ml-2 rounded-lg bg-white/20 p-1 hover:bg-white/30 text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Split Position Range Slider (Only visible in Split mode) */}
              {viewMode === "split" && (
                <div className="flex items-center gap-3 px-2">
                  <span className="text-xs font-bold text-slate-500">Original</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={splitPos}
                    onChange={(e) => setSplitPos(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-600"
                  />
                  <span className="text-xs font-bold text-pink-600 dark:text-pink-400">Cutout</span>
                </div>
              )}
            </div>

            {/* Right Settings Studio Panel (Col 4) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 space-y-5">
                {/* Tab Navigation */}
                <div className="flex items-center border-b border-slate-100 pb-3 dark:border-white/[0.06] gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("smart");
                      setEyedropperActive(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      activeTab === "smart"
                        ? "bg-pink-500/10 text-pink-600 dark:text-pink-400"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <Wand2 size={14} />
                    <span>Smart Matting</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("brush");
                      setEyedropperActive(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      activeTab === "brush"
                        ? "bg-pink-500/10 text-pink-600 dark:text-pink-400"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <Paintbrush size={14} />
                    <span>Touchup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("backdrop");
                      setEyedropperActive(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      activeTab === "backdrop"
                        ? "bg-pink-500/10 text-pink-600 dark:text-pink-400"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <Palette size={14} />
                    <span>Backdrop</span>
                  </button>
                </div>

                {/* TAB 1: Smart Matting Settings */}
                {activeTab === "smart" && (
                  <div className="space-y-4">
                    {/* Mode: Contiguous vs Global */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Isolation Mode
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setContiguous(true);
                            if (originalImageDataRef.current) {
                              runMatting(originalImageDataRef.current, targetColor, tolerance, feather, true, despill);
                            }
                          }}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            contiguous
                              ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300"
                              : "border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <div className="font-bold text-xs">Edge Floodfill</div>
                          <div className="text-[10px] opacity-75">Portraits & Exam Photos</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setContiguous(false);
                            if (originalImageDataRef.current) {
                              runMatting(originalImageDataRef.current, targetColor, tolerance, feather, false, despill);
                            }
                          }}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            !contiguous
                              ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300"
                              : "border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <div className="font-bold text-xs">Global Color</div>
                          <div className="text-[10px] opacity-75">Signatures & Logos</div>
                        </button>
                      </div>
                    </div>

                    {/* Target Color & Eyedropper */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Background Color</span>
                        <button
                          type="button"
                          onClick={() => setEyedropperActive(!eyedropperActive)}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                            eyedropperActive
                              ? "bg-cyan-600 text-white border-cyan-600"
                              : "border-slate-200 dark:border-white/[0.1] text-cyan-600 dark:text-cyan-400"
                          }`}
                        >
                          <Pipette size={12} />
                          <span>{eyedropperActive ? "Click on Photo" : "Eyedropper"}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-800/40">
                        <div
                          className="h-6 w-6 rounded-lg border border-slate-300 shadow-xs"
                          style={{
                            backgroundColor: `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`
                          }}
                        />
                        <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                          RGB({targetColor.r}, {targetColor.g}, {targetColor.b})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (originalImageDataRef.current) {
                              const sampled = samplePerimeterColor(originalImageDataRef.current);
                              setTargetColor(sampled);
                              runMatting(originalImageDataRef.current, sampled, tolerance, feather, contiguous, despill);
                            }
                          }}
                          className="ml-auto text-[11px] text-pink-600 dark:text-pink-400 hover:underline font-bold cursor-pointer"
                        >
                          Auto Detect
                        </button>
                      </div>
                    </div>

                    {/* Tolerance Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Color Sensitivity (Tolerance)</span>
                        <span className="text-pink-600 dark:text-pink-400">{tolerance}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="85"
                        value={tolerance}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTolerance(val);
                          if (originalImageDataRef.current) {
                            runMatting(originalImageDataRef.current, targetColor, val, feather, contiguous, despill);
                          }
                        }}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Strict (5%)</span>
                        <span>Balanced (25%)</span>
                        <span>Aggressive (80%)</span>
                      </div>
                    </div>

                    {/* Edge Feathering Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Edge Smoothing (Feather)</span>
                        <span className="text-pink-600 dark:text-pink-400">{feather} px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        value={feather}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFeather(val);
                          if (originalImageDataRef.current) {
                            runMatting(originalImageDataRef.current, targetColor, tolerance, val, contiguous, despill);
                          }
                        }}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-600"
                      />
                    </div>

                    {/* Defringe Checkbox */}
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={despill}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setDespill(val);
                          if (originalImageDataRef.current) {
                            runMatting(originalImageDataRef.current, targetColor, tolerance, feather, contiguous, val);
                          }
                        }}
                        className="h-4 w-4 rounded text-pink-600 focus:ring-pink-500 border-slate-300 dark:border-slate-700"
                      />
                      <span>Remove Color Halo (Despill / Anti-Fringe)</span>
                    </label>
                  </div>
                )}

                {/* TAB 2: Precision Touchup Brush */}
                {activeTab === "brush" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Paint directly on the image above to fine-tune edges, hair, or remove background leftovers.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBrushMode("erase")}
                        className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          brushMode === "erase"
                            ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <Scissors size={14} />
                        <span>Erase Background</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBrushMode("restore")}
                        className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          brushMode === "restore"
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <RotateCcw size={14} />
                        <span>Restore Subject</span>
                      </button>
                    </div>

                    {/* Brush Size Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Brush Size</span>
                        <span className="text-pink-600 dark:text-pink-400">{brushRadius * 2} px</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="70"
                        value={brushRadius}
                        onChange={(e) => setBrushRadius(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-600"
                      />
                    </div>

                    {/* Undo / Redo */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleUndo}
                        disabled={undoHistoryRef.current.length <= 1}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                      >
                        <Undo2 size={14} />
                        <span>Undo Stroke</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRedo}
                        disabled={redoHistoryRef.current.length === 0}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                      >
                        <Redo2 size={14} />
                        <span>Redo</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: Backdrop Studio */}
                {activeTab === "backdrop" && (
                  <div className="space-y-4">
                    {/* Transparent Option */}
                    <button
                      type="button"
                      onClick={() => setBackdropType("transparent")}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        backdropType === "transparent"
                          ? "border-pink-500 bg-pink-500/10 text-pink-700 dark:text-pink-300 font-bold"
                          : "border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <div
                          className="h-6 w-6 rounded-lg border border-slate-300"
                          style={{
                            backgroundImage:
                              "linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)",
                            backgroundSize: "8px 8px"
                          }}
                        />
                        <span>Transparent (PNG cutout)</span>
                      </div>
                      {backdropType === "transparent" && <Check size={16} />}
                    </button>

                    {/* Official Exam & Passport Solid Colors */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Official Exam & Visa Colors
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {BACKDROP_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setBackdropType("color");
                              setSelectedColor(preset.color);
                            }}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              backdropType === "color" && selectedColor.toLowerCase() === preset.color.toLowerCase()
                                ? "border-pink-500 ring-2 ring-pink-500/20 bg-pink-50/40 dark:bg-pink-950/20"
                                : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300"
                            }`}
                          >
                            <div
                              className="h-6 w-6 shrink-0 rounded-lg border border-slate-300 shadow-2xs"
                              style={{ backgroundColor: preset.color }}
                            />
                            <div className="truncate">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {preset.name}
                              </div>
                              {preset.badge && (
                                <div className="text-[10px] text-slate-400 truncate">{preset.badge}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Studio Gradients */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Studio Gradients
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {GRADIENT_PRESETS.map((grad) => (
                          <button
                            key={grad.id}
                            type="button"
                            onClick={() => {
                              setBackdropType("gradient");
                              setSelectedGradient(grad);
                            }}
                            className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                              backdropType === "gradient" && selectedGradient.id === grad.id
                                ? "border-pink-500 ring-2 ring-pink-500/20"
                                : "border-slate-200 dark:border-white/[0.08]"
                            }`}
                          >
                            <div
                              className="h-8 rounded-lg shadow-2xs mb-1"
                              style={{
                                background: `linear-gradient(to bottom right, ${grad.from}, ${grad.to})`
                              }}
                            />
                            <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">
                              {grad.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Hex Picker */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Custom Color Picker
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedColor}
                          onChange={(e) => {
                            setBackdropType("color");
                            setSelectedColor(e.target.value);
                            setCustomHex(e.target.value);
                          }}
                          className="h-9 w-10 cursor-pointer rounded-xl border border-slate-200 bg-transparent p-0.5 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={customHex}
                          onChange={(e) => {
                            setCustomHex(e.target.value);
                            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                              setBackdropType("color");
                              setSelectedColor(e.target.value);
                            }
                          }}
                          placeholder="#ffffff"
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono uppercase text-slate-800 dark:border-white/[0.08] dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Download & Export Card */}
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Export Cutout
                </h4>

                <button
                  type="button"
                  onClick={downloadPng}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 px-6 h-12 text-sm font-black text-white shadow-lg shadow-pink-500/25 hover:opacity-95 transition-all cursor-pointer"
                >
                  <Download size={16} />
                  <span>Download Transparent PNG</span>
                </button>

                {backdropType !== "transparent" && (
                  <button
                    type="button"
                    onClick={downloadJpgWithBackdrop}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-slate-800 px-4 h-11 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download JPG with Backdrop</span>
                  </button>
                )}

                {/* Workflow Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {onSwitchToResizer && (
                    <button
                      type="button"
                      onClick={sendToResizer}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-pink-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowLeftRight size={13} />
                      <span>Resize (35×45)</span>
                    </button>
                  )}

                  {onSwitchToCompressor && (
                    <button
                      type="button"
                      onClick={sendToCompressor}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-pink-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Zap size={13} />
                      <span>Compress KB</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Privacy Guarantee */}
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-50/5 p-4 text-xs dark:bg-emerald-950/20 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck size={16} />
                  <span>100% In-Browser Matting</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Background segmentation runs completely inside your device's memory using Canvas 2D and TypedArray buffers. Zero images are ever uploaded to any cloud server.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
