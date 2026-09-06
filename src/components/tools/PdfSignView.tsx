import { useState, useRef, useEffect } from "react";
import {
  ArrowLeftRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eraser,
  FileSignature,
  Image as ImageIcon,
  Minus,
  PenTool,
  Plus,
  QrCode,
  RefreshCw,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  X
} from "lucide-react";
import UploadZone from "../UploadZone";
import {
  PdfFileInfo,
  SignaturePlacement,
  downloadBlob,
  formatBytes,
  readPdfInfo,
  renderPdfPageToDataUrl,
  signPdf
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

type SignMode = "draw" | "type" | "upload";

const CURSIVE_FONTS = [
  { name: "Executive Script", style: "italic 36px 'Brush Script MT', 'Dancing Script', cursive" },
  { name: "Classic Calligraphy", style: "italic 34px 'Segoe Script', 'Great Vibes', cursive" },
  { name: "Modern Cursive", style: "italic 32px 'Snell Roundhand', 'Pacifico', cursive" },
  { name: "Casual Flow", style: "italic 32px 'Caveat', cursive" }
];

const INK_COLORS = [
  { label: "Obsidian Black", hex: "#0f172a" },
  { label: "Royal Blue", hex: "#1d4ed8" },
  { label: "Deep Navy", hex: "#1e3a8a" },
  { label: "Burgundy", hex: "#881337" }
];

export default function PdfSignView({
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
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [activePage, setActivePage] = useState<number>(1);
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState<boolean>(false);

  // Signature creation state
  const [signMode, setSignMode] = useState<SignMode>("draw");
  const [currentSignatureDataUrl, setCurrentSignatureDataUrl] = useState<string | null>(null);
  const [inkColor, setInkColor] = useState<string>(INK_COLORS[1].hex); // default royal blue
  const [penWidth, setPenWidth] = useState<number>(2.5);

  // Type signature mode state
  const [typedName, setTypedName] = useState<string>("John Doe");
  const [selectedFontIndex, setSelectedFontIndex] = useState<number>(0);
  const [typedFontSize, setTypedFontSize] = useState<number>(36);

  // Draw signature canvas
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawHistory, setDrawHistory] = useState<ImageData[]>([]);

  // Placed signatures
  const [placements, setPlacements] = useState<SignaturePlacement[]>([]);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [stampScale, setStampScale] = useState<number>(0.22); // 22% of page width default
  const [busy, setBusy] = useState(false);

  // Page container reference for coordinate mapping
  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  // Dragging placement
  const [draggingPlacementId, setDraggingPlacementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const load = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    try {
      const pdf = await readPdfInfo(picked, 30);
      setInfo(pdf);
      setActivePage(1);
      setPlacements([]);
      setSignedFile(null);
      notify(`Loaded PDF with ${pdf.pages} page(s). Create your signature to begin.`, "info");
    } catch {
      notify("Could not read PDF document.", "error");
    }
  };

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && !info) {
      load(initialFiles);
    }
  }, [initialFiles]);

  // Load high-resolution page preview when activePage or info changes
  useEffect(() => {
    if (!info) {
      setPageImage(null);
      return;
    }
    let isCancelled = false;
    setLoadingPage(true);
    renderPdfPageToDataUrl(info.file, activePage, 1.4)
      .then((url) => {
        if (!isCancelled) {
          setPageImage(url);
          setLoadingPage(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to render page image:", err);
        if (!isCancelled) {
          // fallback to thumbnail if available
          setPageImage(info.thumbnails[activePage - 1] || null);
          setLoadingPage(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [info, activePage]);

  // Drawing Canvas logic
  const initDrawCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawHistory([]);
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // save current state for undo
    setDrawHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = penWidth;
    setIsDrawing(true);
  };

  const drawMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    exportDrawnSignature();
  };

  const undoDraw = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas || drawHistory.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prevImageData = drawHistory[drawHistory.length - 1];
    setDrawHistory((prev) => prev.slice(0, prev.length - 1));
    ctx.putImageData(prevImageData, 0, 0);
    exportDrawnSignature();
  };

  const clearDraw = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawHistory([]);
    setCurrentSignatureDataUrl(null);
  };

  const exportDrawnSignature = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    // Check if canvas has any drawn pixels
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let hasDrawn = false;
    for (let i = 3; i < imgData.data.length; i += 4) {
      if (imgData.data[i] > 20) {
        hasDrawn = true;
        break;
      }
    }
    if (hasDrawn) {
      setCurrentSignatureDataUrl(canvas.toDataURL("image/png"));
    }
  };

  // Generate typed signature
  const generateTypedSignature = () => {
    if (!typedName.trim()) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const baseSpec = CURSIVE_FONTS[selectedFontIndex]?.style || CURSIVE_FONTS[0].style;
    const fontSpec = baseSpec.replace(/\d+px/, `${typedFontSize}px`);
    ctx.font = fontSpec;
    ctx.fillStyle = inkColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    setCurrentSignatureDataUrl(canvas.toDataURL("image/png"));
  };

  useEffect(() => {
    if (signMode === "type") {
      generateTypedSignature();
    }
  }, [typedName, selectedFontIndex, inkColor, signMode, typedFontSize]);

  // Handle image upload for signature
  const handleSignatureUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setCurrentSignatureDataUrl(result);
        notify("Signature image loaded.", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  // Place signature onto document
  const placeSignature = (xNorm: number, yNorm: number) => {
    if (!currentSignatureDataUrl) {
      notify("Please create or choose a signature first.", "error");
      return;
    }

    const widthNorm = stampScale;
    const heightNorm = stampScale * 0.42; // standard signature aspect ratio

    // Clamp inside page bounds
    const clampedX = Math.max(0.02, Math.min(xNorm - widthNorm / 2, 0.98 - widthNorm));
    const clampedY = Math.max(0.02, Math.min(yNorm - heightNorm / 2, 0.98 - heightNorm));

    const newPlacement: SignaturePlacement = {
      id: `stamp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pageNumber: activePage,
      dataUrl: currentSignatureDataUrl,
      xNorm: clampedX,
      yNorm: clampedY,
      widthNorm,
      heightNorm
    };

    setPlacements((prev) => [...prev, newPlacement]);
    setSelectedPlacementId(newPlacement.id);
    notify(`Placed signature on Page ${activePage}. Drag to fine-tune position!`, "success");
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking on an existing placement, do nothing (handled by placement element)
    if (draggingPlacementId) return;
    if ((e.target as HTMLElement).closest(".signature-stamp")) return;

    const container = pageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const xNorm = (e.clientX - rect.left) / rect.width;
    const yNorm = (e.clientY - rect.top) / rect.height;

    placeSignature(xNorm, yNorm);
  };

  // Interactive Drag on Document Page
  const handleStampPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelectedPlacementId(id);
    setDraggingPlacementId(id);

    const container = pageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const targetPlacement = placements.find((p) => p.id === id);
    if (!targetPlacement) return;

    const currentX = targetPlacement.xNorm * rect.width;
    const currentY = targetPlacement.yNorm * rect.height;
    setDragOffset({
      x: e.clientX - rect.left - currentX,
      y: e.clientY - rect.top - currentY
    });
  };

  const handleContainerPointerMove = (e: React.PointerEvent) => {
    if (!draggingPlacementId) return;
    const container = pageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const mouseX = e.clientX - rect.left - dragOffset.x;
    const mouseY = e.clientY - rect.top - dragOffset.y;

    const currentStamp = placements.find((p) => p.id === draggingPlacementId);
    if (!currentStamp) return;

    const newXNorm = Math.max(0, Math.min(mouseX / rect.width, 1 - currentStamp.widthNorm));
    const newYNorm = Math.max(0, Math.min(mouseY / rect.height, 1 - currentStamp.heightNorm));

    setPlacements((prev) =>
      prev.map((p) =>
        p.id === draggingPlacementId
          ? { ...p, xNorm: newXNorm, yNorm: newYNorm }
          : p
      )
    );
  };

  const handleContainerPointerUp = () => {
    if (draggingPlacementId) {
      setDraggingPlacementId(null);
    }
  };

  const removePlacement = (id: string) => {
    setPlacements((prev) => prev.filter((p) => p.id !== id));
    if (selectedPlacementId === id) setSelectedPlacementId(null);
    notify("Signature removed.", "info");
  };

  const updateSelectedScale = (newScale: number) => {
    setStampScale(newScale);
    if (selectedPlacementId) {
      setPlacements((prev) =>
        prev.map((p) =>
          p.id === selectedPlacementId
            ? {
                ...p,
                widthNorm: newScale,
                heightNorm: newScale * 0.42
              }
            : p
        )
      );
    }
  };

  const runSign = async () => {
    if (!info) return notify("Upload a PDF document first.", "error");
    if (placements.length === 0) {
      return notify("Place at least one signature on the document first.", "error");
    }

    setBusy(true);
    try {
      const blob = await signPdf(info.file, placements);
      const generated = new File([blob], `${info.file.name.replace(/\.pdf$/i, "")}-signed.pdf`, { type: "application/pdf" });
      setSignedFile(generated);
      downloadBlob(blob, `${info.file.name.replace(/\.pdf$/i, "")}-signed.pdf`);
      notify("Document signed and downloaded successfully!", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not sign PDF.", "error");
    } finally {
      setBusy(false);
    }
  };

  const activePagePlacements = placements.filter((p) => p.pageNumber === activePage);

  return (
    <div className="space-y-4">
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <span className="font-medium text-slate-700 dark:text-indigo-200">
            Need to add a company logo or text watermark stamp instead of signing?
          </span>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-white px-3 py-1.5 font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300"
          >
            <ArrowLeftRight size={13} />
            Switch to Watermark PDF
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_390px] xl:items-start min-h-0">
      {/* Left Workspace: Document Viewport & Visual Signing Area */}
      <div className="space-y-6 xl:max-h-[calc(100vh-210px)] xl:overflow-y-auto pr-1">
        <div className="panel">
          <UploadZone
            accept="application/pdf"
            files={info ? [info.file] : []}
            formats="PDF"
            onFiles={load}
            onRemove={() => {
              setInfo(null);
              setPlacements([]);
            }}
            label="Upload PDF to sign document"
            helperText="Draw, type, or upload your signature, then click directly on pages to place and stamp"
          />
        </div>

        {info && (
          <div className="space-y-4">
            {/* Top Toolbar: Page Pagination & Placement Counter */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activePage <= 1}
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Page {activePage} of {info.pages}
                </span>
                <button
                  type="button"
                  disabled={activePage >= info.pages}
                  onClick={() => setActivePage((p) => Math.min(info.pages, p + 1))}
                  className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {currentSignatureDataUrl ? (
                  <button
                    type="button"
                    onClick={() => placeSignature(0.5, 0.5)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900/60"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Place In Center
                  </button>
                ) : (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Create signature below to stamp
                  </span>
                )}
              </div>
            </div>

            {/* Document Interactive Page Canvas */}
            <div className="flex justify-center">
              <div
                ref={pageContainerRef}
                onClick={handlePageClick}
                onPointerMove={handleContainerPointerMove}
                onPointerUp={handleContainerPointerUp}
                className="relative max-w-full cursor-crosshair select-none rounded-xl border border-slate-300/80 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                style={{
                  minHeight: "480px",
                  maxHeight: "720px"
                }}
              >
                {loadingPage ? (
                  <div className="flex h-96 w-80 items-center justify-center sm:w-[480px]">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                      <span className="text-xs font-medium">Rendering Page {activePage}...</span>
                    </div>
                  </div>
                ) : pageImage ? (
                  <img
                    src={pageImage}
                    alt={`Page ${activePage}`}
                    className="block max-h-[700px] w-auto rounded-xl object-contain pointer-events-none"
                  />
                ) : (
                  <div className="flex h-96 w-80 items-center justify-center sm:w-[480px]">
                    <span className="text-xs text-slate-400">Unable to preview page.</span>
                  </div>
                )}

                {/* Placed Signatures on this page */}
                {activePagePlacements.map((stamp) => {
                  const isSelected = selectedPlacementId === stamp.id;
                  return (
                    <div
                      key={stamp.id}
                      onPointerDown={(e) => handleStampPointerDown(e, stamp.id)}
                      className={`signature-stamp group absolute cursor-move rounded border transition-shadow ${
                        isSelected
                          ? "border-2 border-indigo-500 shadow-lg ring-2 ring-indigo-500/20"
                          : "border border-indigo-400/60 hover:border-indigo-500"
                      }`}
                      style={{
                        left: `${stamp.xNorm * 100}%`,
                        top: `${stamp.yNorm * 100}%`,
                        width: `${stamp.widthNorm * 100}%`,
                        height: `${stamp.heightNorm * 100}%`,
                        touchAction: "none"
                      }}
                    >
                      <img
                        src={stamp.dataUrl}
                        alt="Signature"
                        className="h-full w-full object-contain pointer-events-none"
                      />

                      {/* Delete button on stamp */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePlacement(stamp.id);
                        }}
                        className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow hover:bg-rose-600"
                        title="Remove signature"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              Tip: Click anywhere on the page above to drop your signature, or drag to adjust.
            </p>
          </div>
        )}
      </div>

      {/* Right Sidebar: Signature Studio, Customization & Download CTA */}
      <div className="space-y-6 xl:sticky xl:top-0 xl:max-h-[calc(100vh-210px)] xl:overflow-y-auto pr-1">
        {/* Signature Creator Card */}
        <div className="panel space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-white">
              <FileSignature className="h-4 w-4 text-indigo-500" />
              Signature Studio
            </h3>
            {currentSignatureDataUrl && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Check className="h-3 w-3" /> Ready
              </span>
            )}
          </div>

          {/* Mode Selector Tabs: Draw | Type | Upload */}
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
            <button
              type="button"
              onClick={() => setSignMode("draw")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                signMode === "draw"
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <PenTool className="h-3.5 w-3.5" />
              Draw
            </button>
            <button
              type="button"
              onClick={() => setSignMode("type")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                signMode === "type"
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Type className="h-3.5 w-3.5" />
              Type
            </button>
            <button
              type="button"
              onClick={() => setSignMode("upload")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                signMode === "upload"
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Upload
            </button>
          </div>

          {/* Ink Color Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Ink Color
            </label>
            <div className="flex items-center gap-2">
              {INK_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setInkColor(color.hex)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform ${
                    inkColor === color.hex
                      ? "scale-110 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.label}
                >
                  {inkColor === color.hex && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* DRAW MODE */}
          {signMode === "draw" && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-white shadow-inner dark:border-slate-700 dark:bg-slate-950">
                <canvas
                  ref={drawCanvasRef}
                  width={340}
                  height={150}
                  onPointerDown={startDrawing}
                  onPointerMove={drawMove}
                  onPointerUp={endDrawing}
                  onPointerLeave={endDrawing}
                  className="touch-none cursor-crosshair w-full"
                />
                <div className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-slate-300 dark:text-slate-700">
                  Draw signature above
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Stroke:</span>
                  <button
                    type="button"
                    onClick={() => setPenWidth(1.8)}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      penWidth === 1.8 ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "text-slate-600"
                    }`}
                  >
                    Fine
                  </button>
                  <button
                    type="button"
                    onClick={() => setPenWidth(2.8)}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      penWidth === 2.8 ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "text-slate-600"
                    }`}
                  >
                    Med
                  </button>
                  <button
                    type="button"
                    onClick={() => setPenWidth(4.2)}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      penWidth === 4.2 ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "text-slate-600"
                    }`}
                  >
                    Bold
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={undoDraw}
                    title="Undo stroke"
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={clearDraw}
                    title="Clear canvas"
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <Eraser className="h-3.5 w-3.5" /> Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TYPE MODE */}
          {signMode === "type" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Full Name / Initial
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="e.g. Vinit Sammir"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Calligraphy Style
                </label>
                <div className="mt-1 space-y-1.5">
                  {CURSIVE_FONTS.map((font, idx) => (
                    <button
                      key={font.name}
                      type="button"
                      onClick={() => setSelectedFontIndex(idx)}
                      className={`flex w-full items-center justify-between rounded-lg border p-2 text-left transition ${
                        selectedFontIndex === idx
                          ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/80 dark:bg-indigo-950/40"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                      }`}
                    >
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {font.name}
                      </span>
                      <span
                        className="text-base italic"
                        style={{ color: inkColor, fontFamily: font.style.split("'")[1] || "cursive" }}
                      >
                        {typedName || "Signature"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Signature Font Size
                  </label>
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => setTypedFontSize((s) => Math.max(20, s - 3))}
                      disabled={typedFontSize <= 20}
                      className="flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none dark:text-slate-300 dark:hover:bg-slate-800"
                      title="Decrease Signature Font Size"
                      aria-label="Decrease Signature Font Size"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="min-w-[34px] text-center font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {typedFontSize}px
                    </span>
                    <button
                      type="button"
                      onClick={() => setTypedFontSize((s) => Math.min(60, s + 3))}
                      disabled={typedFontSize >= 60}
                      className="flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none dark:text-slate-300 dark:hover:bg-slate-800"
                      title="Increase Signature Font Size"
                      aria-label="Increase Signature Font Size"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={20}
                  max={60}
                  step={2}
                  value={typedFontSize}
                  onChange={(e) => setTypedFontSize(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          )}

          {/* UPLOAD MODE */}
          {signMode === "upload" && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Upload Signature Image (PNG or JPG)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSignatureUpload(f);
                }}
                className="w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100 dark:file:bg-indigo-950/60 dark:file:text-indigo-400"
              />
            </div>
          )}

          {/* Stamp Size Control */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Stamp Size
              </span>
              <span className="font-mono text-slate-500">
                {Math.round(stampScale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={0.5}
              step={0.02}
              value={stampScale}
              onChange={(e) => updateSelectedScale(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>

        {/* Placed Signatures Summary & Download CTA */}
        <div className="panel space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Placed Signatures ({placements.length})
            </h3>
            {placements.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPlacements([]);
                  setSelectedPlacementId(null);
                }}
                className="text-xs text-rose-500 hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          {placements.length > 0 ? (
            <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1 text-xs">
              {placements.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setActivePage(p.pageNumber);
                    setSelectedPlacementId(p.id);
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-2 transition ${
                    selectedPlacementId === p.id
                      ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/80 dark:bg-indigo-950/40"
                      : "border-slate-200/80 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Page {p.pageNumber}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Signature #{idx + 1}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePlacement(p.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No signatures stamped yet. Click on the document page to place your signature.
            </p>
          )}

          {/* Generate & Download CTA */}
          <button
            type="button"
            onClick={runSign}
            disabled={busy || !info || placements.length === 0}
            className="btn btn-primary w-full py-3 text-sm font-semibold shadow-lg shadow-indigo-500/20"
          >
            {busy ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Signing Document...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Sign & Download PDF
              </>
            )}
          </button>

          {signedFile && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => downloadBlob(signedFile, signedFile.name)}
                className="btn-secondary w-full py-2.5 text-xs font-bold"
              >
                <Download size={14} />
                Download Signed PDF Again
              </button>
              {onShareFile && (
                <button
                  type="button"
                  onClick={() => onShareFile(signedFile)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 py-2.5 px-3 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition shadow-sm"
                >
                  <QrCode size={14} className="text-indigo-600 dark:text-indigo-400" />
                  📱 Download on Mobile via QR Code / Share
                </button>
              )}
            </div>
          )}
        </div>

        {/* Security & Privacy Notice */}
        <div className="panel space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Desktop-Grade Security
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your document and signature never leave your device. All cryptographic PDF stamp rendering happens 100% locally in your browser.
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
