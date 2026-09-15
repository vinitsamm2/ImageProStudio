import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  CheckCheck,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eraser,
  Eye,
  EyeOff,
  FilePenLine,
  FileSearch,
  FileSignature,
  FileText,
  Highlighter,
  Image as ImageIcon,
  Layers,
  Minus,
  MousePointer,
  Move,
  PenTool,
  PencilLine,
  Pipette,
  Plus,
  QrCode,
  Redo2,
  RefreshCw,
  Replace,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
  Circle,
  Stamp,
  Trash2,
  Type,
  Undo2,
  Upload,
  Wand2,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import UploadZone from "../UploadZone";
import {
  EditorPagePlanItem,
  EditorPoint,
  PdfAnnotation,
  PdfAnnotationType,
  PdfExtractedImageItem,
  PdfExtractedTextItem,
  PdfFileInfo,
  compileEditedPdf,
  downloadBlob,
  extractPdfPageImages,
  extractPdfPageTextItems,
  formatBytes,
  normalizePdfFontName,
  readPdfInfo,
  renderPdfPageDetails,
  renderPdfPageToDataUrl,
  uid
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

type ToolMode =
  | "select"
  | "editText"
  | "eraseAndType"
  | "erase"
  | "text"
  | "forms"
  | "draw"
  | "highlight"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "redact"
  | "stamp"
  | "image"
  | "sign";

const STAMP_PRESETS = [
  { label: "APPROVED", color: "#16a34a" },
  { label: "CONFIDENTIAL", color: "#dc2626" },
  { label: "DRAFT", color: "#64748b" },
  { label: "FINAL", color: "#2563eb" },
  { label: "REJECTED", color: "#e11d48" },
  { label: "PAID", color: "#059669" },
  { label: "OFFICIAL", color: "#7c3aed" },
  { label: "URGENT", color: "#ea580c" }
];

const COLOR_PALETTE = [
  { name: "Black", hex: "#0f172a" },
  { name: "Royal Blue", hex: "#2563eb" },
  { name: "Emerald Green", hex: "#16a34a" },
  { name: "Crimson Red", hex: "#dc2626" },
  { name: "Amber Orange", hex: "#d97706" },
  { name: "Purple", hex: "#9333ea" },
  { name: "Cyan", hex: "#0891b2" },
  { name: "White", hex: "#ffffff" }
];

const HIGHLIGHT_COLORS = [
  { name: "Yellow", hex: "#fef08a" },
  { name: "Green", hex: "#bbf7d0" },
  { name: "Cyan", hex: "#a5f3fc" },
  { name: "Pink", hex: "#fbcfe8" },
  { name: "Orange", hex: "#fed7aa" }
];

const getAnnotationCssFont = (ann: PdfAnnotation): string => {
  if (ann.actualFontName) {
    const norm = normalizePdfFontName(ann.actualFontName);
    return norm.cssFontString;
  }
  if (ann.fontFamily === "serif") {
    return '"Times New Roman", Times, Georgia, Cambria, serif';
  }
  if (ann.fontFamily === "mono") {
    return '"Courier New", Courier, Consolas, Monaco, monospace';
  }
  if (ann.fontFamily === "cursive") {
    return '"Brush Script MT", "Dancing Script", cursive';
  }
  return 'Arial, Helvetica, "Segoe UI", Roboto, sans-serif';
};

const measureTextWidthNorm = (
  text: string,
  fontSizePt: number,
  fontFamilyStr: string,
  fontWeight = "normal",
  fontStyle = "normal",
  pageWidth = 595
): number => {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return Math.min(0.98, ((text.length + 1) * fontSizePt * 0.6) / pageWidth);
    ctx.font = `${fontStyle} ${fontWeight} ${fontSizePt}px ${fontFamilyStr}`;
    const metrics = ctx.measureText(text || " ");
    const extraPadding = fontSizePt * 0.7;
    return Math.min(0.98, (metrics.width + extraPadding) / pageWidth);
  } catch {
    return Math.min(0.98, ((text.length + 2) * fontSizePt * 0.6) / pageWidth);
  }
};

export default function PdfEditorView({
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
  // Document state
  const [info, setInfo] = useState<PdfFileInfo | null>(null);
  const [pagesPlan, setPagesPlan] = useState<EditorPagePlanItem[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0); // 0-indexed
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  // Dynamic page dimensions (for pixel-perfect non-A4 scaling)
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({
    width: 595,
    height: 842
  });

  // Extracted PDF text per page (cached)
  const [extractedTexts, setExtractedTexts] = useState<Record<number, PdfExtractedTextItem[]>>({});
  const [loadingText, setLoadingText] = useState<boolean>(false);
  const [detectTextActive, setDetectTextActive] = useState<boolean>(true);
  const [hoveredTextId, setHoveredTextId] = useState<string | null>(null);

  // Extracted PDF images/logos per page (cached)
  const [extractedImages, setExtractedImages] = useState<Record<number, PdfExtractedImageItem[]>>({});
  const [loadingImages, setLoadingImages] = useState<boolean>(false);
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
  const [selectedImageItem, setSelectedImageItem] = useState<PdfExtractedImageItem | null>(null);
  const [deletedImageNames, setDeletedImageNames] = useState<string[]>([]);
  const [detectedItemType, setDetectedItemType] = useState<"text" | "images">("text");

  // Left sidebar tab: "pages" | "text"
  const [sidebarTab, setSidebarTab] = useState<"pages" | "text">("pages");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [textSearchQuery, setTextSearchQuery] = useState<string>("");

  // Find & Replace state
  const [findAndReplaceOpen, setFindAndReplaceOpen] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>("");
  const [replaceQuery, setReplaceQuery] = useState<string>("");
  const [findCaseSensitive, setFindCaseSensitive] = useState<boolean>(false);
  const [findScope, setFindScope] = useState<"page" | "all">("page");

  // Annotations & History
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const [history, setHistory] = useState<PdfAnnotation[][]>([]);
  const [redoStack, setRedoStack] = useState<PdfAnnotation[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Active Tool & Mode (defaults to text for immediate Sejda-like editing)
  const [activeTool, setActiveTool] = useState<ToolMode>("text");
  const [formsMenuOpen, setFormsMenuOpen] = useState<boolean>(false);
  const [formSymbol, setFormSymbol] = useState<"check" | "cross" | "radio" | "checkbox">("check");
  const [annotateMenuOpen, setAnnotateMenuOpen] = useState<boolean>(false);
  const [shapesMenuOpen, setShapesMenuOpen] = useState<boolean>(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState<boolean>(false);
  const [showExportSuccessModal, setShowExportSuccessModal] = useState<boolean>(false);

  // Tool properties
  const [activeColor, setActiveColor] = useState<string>("#0f172a");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono" | "cursive">("sans");
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [textHighlight, setTextHighlight] = useState<string>("transparent");
  const [highlightColor, setHighlightColor] = useState<string>(HIGHLIGHT_COLORS[0].hex);
  const [redactColor, setRedactColor] = useState<string>("#000000");
  const [eraseColor, setEraseColor] = useState<string>("#ffffff");
  const [eraseColorAutoMatch, setEraseColorAutoMatch] = useState<boolean>(true);
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedStamp, setSelectedStamp] = useState<{ label: string; color: string }>(STAMP_PRESETS[0]);
  const [customStampText, setCustomStampText] = useState<string>("");

  // Uploaded image state for image tool
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  // In-progress interaction state
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [interactionStart, setInteractionStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<EditorPoint[]>([]);
  const [tempShape, setTempShape] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // Dragging / Resizing an existing annotation
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ xNorm: number; yNorm: number }>({ xNorm: 0, yNorm: 0 });
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeInitial, setResizeInitial] = useState<{
    xNorm: number;
    yNorm: number;
    wNorm: number;
    hNorm: number;
    pointerX: number;
    pointerY: number;
  } | null>(null);

  // Inline text editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Export / Save state
  const [exporting, setExporting] = useState<boolean>(false);
  const [editedFile, setEditedFile] = useState<File | null>(null);

  // Signature Modal state
  const [showSignModal, setShowSignModal] = useState(false);
  const [signDrawPoints, setSignDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [isSignDrawing, setIsSignDrawing] = useState(false);
  const signCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [signTypedName, setSignTypedName] = useState("Your Signature");
  const [signMode, setSignMode] = useState<"draw" | "type">("draw");

  // Load PDF file
  const load = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    try {
      const pdf = await readPdfInfo(picked, 40);
      setInfo(pdf);
      setActivePageIndex(0);
      setAnnotations([]);
      setHistory([]);
      setRedoStack([]);
      setSelectedId(null);
      setEditedFile(null);
      setExtractedTexts({});
      setExtractedImages({});
      setDeletedImageNames([]);
      setSelectedImageItem(null);
      setFindAndReplaceOpen(false);
      setFindQuery("");
      setReplaceQuery("");

      const plan: EditorPagePlanItem[] = Array.from({ length: pdf.pages }, (_, i) => ({
        id: `page-${i + 1}-${uid("plan")}`,
        originalPage: i + 1,
        rotation: 0
      }));
      setPagesPlan(plan);
      if (typeof window !== "undefined" && window.innerWidth < 640) {
        setZoomScale(Math.max(0.45, Math.min(1.0, Number(((window.innerWidth - 48) / 595).toFixed(2)))));
      }
      notify(`Loaded PDF with ${pdf.pages} page(s). Click any text or pick a tool to start editing!`, "info");
    } catch (err) {
      console.error(err);
      notify("Could not read PDF document. Please check the file.", "error");
    }
  };

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && !info) {
      load(initialFiles);
    }
  }, [initialFiles]);

  // Render current page preview & extract text
  useEffect(() => {
    if (!info || pagesPlan.length === 0) {
      setPageImage(null);
      return;
    }

    const currentPlan = pagesPlan[activePageIndex];
    if (!currentPlan) return;

    let isCancelled = false;
    setLoadingPage(true);

    if (currentPlan.originalPage !== null) {
      renderPdfPageDetails(info.file, currentPlan.originalPage, 1.5, currentPlan.rotation)
        .then((res) => {
          if (!isCancelled) {
            setPageImage(res.dataUrl);
            setPageDimensions({ width: Math.round(res.width), height: Math.round(res.height) });
            setLoadingPage(false);
          }
        })
        .catch((err) => {
          console.warn("Failed rendering page preview:", err);
          if (!isCancelled) {
            setPageImage(info.thumbnails[(currentPlan.originalPage || 1) - 1] || null);
            setLoadingPage(false);
          }
        });

      // Extract text items if not already cached for this page
      if (!extractedTexts[activePageIndex]) {
        setLoadingText(true);
        extractPdfPageTextItems(info.file, currentPlan.originalPage, currentPlan.rotation)
          .then((items) => {
            if (!isCancelled) {
              setExtractedTexts((prev) => ({ ...prev, [activePageIndex]: items }));
              setLoadingText(false);
            }
          })
          .catch((err) => {
            console.warn("Failed extracting page text:", err);
            if (!isCancelled) setLoadingText(false);
          });
      }

      // Extract embedded images/logos if not already cached for this page
      if (!extractedImages[activePageIndex]) {
        setLoadingImages(true);
        extractPdfPageImages(info.file, currentPlan.originalPage, currentPlan.rotation)
          .then((imgs) => {
            if (!isCancelled) {
              setExtractedImages((prev) => ({ ...prev, [activePageIndex]: imgs }));
              setLoadingImages(false);
            }
          })
          .catch((err) => {
            console.warn("Failed extracting page images:", err);
            if (!isCancelled) setLoadingImages(false);
          });
      }
    } else {
      // Blank page: generate a blank white preview dataUrl
      const c = document.createElement("canvas");
      c.width = 595 * 1.5;
      c.height = 842 * 1.5;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
      }
      setPageImage(c.toDataURL("image/jpeg"));
      setPageDimensions({ width: 595, height: 842 });
      setLoadingPage(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [info, activePageIndex, pagesPlan]);

  // Maintain an offscreen canvas synchronized with the current page image for instant pixel sampling
  useEffect(() => {
    if (!pageImage) {
      pageCanvasRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        pageCanvasRef.current = canvas;
      }
    };
    img.src = pageImage;
  }, [pageImage]);

  // Sample exact color at normalized point (0..1)
  const getPixelColorAtPoint = useCallback((xNorm: number, yNorm: number): string => {
    const canvas = pageCanvasRef.current;
    if (!canvas) return "#ffffff";
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "#ffffff";
    const px = Math.floor(Math.max(0, Math.min(canvas.width - 1, xNorm * canvas.width)));
    const py = Math.floor(Math.max(0, Math.min(canvas.height - 1, yNorm * canvas.height)));
    try {
      const p = ctx.getImageData(px, py, 1, 1).data;
      const r = p[0].toString(16).padStart(2, "0");
      const g = p[1].toString(16).padStart(2, "0");
      const b = p[2].toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    } catch {
      return "#ffffff";
    }
  }, []);

  // Compute dominant background color around/outside a given normalized box
  const sampleBackgroundColor = useCallback(
    (xNorm: number, yNorm: number, wNorm: number, hNorm: number): string => {
      const canvas = pageCanvasRef.current;
      if (!canvas) return "#ffffff";
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return "#ffffff";

      const cw = canvas.width;
      const ch = canvas.height;
      const px = Math.floor(xNorm * cw);
      const py = Math.floor(yNorm * ch);
      const pw = Math.max(2, Math.floor(wNorm * cw));
      const ph = Math.max(2, Math.floor(hNorm * ch));

      // Sample boundary points just outside or on the margin
      const samplePoints: { x: number; y: number }[] = [];
      const margin = 3;

      const stepsX = Math.min(24, Math.max(4, Math.floor(pw / 8)));
      for (let i = 0; i <= stepsX; i++) {
        const sx = Math.floor(px + (pw * i) / stepsX);
        samplePoints.push({ x: sx, y: Math.max(0, py - margin) });
        samplePoints.push({ x: sx, y: Math.min(ch - 1, py + ph + margin) });
      }

      const stepsY = Math.min(24, Math.max(4, Math.floor(ph / 8)));
      for (let j = 0; j <= stepsY; j++) {
        const sy = Math.floor(py + (ph * j) / stepsY);
        samplePoints.push({ x: Math.max(0, px - margin), y: sy });
        samplePoints.push({ x: Math.min(cw - 1, px + pw + margin), y: sy });
      }

      samplePoints.push({ x: Math.max(0, px - margin), y: Math.max(0, py - margin) });
      samplePoints.push({ x: Math.min(cw - 1, px + pw + margin), y: Math.max(0, py - margin) });
      samplePoints.push({ x: Math.max(0, px - margin), y: Math.min(ch - 1, py + ph + margin) });
      samplePoints.push({ x: Math.min(cw - 1, px + pw + margin), y: Math.min(ch - 1, py + ph + margin) });

      const colorCounts: Record<string, { count: number; r: number; g: number; b: number }> = {};
      for (const pt of samplePoints) {
        const clampedX = Math.max(0, Math.min(cw - 1, pt.x));
        const clampedY = Math.max(0, Math.min(ch - 1, pt.y));
        try {
          const d = ctx.getImageData(clampedX, clampedY, 1, 1).data;
          const qr = Math.round(d[0] / 6) * 6;
          const qg = Math.round(d[1] / 6) * 6;
          const qb = Math.round(d[2] / 6) * 6;
          const key = `${qr},${qg},${qb}`;
          if (!colorCounts[key]) {
            colorCounts[key] = { count: 1, r: d[0], g: d[1], b: d[2] };
          } else {
            colorCounts[key].count++;
          }
        } catch {
          // ignore
        }
      }

      let bestKey = "";
      let maxCount = -1;
      for (const key in colorCounts) {
        if (colorCounts[key].count > maxCount) {
          maxCount = colorCounts[key].count;
          bestKey = key;
        }
      }

      if (bestKey && colorCounts[bestKey]) {
        const c = colorCounts[bestKey];
        const r = Math.max(0, Math.min(255, c.r)).toString(16).padStart(2, "0");
        const g = Math.max(0, Math.min(255, c.g)).toString(16).padStart(2, "0");
        const b = Math.max(0, Math.min(255, c.b)).toString(16).padStart(2, "0");
        return `#${r}${g}${b}`;
      }

      return "#ffffff";
    },
    []
  );

  const isColorDark = (hex: string): boolean => {
    const clean = hex.replace("#", "");
    if (clean.length < 6) return false;
    const r = parseInt(clean.substring(0, 2), 16) || 0;
    const g = parseInt(clean.substring(2, 4), 16) || 0;
    const b = parseInt(clean.substring(4, 6), 16) || 0;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum < 0.55;
  };

  // Sample actual ink/text color inside bounding box with highest contrast against background
  const sampleTextColor = useCallback(
    (xNorm: number, yNorm: number, wNorm: number, hNorm: number, bgHex: string): string => {
      const canvas = pageCanvasRef.current;
      if (!canvas) return isColorDark(bgHex) ? "#ffffff" : "#0f172a";
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return isColorDark(bgHex) ? "#ffffff" : "#0f172a";

      const cw = canvas.width;
      const ch = canvas.height;
      const px = Math.floor(xNorm * cw);
      const py = Math.floor(yNorm * ch);
      const pw = Math.max(4, Math.floor(wNorm * cw));
      const ph = Math.max(4, Math.floor(hNorm * ch));

      const cleanBg = bgHex.replace("#", "");
      const bgR = parseInt(cleanBg.substring(0, 2), 16) || 255;
      const bgG = parseInt(cleanBg.substring(2, 4), 16) || 255;
      const bgB = parseInt(cleanBg.substring(4, 6), 16) || 255;

      try {
        const imgData = ctx.getImageData(px, py, pw, ph).data;
        let maxContrast = -1;
        let bestR = isColorDark(bgHex) ? 255 : 15;
        let bestG = isColorDark(bgHex) ? 255 : 23;
        let bestB = isColorDark(bgHex) ? 255 : 42;

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
          if (dist > maxContrast && dist > 40) {
            maxContrast = dist;
            bestR = r;
            bestG = g;
            bestB = b;
          }
        }

        if (maxContrast > 50) {
          const hexR = bestR.toString(16).padStart(2, "0");
          const hexG = bestG.toString(16).padStart(2, "0");
          const hexB = bestB.toString(16).padStart(2, "0");
          return `#${hexR}${hexG}${hexB}`;
        }
      } catch {
        // ignore
      }

      return isColorDark(bgHex) ? "#ffffff" : "#0f172a";
    },
    []
  );

  // Generate seamless background-reconstructed patch so erasing or deleting a logo does NOT remove background
  const generateBackgroundInpaintPatch = useCallback(
    (xNorm: number, yNorm: number, wNorm: number, hNorm: number): string => {
      const canvas = pageCanvasRef.current;
      if (!canvas) return "";
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return "";

      const cw = canvas.width;
      const ch = canvas.height;
      const rx = Math.max(0, Math.min(cw - 1, Math.floor(xNorm * cw)));
      const ry = Math.max(0, Math.min(ch - 1, Math.floor(yNorm * ch)));
      const rw = Math.max(4, Math.min(cw - rx, Math.ceil(wNorm * cw)));
      const rh = Math.max(4, Math.min(ch - ry, Math.ceil(hNorm * ch)));

      try {
        const patchCanvas = document.createElement("canvas");
        patchCanvas.width = rw;
        patchCanvas.height = rh;
        const patchCtx = patchCanvas.getContext("2d");
        if (!patchCtx) return "";

        const ring = Math.min(8, Math.max(2, Math.round(Math.min(rw, rh) * 0.08)));
        const sampleX = Math.max(0, rx - ring);
        const sampleY = Math.max(0, ry - ring);
        const sampleW = Math.min(cw - sampleX, rw + ring * 2);
        const sampleH = Math.min(ch - sampleY, rh + ring * 2);

        const srcData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH).data;

        const getSamplePixel = (sx: number, sy: number) => {
          const cx = Math.max(0, Math.min(sampleW - 1, sx));
          const cy = Math.max(0, Math.min(sampleH - 1, sy));
          const idx = (cy * sampleW + cx) * 4;
          return [srcData[idx], srcData[idx + 1], srcData[idx + 2], srcData[idx + 3]];
        };

        const patchImgData = patchCtx.createImageData(rw, rh);
        const dest = patchImgData.data;
        const relX = rx - sampleX;
        const relY = ry - sampleY;

        for (let y = 0; y < rh; y++) {
          const wy = rh > 1 ? y / (rh - 1) : 0.5;
          for (let x = 0; x < rw; x++) {
            const wx = rw > 1 ? x / (rw - 1) : 0.5;

            const t = getSamplePixel(relX + x, Math.max(0, relY - 1));
            const b = getSamplePixel(relX + x, Math.min(sampleH - 1, relY + rh));
            const l = getSamplePixel(Math.max(0, relX - 1), relY + y);
            const r = getSamplePixel(Math.min(sampleW - 1, relX + rw), relY + y);

            const dIdx = (y * rw + x) * 4;
            for (let c = 0; c < 3; c++) {
              const vVal = t[c] * (1 - wy) + b[c] * wy;
              const hVal = l[c] * (1 - wx) + r[c] * wx;
              dest[dIdx + c] = Math.round((vVal + hVal) / 2);
            }
            dest[dIdx + 3] = 255;
          }
        }

        patchCtx.putImageData(patchImgData, 0, 0);
        return patchCanvas.toDataURL("image/png");
      } catch (err) {
        console.warn("Could not generate seamless background patch:", err);
        return "";
      }
    },
    []
  );

  // Directly delete logo / graphic while preserving the background 100%
  const handleDeleteLogo = useCallback(
    (target: {
      xNorm: number;
      yNorm: number;
      widthNorm: number;
      heightNorm: number;
      name?: string;
      id?: string;
    }) => {
      // 1. Generate seamless background patch for this exact region
      const patchDataUrl = generateBackgroundInpaintPatch(
        target.xNorm,
        target.yNorm,
        target.widthNorm,
        target.heightNorm
      );
      const bg = sampleBackgroundColor(
        target.xNorm,
        target.yNorm,
        target.widthNorm,
        target.heightNorm
      );

      // 2. Identify matching extracted PDF image(s) on current page
      const currentImages = extractedImages[activePageIndex] || [];
      const matchedImage = currentImages.find(
        (img) =>
          (target.name && img.name === target.name) ||
          (Math.abs(img.xNorm - target.xNorm) < 0.05 &&
            Math.abs(img.yNorm - target.yNorm) < 0.05 &&
            Math.abs(img.widthNorm - target.widthNorm) < 0.08)
      );

      const targetName = matchedImage?.name || target.name;
      if (targetName) {
        setDeletedImageNames((prev) =>
          prev.includes(targetName) ? prev : [...prev, targetName]
        );
      }

      // 3. Create clean inpaint annotation to conceal the logo and reconstruct the background seamlessly
      const newAnn: PdfAnnotation = {
        id: uid("logo-clean"),
        pageIndex: activePageIndex,
        type: "erase",
        eraseMode: "inpaint",
        deletedImageName: targetName,
        xNorm: target.xNorm,
        yNorm: target.yNorm,
        widthNorm: target.widthNorm,
        heightNorm: target.heightNorm,
        fillColor: bg,
        imageDataUrl: patchDataUrl || undefined
      };

      setHistory((prev) => [...prev.slice(-30), annotations]);
      setRedoStack([]);
      setAnnotations([...annotations, newAnn]);
      setSelectedId(null);
      setSelectedImageItem(null);
      notify("Logo removed cleanly without affecting background!", "success");
    },
    [
      generateBackgroundInpaintPatch,
      sampleBackgroundColor,
      extractedImages,
      activePageIndex,
      annotations,
      notify
    ]
  );

  // Find nearest or overlapping detected text item on current page
  const findTextItemAtPoint = useCallback(
    (xNorm: number, yNorm: number, tolerance = 0.03): PdfExtractedTextItem | null => {
      const items = extractedTexts[activePageIndex] || [];
      for (const item of items) {
        if (
          xNorm >= item.xNorm - 0.01 &&
          xNorm <= item.xNorm + item.widthNorm + 0.01 &&
          yNorm >= item.yNorm - 0.012 &&
          yNorm <= item.yNorm + item.heightNorm + 0.012
        ) {
          return item;
        }
      }
      let closest: PdfExtractedTextItem | null = null;
      let minDist = tolerance;
      for (const item of items) {
        const centerX = item.xNorm + item.widthNorm / 2;
        const centerY = item.yNorm + item.heightNorm / 2;
        const dist = Math.hypot(xNorm - centerX, yNorm - centerY);
        if (dist < minDist) {
          minDist = dist;
          closest = item;
        }
      }
      return closest;
    },
    [extractedTexts, activePageIndex]
  );

  // Push history snapshot
  const pushHistory = useCallback((nextState: PdfAnnotation[]) => {
    setHistory((prev) => [...prev.slice(-30), annotations]);
    setRedoStack([]);
    setAnnotations(nextState);
  }, [annotations]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [annotations, ...prev]);
    setHistory((prev) => prev.slice(0, -1));
    setAnnotations(previous);
    setSelectedId(null);
    notify("Action undone", "info");
  }, [history, annotations, notify]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory((prev) => [...prev, annotations]);
    setRedoStack((prev) => prev.slice(1));
    setAnnotations(next);
    notify("Action redone", "info");
  }, [redoStack, annotations, notify]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in text input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "h")) {
        e.preventDefault();
        setFindAndReplaceOpen((prev) => !prev);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedImageItem) {
          e.preventDefault();
          handleDeleteLogo(selectedImageItem);
        } else if (selectedId && !editingTextId) {
          e.preventDefault();
          deleteAnnotation(selectedId);
        }
      } else if (e.key.toLowerCase() === "v") {
        setActiveTool("select");
      } else if (e.key.toLowerCase() === "e") {
        setActiveTool("editText");
      } else if (e.key.toLowerCase() === "w") {
        setActiveTool("eraseAndType");
      } else if (e.key.toLowerCase() === "x") {
        setActiveTool("erase");
      } else if (e.key.toLowerCase() === "t") {
        setActiveTool("text");
      } else if (e.key.toLowerCase() === "p") {
        setActiveTool("draw");
      } else if (e.key.toLowerCase() === "h") {
        setActiveTool("highlight");
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (re) => {
              const dataUrl = re.target?.result as string;
              if (dataUrl) {
                const newAnn: PdfAnnotation = {
                  id: uid("img-pasted"),
                  pageIndex: activePageIndex,
                  type: "image",
                  xNorm: 0.35,
                  yNorm: 0.35,
                  widthNorm: 0.3,
                  heightNorm: 0.2,
                  imageDataUrl: dataUrl
                };
                pushHistory([...annotations, newAnn]);
                setSelectedId(newAnn.id);
                notify("Pasted image/logo added to document", "success");
              }
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handlePaste);
    };
  }, [selectedId, selectedImageItem, editingTextId, handleUndo, handleRedo, handleDeleteLogo, activePageIndex, annotations, pushHistory, notify]);

  // Handle editing detected text in place with exact font size and style matching
  const handleEditDetectedText = (item: PdfExtractedTextItem) => {
    // Check if an annotation already exists at this exact position
    const existing = annotations.find(
      (a) =>
        a.pageIndex === activePageIndex &&
        Math.abs(a.xNorm - item.xNorm) < 0.015 &&
        Math.abs(a.yNorm - item.yNorm) < 0.015
    );
    if (existing) {
      setSelectedId(existing.id);
      setEditingTextId(existing.id);
      if (existing.fontSize) setFontSize(existing.fontSize);
      if (existing.fontFamily) setFontFamily(existing.fontFamily);
      setIsBold(existing.fontWeight === "bold");
      setIsItalic(existing.fontStyle === "italic");
      if (existing.textColor) setActiveColor(existing.textColor);
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }

    const matchedBg = sampleBackgroundColor(
      item.xNorm,
      item.yNorm,
      Math.max(0.04, item.widthNorm),
      Math.max(0.022, item.heightNorm)
    );

    const matchedTextColor = sampleTextColor(
      item.xNorm,
      item.yNorm,
      item.widthNorm,
      item.heightNorm,
      matchedBg
    );

    const boxHeightNorm = Math.max(
      item.heightNorm,
      ((item.fontSize || 14) * 1.35) / pageDimensions.height
    );
    const boxWidthNorm = Math.max(item.widthNorm, 0.04);

    const newAnn: PdfAnnotation = {
      id: uid("txt-edit"),
      pageIndex: activePageIndex,
      type: "text",
      xNorm: item.xNorm,
      yNorm: item.yNorm,
      widthNorm: boxWidthNorm,
      heightNorm: boxHeightNorm,
      text: item.text,
      fontSize: item.fontSize,
      fontFamily: item.fontFamily,
      fontWeight: item.fontWeight,
      fontStyle: item.fontStyle,
      actualFontName: item.actualFontName,
      textColor: matchedTextColor,
      textHighlightColor: matchedBg,
      underlayWhiteout: true,
      whiteoutColor: matchedBg,
      isOriginalTextEdit: true,
      originalText: item.text
    };

    // Synchronize toolbar controls so active state matches clicked text
    setFontSize(item.fontSize);
    setFontFamily(item.fontFamily);
    setIsBold(item.fontWeight === "bold");
    setIsItalic(item.fontStyle === "italic");
    setActiveColor(matchedTextColor);

    pushHistory([...annotations, newAnn]);
    setSelectedId(newAnn.id);
    setEditingTextId(newAnn.id);
    setActiveTool("select");
    const fontDesc = `${item.actualFontName || item.fontFamily} ${item.fontSize}pt${item.fontWeight === "bold" ? " Bold" : ""}${item.fontStyle === "italic" ? " Italic" : ""}`;
    notify(`Editing text (Matched: ${fontDesc})`, "info");
    setTimeout(() => textInputRef.current?.focus(), 50);
  };

  // Convert all detected text on current page to editable blocks
  const handleMakeAllTextEditable = () => {
    const pageItems = extractedTexts[activePageIndex] || [];
    if (pageItems.length === 0) {
      notify("No text detected on this page", "info");
      return;
    }

    const newAnns: PdfAnnotation[] = [];
    for (const item of pageItems) {
      const alreadyExists = annotations.some(
        (a) =>
          a.pageIndex === activePageIndex &&
          Math.abs(a.xNorm - item.xNorm) < 0.015 &&
          Math.abs(a.yNorm - item.yNorm) < 0.015
      );
      if (!alreadyExists) {
        const matchedBg = sampleBackgroundColor(
          item.xNorm,
          item.yNorm,
          Math.max(0.04, item.widthNorm),
          Math.max(0.022, item.heightNorm)
        );
        const matchedTextColor = sampleTextColor(
          item.xNorm,
          item.yNorm,
          item.widthNorm,
          item.heightNorm,
          matchedBg
        );
        const boxHeightNorm = Math.max(
          item.heightNorm,
          ((item.fontSize || 14) * 1.35) / pageDimensions.height
        );
        newAnns.push({
          id: uid("txt-all"),
          pageIndex: activePageIndex,
          type: "text",
          xNorm: item.xNorm,
          yNorm: item.yNorm,
          widthNorm: Math.max(0.04, item.widthNorm),
          heightNorm: boxHeightNorm,
          text: item.text,
          fontSize: item.fontSize,
          fontFamily: item.fontFamily,
          fontWeight: item.fontWeight,
          fontStyle: item.fontStyle,
          actualFontName: item.actualFontName,
          textColor: matchedTextColor,
          textHighlightColor: matchedBg,
          underlayWhiteout: true,
          whiteoutColor: matchedBg,
          isOriginalTextEdit: true,
          originalText: item.text
        });
      }
    }

    if (newAnns.length > 0) {
      pushHistory([...annotations, ...newAnns]);
      notify(`Converted ${newAnns.length} text blocks on page to editable with matched fonts!`, "success");
    } else {
      notify("All text blocks on this page are already editable", "info");
    }
  };

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const getFindMatches = () => {
    if (!findQuery.trim()) return [];
    const query = findQuery.trim();
    const flags = findCaseSensitive ? "g" : "gi";
    const regex = new RegExp(escapeRegex(query), flags);

    const matches: Array<{
      pageIndex: number;
      text: string;
      item?: PdfExtractedTextItem;
      ann?: PdfAnnotation;
    }> = [];

    if (findScope === "page") {
      for (const a of annotations.filter((x) => x.pageIndex === activePageIndex)) {
        if (a.text && regex.test(a.text)) {
          matches.push({ pageIndex: activePageIndex, text: a.text, ann: a });
        }
      }
      for (const item of extractedTexts[activePageIndex] || []) {
        if (regex.test(item.text)) {
          matches.push({ pageIndex: activePageIndex, text: item.text, item });
        }
      }
    } else {
      for (const a of annotations) {
        if (a.text && regex.test(a.text)) {
          matches.push({ pageIndex: a.pageIndex, text: a.text, ann: a });
        }
      }
      for (const [pIdxStr, items] of Object.entries(extractedTexts)) {
        const pIdx = Number(pIdxStr);
        for (const item of items) {
          if (regex.test(item.text)) {
            matches.push({ pageIndex: pIdx, text: item.text, item });
          }
        }
      }
    }
    return matches;
  };

  const handleReplaceAll = () => {
    if (!findQuery.trim()) return;
    const matches = getFindMatches();
    if (matches.length === 0) {
      notify(`No matches found for "${findQuery}"`, "info");
      return;
    }

    const query = findQuery.trim();
    const flags = findCaseSensitive ? "g" : "gi";
    const regex = new RegExp(escapeRegex(query), flags);

    let nextAnns = [...annotations];
    let replacedCount = 0;

    for (const match of matches) {
      if (match.ann) {
        nextAnns = nextAnns.map((a) => {
          if (a.id === match.ann!.id) {
            replacedCount++;
            return {
              ...a,
              text: (a.text || "").replace(regex, replaceQuery),
              underlayWhiteout: true,
              whiteoutColor: a.whiteoutColor || "#ffffff"
            };
          }
          return a;
        });
      } else if (match.item) {
        const item = match.item;
        replacedCount++;
        const newText = item.text.replace(regex, replaceQuery);
        const matchedBg =
          match.pageIndex === activePageIndex
            ? sampleBackgroundColor(
                item.xNorm,
                item.yNorm,
                Math.max(0.04, item.widthNorm),
                Math.max(0.022, item.heightNorm)
              )
            : "#ffffff";
        let textColor = item.color || "#0f172a";
        if (isColorDark(matchedBg) && (!item.color || !isColorDark(item.color))) {
          textColor = "#ffffff";
        }
        nextAnns.push({
          id: uid("txt-replace"),
          pageIndex: match.pageIndex,
          type: "text",
          xNorm: item.xNorm,
          yNorm: item.yNorm,
          widthNorm: Math.max(0.04, item.widthNorm),
          heightNorm: Math.max(0.022, item.heightNorm),
          text: newText,
          fontSize: item.fontSize,
          fontFamily: item.fontFamily,
          fontWeight: item.fontWeight,
          fontStyle: item.fontStyle,
          textColor,
          textHighlightColor: matchedBg,
          underlayWhiteout: true,
          whiteoutColor: matchedBg,
          isOriginalTextEdit: true,
          originalText: item.text
        });
      }
    }

    pushHistory(nextAnns);
    notify(`Replaced ${replacedCount} occurrence(s) with "${replaceQuery}"`, "success");
    setFindAndReplaceOpen(false);
  };

  // Delete single annotation
  const deleteAnnotation = (id: string) => {
    pushHistory(annotations.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingTextId === id) setEditingTextId(null);
    notify("Annotation deleted", "info");
  };

  // Duplicate single annotation
  const duplicateAnnotation = (id: string) => {
    const target = annotations.find((a) => a.id === id);
    if (!target) return;
    const duplicated: PdfAnnotation = {
      ...target,
      id: uid("ann"),
      xNorm: Math.min(0.9, target.xNorm + 0.03),
      yNorm: Math.min(0.9, target.yNorm + 0.03)
    };
    pushHistory([...annotations, duplicated]);
    setSelectedId(duplicated.id);
    notify("Annotation duplicated", "info");
  };

  // Clear current page annotations
  const clearCurrentPageAnnotations = () => {
    const remaining = annotations.filter((a) => a.pageIndex !== activePageIndex);
    pushHistory(remaining);
    setSelectedId(null);
    notify(`Cleared annotations on Page ${activePageIndex + 1}`, "info");
  };

  // Page Operations
  const rotateCurrentPage = () => {
    setPagesPlan((prev) =>
      prev.map((p, idx) =>
        idx === activePageIndex ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
    notify(`Rotated Page ${activePageIndex + 1} by 90°`, "info");
  };

  const duplicateCurrentPage = () => {
    const current = pagesPlan[activePageIndex];
    if (!current) return;
    const newPlanItem: EditorPagePlanItem = {
      id: `page-${uid("copy")}`,
      originalPage: current.originalPage,
      rotation: current.rotation
    };
    const nextPages = [...pagesPlan];
    nextPages.splice(activePageIndex + 1, 0, newPlanItem);
    setPagesPlan(nextPages);
    setActivePageIndex(activePageIndex + 1);
    notify(`Duplicated Page ${activePageIndex + 1}`, "success");
  };

  const deleteCurrentPage = () => {
    if (pagesPlan.length <= 1) {
      notify("Cannot delete the only page in the document.", "error");
      return;
    }
    const nextPages = pagesPlan.filter((_, idx) => idx !== activePageIndex);
    // Remove annotations on this page and re-index higher pages
    const updatedAnnotations = annotations
      .filter((a) => a.pageIndex !== activePageIndex)
      .map((a) => (a.pageIndex > activePageIndex ? { ...a, pageIndex: a.pageIndex - 1 } : a));

    setPagesPlan(nextPages);
    setAnnotations(updatedAnnotations);
    setActivePageIndex(Math.max(0, activePageIndex - 1));
    notify("Page removed from document", "info");
  };

  const addBlankPage = () => {
    const newPlanItem: EditorPagePlanItem = {
      id: `blank-${uid("blank")}`,
      originalPage: null, // blank
      rotation: 0
    };
    const nextPages = [...pagesPlan];
    nextPages.splice(activePageIndex + 1, 0, newPlanItem);
    setPagesPlan(nextPages);
    setActivePageIndex(activePageIndex + 1);
    notify("Inserted blank A4 page", "success");
  };

  // Stage pointer events
  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pageContainerRef.current) return;
    const rect = pageContainerRef.current.getBoundingClientRect();
    const xNorm = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const yNorm = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (isEyedropperActive) {
      const pickedColor = getPixelColorAtPoint(xNorm, yNorm);
      setEraseColor(pickedColor);
      setActiveColor(pickedColor);
      setIsEyedropperActive(false);

      if (selectedId) {
        setAnnotations((prev) =>
          prev.map((a) => {
            if (a.id !== selectedId) return a;
            if (a.type === "erase" || a.type === "redact" || a.type === "highlight") {
              return { ...a, fillColor: pickedColor };
            }
            if (a.type === "text") {
              const contrastColor = isColorDark(pickedColor) ? "#ffffff" : "#0f172a";
              return {
                ...a,
                underlayWhiteout: true,
                whiteoutColor: pickedColor,
                textHighlightColor: pickedColor,
                textColor: a.textColor === "#ffffff" || a.textColor === "#0f172a" ? contrastColor : a.textColor
              };
            }
            return a;
          })
        );
      }
      notify(`Sampled color ${pickedColor.toUpperCase()} from document`, "success");
      return;
    }

    if (activeTool === "select" || activeTool === "editText") {
      // If clicking outside any annotation, deselect
      if (!(e.target as HTMLElement).closest(".pdf-annotation-box")) {
        setSelectedId(null);
        setEditingTextId(null);
      }
      return;
    }

    if (activeTool === "erase") {
      setIsInteracting(true);
      setInteractionStart({ x: xNorm, y: yNorm });
      setTempShape({ x: xNorm, y: yNorm, w: 0, h: 0 });
      return;
    }

    if (activeTool === "eraseAndType") {
      setIsInteracting(true);
      setInteractionStart({ x: xNorm, y: yNorm });
      setTempShape({ x: xNorm, y: yNorm, w: 0, h: 0 });
      return;
    }

    if (activeTool === "text") {
      // Check if clicking on or near an existing detected text item to match its font style and size!
      const matchedItem = findTextItemAtPoint(xNorm, yNorm);
      if (matchedItem) {
        handleEditDetectedText(matchedItem);
        return;
      }

      // Add text box at clicked location with current active font properties
      const boxHeightNorm = Math.max(0.06, ((fontSize || 14) * 1.35) / pageDimensions.height);
      const newTextAnn: PdfAnnotation = {
        id: uid("text"),
        pageIndex: activePageIndex,
        type: "text",
        xNorm: Math.min(0.75, xNorm),
        yNorm: Math.min(0.9, yNorm),
        widthNorm: 0.28,
        heightNorm: boxHeightNorm,
        text: "Click to edit text",
        fontSize,
        fontFamily,
        fontWeight: isBold ? "bold" : "normal",
        fontStyle: isItalic ? "italic" : "normal",
        textColor: activeColor,
        textHighlightColor: textHighlight
      };
      pushHistory([...annotations, newTextAnn]);
      setSelectedId(newTextAnn.id);
      setEditingTextId(newTextAnn.id);
      setActiveTool("select");
      notify("Text added. Type to edit content.", "info");
      return;
    }

    if (activeTool === "stamp") {
      const stampText = customStampText.trim() || selectedStamp.label;
      const newStampAnn: PdfAnnotation = {
        id: uid("stamp"),
        pageIndex: activePageIndex,
        type: "stamp",
        xNorm: Math.max(0.05, Math.min(0.75, xNorm - 0.12)),
        yNorm: Math.max(0.05, Math.min(0.9, yNorm - 0.03)),
        widthNorm: 0.24,
        heightNorm: 0.07,
        stampLabel: stampText,
        stampColor: selectedStamp.color
      };
      pushHistory([...annotations, newStampAnn]);
      setSelectedId(newStampAnn.id);
      setActiveTool("select");
      notify(`Stamped '${stampText}' onto document`, "success");
      return;
    }

    if (activeTool === "forms") {
      if (formSymbol === "checkbox") {
        const newRectAnn: PdfAnnotation = {
          id: uid("form-chk"),
          pageIndex: activePageIndex,
          type: "rectangle",
          xNorm: Math.max(0.01, Math.min(0.97, xNorm - 0.012)),
          yNorm: Math.max(0.01, Math.min(0.97, yNorm - 0.01)),
          widthNorm: 0.025,
          heightNorm: 0.02,
          strokeWidth: 2,
          strokeColor: activeColor || "#0f172a",
          fillColor: "transparent"
        };
        pushHistory([...annotations, newRectAnn]);
        setSelectedId(newRectAnn.id);
        setActiveTool("select");
        notify("Checkbox placed! Drag or resize as needed.", "success");
        return;
      }

      const charMap: Record<string, string> = {
        check: "✓",
        cross: "✕",
        radio: "●"
      };
      const symbolChar = charMap[formSymbol] || "✓";
      const symbolColor =
        formSymbol === "cross"
          ? "#dc2626"
          : formSymbol === "check"
          ? "#16a34a"
          : activeColor || "#0f172a";

      const newSymbolAnn: PdfAnnotation = {
        id: uid("form-sym"),
        pageIndex: activePageIndex,
        type: "text",
        xNorm: Math.max(0.01, Math.min(0.97, xNorm - 0.015)),
        yNorm: Math.max(0.01, Math.min(0.97, yNorm - 0.015)),
        widthNorm: 0.035,
        heightNorm: 0.03,
        text: symbolChar,
        fontSize: formSymbol === "radio" ? 18 : 22,
        fontFamily: "sans",
        fontWeight: "bold",
        textColor: symbolColor,
        textHighlightColor: "transparent"
      };
      pushHistory([...annotations, newSymbolAnn]);
      setSelectedId(newSymbolAnn.id);
      setActiveTool("select");
      notify(`Placed ${symbolChar} onto form!`, "success");
      return;
    }

    if (activeTool === "image" && pendingImageUrl) {
      const newImageAnn: PdfAnnotation = {
        id: uid("image"),
        pageIndex: activePageIndex,
        type: "image",
        xNorm: Math.max(0.05, Math.min(0.7, xNorm - 0.12)),
        yNorm: Math.max(0.05, Math.min(0.8, yNorm - 0.1)),
        widthNorm: 0.25,
        heightNorm: 0.2,
        imageDataUrl: pendingImageUrl
      };
      pushHistory([...annotations, newImageAnn]);
      setSelectedId(newImageAnn.id);
      setActiveTool("select");
      notify("Image inserted onto page", "success");
      return;
    }

    // Start drawing or shape rubber-banding
    setIsInteracting(true);
    setInteractionStart({ x: xNorm, y: yNorm });

    if (activeTool === "draw") {
      setCurrentDrawPoints([{ x: xNorm, y: yNorm }]);
    } else {
      setTempShape({ x: xNorm, y: yNorm, w: 0, h: 0 });
    }
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pageContainerRef.current) return;
    const rect = pageContainerRef.current.getBoundingClientRect();
    const xNorm = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const yNorm = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    // Handle dragging existing annotation
    if (draggingId) {
      setAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== draggingId) return a;
          const newX = Math.max(0, Math.min(1 - a.widthNorm, xNorm - dragOffset.xNorm));
          const newY = Math.max(0, Math.min(1 - a.heightNorm, yNorm - dragOffset.yNorm));
          return { ...a, xNorm: newX, yNorm: newY };
        })
      );
      return;
    }

    // Handle resizing existing annotation
    if (resizingId && resizeInitial && resizeHandle) {
      const dx = xNorm - resizeInitial.pointerX;
      const dy = yNorm - resizeInitial.pointerY;

      setAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== resizingId) return a;
          let nx = resizeInitial.xNorm;
          let ny = resizeInitial.yNorm;
          let nw = resizeInitial.wNorm;
          let nh = resizeInitial.hNorm;

          if (resizeHandle.includes("e")) nw = Math.max(0.04, resizeInitial.wNorm + dx);
          if (resizeHandle.includes("s")) nh = Math.max(0.02, resizeInitial.hNorm + dy);
          if (resizeHandle.includes("w")) {
            const possibleW = Math.max(0.04, resizeInitial.wNorm - dx);
            nx = resizeInitial.xNorm + (resizeInitial.wNorm - possibleW);
            nw = possibleW;
          }
          if (resizeHandle.includes("n")) {
            const possibleH = Math.max(0.02, resizeInitial.hNorm - dy);
            ny = resizeInitial.yNorm + (resizeInitial.hNorm - possibleH);
            nh = possibleH;
          }

          return { ...a, xNorm: nx, yNorm: ny, widthNorm: nw, heightNorm: nh };
        })
      );
      return;
    }

    // Freehand drawing points
    if (isInteracting && activeTool === "draw") {
      setCurrentDrawPoints((prev) => [...prev, { x: xNorm, y: yNorm }]);
      return;
    }

    // Rubber-band shapes (rectangle, circle, line, arrow, redact, highlight)
    if (isInteracting && interactionStart) {
      const minX = Math.min(interactionStart.x, xNorm);
      const minY = Math.min(interactionStart.y, yNorm);
      const w = Math.abs(xNorm - interactionStart.x);
      const h = Math.abs(yNorm - interactionStart.y);
      setTempShape({ x: minX, y: minY, w, h });
    }
  };

  const handleStagePointerUp = () => {
    // Finish drag
    if (draggingId) {
      setDraggingId(null);
      pushHistory(annotations);
      return;
    }

    // Finish resize
    if (resizingId) {
      setResizingId(null);
      setResizeHandle(null);
      setResizeInitial(null);
      pushHistory(annotations);
      return;
    }

    if (!isInteracting) return;
    setIsInteracting(false);

    if (activeTool === "draw" && currentDrawPoints.length > 1) {
      const xs = currentDrawPoints.map((p) => p.x);
      const ys = currentDrawPoints.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const newDrawAnn: PdfAnnotation = {
        id: uid("draw"),
        pageIndex: activePageIndex,
        type: "freehand",
        xNorm: minX,
        yNorm: minY,
        widthNorm: Math.max(0.02, maxX - minX),
        heightNorm: Math.max(0.02, maxY - minY),
        points: currentDrawPoints,
        strokeColor: activeColor,
        strokeWidth
      };
      pushHistory([...annotations, newDrawAnn]);
      setSelectedId(newDrawAnn.id);
      setCurrentDrawPoints([]);
      setActiveTool("select");
      notify("Drawing saved", "info");
      return;
    }

    if (tempShape && tempShape.w > 0.01 && tempShape.h > 0.01) {
      if (activeTool === "erase") {
        const fillColor = eraseColorAutoMatch
          ? sampleBackgroundColor(tempShape.x, tempShape.y, tempShape.w, tempShape.h)
          : eraseColor;
        const patchDataUrl = generateBackgroundInpaintPatch(
          tempShape.x,
          tempShape.y,
          tempShape.w,
          tempShape.h
        );

        // Check if any extracted images intersect this erased area
        const currentImages = extractedImages[activePageIndex] || [];
        const intersectingImages = currentImages.filter(
          (img) =>
            img.xNorm < tempShape.x + tempShape.w &&
            img.xNorm + img.widthNorm > tempShape.x &&
            img.yNorm < tempShape.y + tempShape.h &&
            img.yNorm + img.heightNorm > tempShape.y
        );
        if (intersectingImages.length > 0) {
          const names = intersectingImages.map((i) => i.name);
          setDeletedImageNames((prev) => Array.from(new Set([...prev, ...names])));
        }

        const newEraseAnn: PdfAnnotation = {
          id: uid("erase"),
          pageIndex: activePageIndex,
          type: "erase",
          eraseMode: "inpaint",
          deletedImageName: intersectingImages[0]?.name,
          xNorm: tempShape.x,
          yNorm: tempShape.y,
          widthNorm: tempShape.w,
          heightNorm: tempShape.h,
          fillColor,
          imageDataUrl: patchDataUrl || undefined
        };
        pushHistory([...annotations, newEraseAnn]);
        setSelectedId(newEraseAnn.id);
        setActiveTool("select");
        notify(
          intersectingImages.length > 0
            ? "Logo removed cleanly without affecting background!"
            : "Area erased cleanly without affecting background!",
          "success"
        );
        setTempShape(null);
        setInteractionStart(null);
        return;
      }

      if (activeTool === "eraseAndType") {
        const bg = eraseColorAutoMatch
          ? sampleBackgroundColor(tempShape.x, tempShape.y, tempShape.w, tempShape.h)
          : eraseColor;

        // Detect underlying text intersecting this erased box to inherit its font style & size!
        const shapeRight = tempShape.x + tempShape.w;
        const shapeBottom = tempShape.y + tempShape.h;
        const overlapping = (extractedTexts[activePageIndex] || []).filter((item) => {
          const itemRight = item.xNorm + item.widthNorm;
          const itemBottom = item.yNorm + item.heightNorm;
          return (
            item.xNorm < shapeRight &&
            itemRight > tempShape.x &&
            item.yNorm < shapeBottom &&
            itemBottom > tempShape.y
          );
        });

        const targetItem = overlapping[0];
        const targetFontSize = targetItem?.fontSize || fontSize;
        const targetFontFamily = targetItem?.fontFamily || fontFamily;
        const targetFontWeight = targetItem ? targetItem.fontWeight : isBold ? "bold" : "normal";
        const targetFontStyle = targetItem ? targetItem.fontStyle : isItalic ? "italic" : "normal";
        const targetActualFont = targetItem?.actualFontName;
        const txtColor = sampleTextColor(tempShape.x, tempShape.y, tempShape.w, tempShape.h, bg);

        // Synchronize active toolbar controls to the matched font
        setFontSize(targetFontSize);
        setFontFamily(targetFontFamily);
        setIsBold(targetFontWeight === "bold");
        setIsItalic(targetFontStyle === "italic");
        setActiveColor(txtColor);

        const newEraseAnn: PdfAnnotation = {
          id: uid("txt-erase"),
          pageIndex: activePageIndex,
          type: "text",
          xNorm: tempShape.x,
          yNorm: tempShape.y,
          widthNorm: Math.max(0.04, tempShape.w),
          heightNorm: Math.max(
            tempShape.h,
            (targetFontSize * 1.35) / pageDimensions.height
          ),
          text: "",
          fontSize: targetFontSize,
          fontFamily: targetFontFamily,
          fontWeight: targetFontWeight,
          fontStyle: targetFontStyle,
          actualFontName: targetActualFont,
          textColor: txtColor,
          textHighlightColor: bg,
          underlayWhiteout: true,
          whiteoutColor: bg,
          isOriginalTextEdit: true,
          originalText: targetItem?.text
        };
        pushHistory([...annotations, newEraseAnn]);
        setSelectedId(newEraseAnn.id);
        setEditingTextId(newEraseAnn.id);
        setActiveTool("select");
        const fontDesc = `${targetActualFont || targetFontFamily} ${targetFontSize}pt${targetFontWeight === "bold" ? " Bold" : ""}`;
        notify(`Erased selection. Matched font: ${fontDesc}. Type replacement text.`, "success");
        setTimeout(() => textInputRef.current?.focus(), 50);
        setTempShape(null);
        setInteractionStart(null);
        return;
      }

      let created: PdfAnnotation | null = null;

      if (activeTool === "highlight") {
        created = {
          id: uid("hl"),
          pageIndex: activePageIndex,
          type: "highlight",
          xNorm: tempShape.x,
          yNorm: tempShape.y,
          widthNorm: tempShape.w,
          heightNorm: tempShape.h,
          fillColor: highlightColor,
          opacity: 0.45
        };
      } else if (activeTool === "redact") {
        created = {
          id: uid("redact"),
          pageIndex: activePageIndex,
          type: "redact",
          xNorm: tempShape.x,
          yNorm: tempShape.y,
          widthNorm: tempShape.w,
          heightNorm: tempShape.h,
          fillColor: redactColor
        };
      } else if (activeTool === "rectangle") {
        created = {
          id: uid("rect"),
          pageIndex: activePageIndex,
          type: "rectangle",
          xNorm: tempShape.x,
          yNorm: tempShape.y,
          widthNorm: tempShape.w,
          heightNorm: tempShape.h,
          strokeColor: activeColor,
          strokeWidth,
          fillColor: "transparent"
        };
      } else if (activeTool === "circle") {
        created = {
          id: uid("circle"),
          pageIndex: activePageIndex,
          type: "circle",
          xNorm: tempShape.x,
          yNorm: tempShape.y,
          widthNorm: tempShape.w,
          heightNorm: tempShape.h,
          strokeColor: activeColor,
          strokeWidth,
          fillColor: "transparent"
        };
      } else if (activeTool === "line") {
        created = {
          id: uid("line"),
          pageIndex: activePageIndex,
          type: "line",
          xNorm: tempShape.x,
          yNorm: tempShape.y,
          widthNorm: tempShape.w,
          heightNorm: tempShape.h,
          strokeColor: activeColor,
          strokeWidth
        };
      } else if (activeTool === "arrow") {
        created = {
          id: uid("arrow"),
          pageIndex: activePageIndex,
          type: "arrow",
          xNorm: tempShape.x,
          yNorm: tempShape.y,
          widthNorm: tempShape.w,
          heightNorm: tempShape.h,
          strokeColor: activeColor,
          strokeWidth
        };
      }

      if (created) {
        pushHistory([...annotations, created]);
        setSelectedId(created.id);
        setActiveTool("select");
        notify(`${created.type.toUpperCase()} element placed`, "info");
      }
    }

    setTempShape(null);
    setInteractionStart(null);
  };

  // Image Upload handler for Insert Image tool
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setPendingImageUrl(result);
        setActiveTool("image");
        notify("Image loaded! Click anywhere on the document to place it.", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  // Signature creation logic
  const handlePlaceSignature = (dataUrl: string) => {
    const newSigAnn: PdfAnnotation = {
      id: uid("sig"),
      pageIndex: activePageIndex,
      type: "image",
      xNorm: 0.35,
      yNorm: 0.65,
      widthNorm: 0.28,
      heightNorm: 0.12,
      imageDataUrl: dataUrl
    };
    pushHistory([...annotations, newSigAnn]);
    setSelectedId(newSigAnn.id);
    setShowSignModal(false);
    setActiveTool("select");
    notify("Signature placed on page. Drag to adjust position!", "success");
  };

  // Compile & Export PDF
  const handleExport = async () => {
    if (!info) return;
    setExporting(true);
    try {
      notify("Compiling vector annotations & PDF pages...", "info");
      const blob = await compileEditedPdf(info.file, pagesPlan, annotations, deletedImageNames);
      const safeName = info.file.name.replace(/\.[^.]+$/, "");
      const outputFilename = `${safeName}-edited.pdf`;

      const finalFile = new File([blob], outputFilename, { type: "application/pdf" });
      setEditedFile(finalFile);
      downloadBlob(blob, outputFilename);
      setShowExportSuccessModal(true);
      notify("Changes applied successfully! Document is ready.", "success");
    } catch (err) {
      console.error(err);
      notify("Failed to compile edited PDF. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  const selectedAnnotation = annotations.find((a) => a.id === selectedId);
  const pageAnnotations = annotations.filter((a) => a.pageIndex === activePageIndex);

  // Synchronize toolbar controls with selected text annotation font style and size
  useEffect(() => {
    if (selectedAnnotation && selectedAnnotation.type === "text") {
      if (selectedAnnotation.fontSize) setFontSize(selectedAnnotation.fontSize);
      if (selectedAnnotation.fontFamily) setFontFamily(selectedAnnotation.fontFamily);
      setIsBold(selectedAnnotation.fontWeight === "bold");
      setIsItalic(selectedAnnotation.fontStyle === "italic");
      if (selectedAnnotation.textColor) setActiveColor(selectedAnnotation.textColor);
    }
  }, [selectedId, selectedAnnotation]);

  if (!info) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
                <FilePenLine size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">PDF Editor</h2>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    PRO Suite
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Full in-browser PDF suite: Edit text, freehand draw, highlight, redact, stamp & insert images.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={14} />
                100% In-Browser & Private
              </span>
            </div>
          </div>
        </div>

        <UploadZone
          accept="application/pdf"
          files={[]}
          formats="PDF"
          onFiles={load}
          onRemove={() => {
            setInfo(null);
            setPagesPlan([]);
            setAnnotations([]);
          }}
          label="Drop your PDF here to edit"
          helperText="Supports multi-page contracts, legal forms, application PDFs, certificates & marksheets"
        />

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 dark:border-white/[0.06] dark:bg-slate-900/50 text-center">
            <Type size={20} className="mx-auto text-blue-500" />
            <h4 className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">Text & Fonts</h4>
            <p className="mt-0.5 text-[10px] text-slate-400">Add custom text, sizes, colors & highlights</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 dark:border-white/[0.06] dark:bg-slate-900/50 text-center">
            <PenTool size={20} className="mx-auto text-indigo-500" />
            <h4 className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">Draw & Highlight</h4>
            <p className="mt-0.5 text-[10px] text-slate-400">Smooth pen sketching & transparent markers</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 dark:border-white/[0.06] dark:bg-slate-900/50 text-center">
            <EyeOff size={20} className="mx-auto text-rose-500" />
            <h4 className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">Permanent Redact</h4>
            <p className="mt-0.5 text-[10px] text-slate-400">Blackout or whiteout confidential details</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 dark:border-white/[0.06] dark:bg-slate-900/50 text-center">
            <Stamp size={20} className="mx-auto text-emerald-500" />
            <h4 className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">Stamps & Signatures</h4>
            <p className="mt-0.5 text-[10px] text-slate-400">Approved, confidential & cursive signs</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header & Workstation Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-3.5 sm:p-4 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
            <FilePenLine size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                {info.file.name}
              </h3>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {formatBytes(info.file.size)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Page {activePageIndex + 1} of {pagesPlan.length} • {pageAnnotations.length} annotation(s)
            </p>
          </div>
        </div>

        {/* Global Controls (Undo, Redo, Zoom, Clear) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={15} />
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-white/[0.1] mx-0.5" />

          {/* Zoom Controls */}
          <button
            type="button"
            onClick={() => setZoomScale((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
            className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="min-w-[40px] text-center font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomScale((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))))}
            className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (pageDimensions.width > 0 && typeof window !== "undefined") {
                const availWidth = Math.min(window.innerWidth - 48, 1200);
                const fit = Math.max(0.4, Math.min(1.2, Number((availWidth / pageDimensions.width).toFixed(2))));
                setZoomScale(fit);
              }
            }}
            className="hidden xs:inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 h-8 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200"
            title="Fit to screen width"
          >
            Fit
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-white/[0.1] mx-0.5" />

          {/* Find & Replace button */}
          <button
            type="button"
            onClick={() => setFindAndReplaceOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 h-8 text-xs font-bold transition-all ${
              findAndReplaceOpen
                ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs ring-2 ring-blue-500/20"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200"
            }`}
            title="Find & Replace text across PDF (Ctrl+F)"
          >
            <Replace size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Find & Replace</span>
            <span className="text-[10px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
              ^F
            </span>
          </button>

          <button
            type="button"
            onClick={clearCurrentPageAnnotations}
            disabled={pageAnnotations.length === 0}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 h-8 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:border-white/[0.08] dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/20"
            title="Clear annotations on current page"
          >
            <Eraser size={13} />
            <span className="hidden sm:inline">Clear Page</span>
          </button>
        </div>
      </div>

      {/* Sejda Style Primary Toolbar */}
      <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white/90 p-2 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/80 overflow-x-auto no-scrollbar flex-nowrap">
        {/* 1. Text */}
        <button
          type="button"
          onClick={() => {
            setActiveTool("text");
            setSelectedId(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTool === "text" || activeTool === "editText"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
              : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          }`}
          title="Type text or click any existing text to edit"
        >
          <Type size={15} />
          <span>Text</span>
        </button>

        {/* 2. Forms (Checkmark, Cross, Radio, Checkbox) */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setFormsMenuOpen((o) => !o)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTool === "forms"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Insert Checkmark, Cross, Radio bullet, or Checkbox"
          >
            <CheckSquare size={15} />
            <span>Forms</span>
            <ChevronDown size={12} className="opacity-70" />
          </button>

          {formsMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-50 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800 space-y-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setFormSymbol("check");
                  setActiveTool("forms");
                  setFormsMenuOpen(false);
                  notify("Click anywhere on PDF to place Checkmark (✓)", "info");
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-left ${
                  formSymbol === "check" && activeTool === "forms"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 font-black text-sm">
                  ✓
                </span>
                <span>Checkmark</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormSymbol("cross");
                  setActiveTool("forms");
                  setFormsMenuOpen(false);
                  notify("Click anywhere on PDF to place Cross mark (✕)", "info");
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-left ${
                  formSymbol === "cross" && activeTool === "forms"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-rose-500/15 text-rose-600 font-black text-sm">
                  ✕
                </span>
                <span>Cross Mark</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormSymbol("radio");
                  setActiveTool("forms");
                  setFormsMenuOpen(false);
                  notify("Click anywhere on PDF to place Radio bullet (●)", "info");
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-left ${
                  formSymbol === "radio" && activeTool === "forms"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-blue-500/15 text-blue-600 font-black text-sm">
                  ●
                </span>
                <span>Radio Bullet</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormSymbol("checkbox");
                  setActiveTool("forms");
                  setFormsMenuOpen(false);
                  notify("Click anywhere on PDF to place Checkbox (☐)", "info");
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-left ${
                  formSymbol === "checkbox" && activeTool === "forms"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <span className="grid h-6 w-6 place-items-center rounded-lg border-2 border-slate-400 bg-white font-black text-xs">
                  {" "}
                </span>
                <span>Checkbox Field</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Images */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0">
          <ImageIcon size={15} />
          <span>Images</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
        </label>

        {/* 4. Sign */}
        <button
          type="button"
          onClick={() => setShowSignModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
          title="Create cursive signature, draw or upload signature"
        >
          <FileSignature size={15} />
          <span>Sign</span>
        </button>

        {/* 5. Whiteout */}
        <button
          type="button"
          onClick={() => {
            setActiveTool("erase");
            setSelectedId(null);
            notify("Whiteout tool active: Drag a rectangle to conceal or erase content cleanly", "info");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTool === "erase"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
              : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          }`}
          title="Cover part of page with matching background patch or whiteout"
        >
          <Eraser size={15} />
          <span>Whiteout</span>
        </button>

        {/* 6. Annotate (Highlight & Pen) */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setAnnotateMenuOpen((o) => !o)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTool === "highlight" || activeTool === "draw"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Highlight or Pen sketch"
          >
            <Highlighter size={15} />
            <span>Annotate</span>
            <ChevronDown size={12} className="opacity-70" />
          </button>

          {annotateMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-50 w-36 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800 space-y-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTool("highlight");
                  setAnnotateMenuOpen(false);
                  notify("Highlight tool active: Drag over text or area to highlight", "info");
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold text-left cursor-pointer ${
                  activeTool === "highlight"
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <Highlighter size={14} className="text-amber-500" />
                <span>Highlight</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool("draw");
                  setAnnotateMenuOpen(false);
                  notify("Freehand Pen active: Draw anywhere on document", "info");
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold text-left cursor-pointer ${
                  activeTool === "draw"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <PenTool size={14} className="text-blue-500" />
                <span>Draw Pen</span>
              </button>
            </div>
          )}
        </div>

        {/* 7. Shapes */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShapesMenuOpen((o) => !o)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              ["rectangle", "circle", "line", "arrow"].includes(activeTool)
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Add Rectangle, Circle, Line or Arrow"
          >
            <Square size={15} />
            <span>Shapes</span>
            <ChevronDown size={12} className="opacity-70" />
          </button>

          {shapesMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-50 w-36 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800 space-y-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTool("rectangle");
                  setShapesMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-left cursor-pointer"
              >
                <Square size={14} />
                <span>Rectangle</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool("circle");
                  setShapesMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-left cursor-pointer"
              >
                <Circle size={14} />
                <span>Circle</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool("line");
                  setShapesMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-left cursor-pointer"
              >
                <Minus size={14} />
                <span>Line</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool("arrow");
                  setShapesMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-left cursor-pointer"
              >
                <ArrowRight size={14} />
                <span>Arrow</span>
              </button>
            </div>
          )}
        </div>

        {/* 8. More (Find & Replace, Stamps, Redact) */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMoreMenuOpen((o) => !o)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="More tools"
          >
            <span>More</span>
            <ChevronDown size={12} className="opacity-70" />
          </button>

          {moreMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-50 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800 space-y-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setFindAndReplaceOpen(true);
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-left cursor-pointer"
              >
                <Replace size={14} className="text-blue-500" />
                <span>Find & Replace</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool("stamp");
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-left cursor-pointer"
              >
                <Stamp size={14} className="text-emerald-500" />
                <span>Stamps</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool("redact");
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-left cursor-pointer"
              >
                <EyeOff size={14} className="text-rose-500" />
                <span>Permanent Redact</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCurrentPageAnnotations();
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left cursor-pointer"
              >
                <Eraser size={14} />
                <span>Clear This Page</span>
              </button>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-white/[0.1] mx-1 ml-auto shrink-0" />

        {/* Quick Text Detection Status */}
        <button
          type="button"
          onClick={() => setDetectTextActive(!detectTextActive)}
          className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
            detectTextActive
              ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400"
              : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title="Toggle interactive bounding box hover on PDF text"
        >
          {detectTextActive ? <Eye size={13} /> : <EyeOff size={13} />}
          <span className="text-[11px] hidden sm:inline">Detect Text</span>
        </button>
      </div>

      {/* Contextual Properties Bar */}
      <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 sm:px-4 py-2.5 dark:border-white/[0.06] dark:bg-slate-900/40 text-xs overflow-x-auto no-scrollbar flex-nowrap lg:flex-wrap">
        {/* Color Palette for Text, Draw, Shapes */}
        {(activeTool === "text" ||
          activeTool === "draw" ||
          activeTool === "rectangle" ||
          activeTool === "circle" ||
          activeTool === "line" ||
          activeTool === "arrow" ||
          selectedAnnotation) && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Color:</span>
            <div className="flex items-center gap-1">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => {
                    setActiveColor(c.hex);
                    if (selectedId) {
                      setAnnotations((prev) =>
                        prev.map((a) =>
                          a.id === selectedId
                            ? { ...a, textColor: c.hex, strokeColor: c.hex }
                            : a
                        )
                      );
                    }
                  }}
                  className={`h-5 w-5 rounded-full border border-slate-300 dark:border-slate-600 transition-transform ${
                    activeColor === c.hex ? "scale-125 ring-2 ring-blue-500 ring-offset-1" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Text Specific Options */}
        {(activeTool === "text" || (selectedAnnotation && selectedAnnotation.type === "text")) && (
          <>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.1]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Size:</span>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    const currentSz = selectedAnnotation?.fontSize || fontSize;
                    const nextSz = Math.max(6, currentSz - 1);
                    setFontSize(nextSz);
                    if (selectedId) {
                      setAnnotations((prev) =>
                        prev.map((a) => (a.id === selectedId ? { ...a, fontSize: nextSz } : a))
                      );
                    }
                  }}
                  className="rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 p-1 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  title="Decrease font size (-1pt)"
                >
                  <Minus size={12} />
                </button>
                <select
                  value={selectedAnnotation?.fontSize || fontSize}
                  onChange={(e) => {
                    const size = Number(e.target.value);
                    setFontSize(size);
                    if (selectedId) {
                      setAnnotations((prev) =>
                        prev.map((a) => (a.id === selectedId ? { ...a, fontSize: size } : a))
                      );
                    }
                  }}
                  className="border-y border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {(() => {
                    const activeSz = selectedAnnotation?.fontSize || fontSize;
                    const allSizes = Array.from(
                      new Set([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 28, 32, 36, 40, 48, 64, activeSz])
                    ).sort((a, b) => a - b);
                    return allSizes.map((s) => (
                      <option key={s} value={s}>
                        {s}pt
                      </option>
                    ));
                  })()}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const currentSz = selectedAnnotation?.fontSize || fontSize;
                    const nextSz = Math.min(120, currentSz + 1);
                    setFontSize(nextSz);
                    if (selectedId) {
                      setAnnotations((prev) =>
                        prev.map((a) => (a.id === selectedId ? { ...a, fontSize: nextSz } : a))
                      );
                    }
                  }}
                  className="rounded-r-lg border border-l-0 border-slate-200 bg-slate-50 p-1 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  title="Increase font size (+1pt)"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Font:</span>
              <select
                value={selectedAnnotation?.fontFamily || fontFamily}
                onChange={(e) => {
                  const f = e.target.value as any;
                  setFontFamily(f);
                  if (selectedId) {
                    setAnnotations((prev) =>
                      prev.map((a) => (a.id === selectedId ? { ...a, fontFamily: f } : a))
                    );
                  }
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {selectedAnnotation?.actualFontName && (
                  <option value={selectedAnnotation.fontFamily}>
                    Original ({selectedAnnotation.actualFontName})
                  </option>
                )}
                <option value="sans">Sans-Serif (Arial / Calibri / Helvetica)</option>
                <option value="serif">Serif (Times New Roman / Georgia)</option>
                <option value="mono">Monospace (Courier New / Consolas)</option>
                <option value="cursive">Cursive (Script)</option>
              </select>
              {selectedAnnotation?.actualFontName && (
                <span
                  className="hidden sm:inline-block rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 truncate max-w-[130px]"
                  title={`Original PDF typeface: ${selectedAnnotation.actualFontName}`}
                >
                  {selectedAnnotation.actualFontName}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const currentBold = selectedAnnotation ? selectedAnnotation.fontWeight === "bold" : isBold;
                const nextBold = !currentBold;
                setIsBold(nextBold);
                if (selectedId) {
                  setAnnotations((prev) =>
                    prev.map((a) => (a.id === selectedId ? { ...a, fontWeight: nextBold ? "bold" : "normal" } : a))
                  );
                }
              }}
              className={`h-7 w-7 rounded-lg border font-black transition-all ${
                (selectedAnnotation ? selectedAnnotation.fontWeight === "bold" : isBold)
                  ? "border-blue-500 bg-blue-600 text-white shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
              title="Toggle Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => {
                const currentItalic = selectedAnnotation ? selectedAnnotation.fontStyle === "italic" : isItalic;
                const nextItalic = !currentItalic;
                setIsItalic(nextItalic);
                if (selectedId) {
                  setAnnotations((prev) =>
                    prev.map((a) => (a.id === selectedId ? { ...a, fontStyle: nextItalic ? "italic" : "normal" } : a))
                  );
                }
              }}
              className={`h-7 w-7 rounded-lg border italic font-serif font-bold transition-all ${
                (selectedAnnotation ? selectedAnnotation.fontStyle === "italic" : isItalic)
                  ? "border-blue-500 bg-blue-600 text-white shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
              title="Toggle Italic"
            >
              I
            </button>

            {/* Whiteout / Background controls */}
            <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.1]" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Background:</span>
              <button
                type="button"
                onClick={() => {
                  if (selectedAnnotation && selectedAnnotation.type === "text") {
                    const matchedBg = sampleBackgroundColor(
                      selectedAnnotation.xNorm,
                      selectedAnnotation.yNorm,
                      selectedAnnotation.widthNorm,
                      selectedAnnotation.heightNorm
                    );
                    const txtColor = isColorDark(matchedBg) ? "#ffffff" : selectedAnnotation.textColor;
                    setAnnotations((prev) =>
                      prev.map((a) =>
                        a.id === selectedId
                          ? {
                              ...a,
                              underlayWhiteout: true,
                              whiteoutColor: matchedBg,
                              textHighlightColor: matchedBg,
                              textColor: txtColor
                            }
                          : a
                      )
                    );
                    notify(`Auto-matched text background to ${matchedBg.toUpperCase()}`, "success");
                  } else {
                    notify("Select a text box on the page to auto-match its background", "info");
                  }
                }}
                className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50"
                title="Automatically match background color directly under this text"
              >
                <Sparkles size={10} />
                <span>Auto-Match</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEyedropperActive((prev) => !prev);
                  if (!isEyedropperActive) {
                    notify("Click anywhere on PDF to pick background color for this text", "info");
                  }
                }}
                className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border transition-all ${
                  isEyedropperActive
                    ? "bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/50 animate-pulse"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                }`}
                title="Pick exact color from anywhere on the document"
              >
                <Pipette size={10} />
                <span>Pick</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedId) {
                    setAnnotations((prev) =>
                      prev.map((a) =>
                        a.id === selectedId
                          ? { ...a, underlayWhiteout: true, whiteoutColor: "#ffffff", textHighlightColor: "#ffffff" }
                          : a
                      )
                    );
                  }
                }}
                className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border transition-all ${
                  selectedAnnotation?.underlayWhiteout &&
                  (!selectedAnnotation?.whiteoutColor || selectedAnnotation?.whiteoutColor === "#ffffff")
                    ? "bg-white text-blue-600 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                }`}
                title="Whiteout background (erases original PDF text)"
              >
                White
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedId) {
                    setAnnotations((prev) =>
                      prev.map((a) =>
                        a.id === selectedId
                          ? { ...a, underlayWhiteout: true, whiteoutColor: "#fef9c3", textHighlightColor: "#fef9c3" }
                          : a
                      )
                    );
                  }
                }}
                className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border transition-all ${
                  selectedAnnotation?.whiteoutColor === "#fef9c3"
                    ? "bg-yellow-100 text-yellow-800 border-yellow-400 ring-2 ring-yellow-400/20 shadow-xs"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-900/50"
                }`}
                title="Warm paper tint"
              >
                Warm
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedId) {
                    setAnnotations((prev) =>
                      prev.map((a) =>
                        a.id === selectedId
                          ? { ...a, underlayWhiteout: false, textHighlightColor: "transparent" }
                          : a
                      )
                    );
                  }
                }}
                className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border transition-all ${
                  !selectedAnnotation?.underlayWhiteout && selectedAnnotation?.textHighlightColor === "transparent"
                    ? "bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-700 dark:text-white"
                    : "bg-transparent text-slate-500 border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400"
                }`}
                title="Clear background"
              >
                Clear
              </button>
              {/* Custom Underlay Color */}
              <label
                className="relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-linear-to-br from-red-400 via-green-400 to-blue-400 shadow-2xs hover:scale-105"
                title="Custom background color"
              >
                <input
                  type="color"
                  value={selectedAnnotation?.whiteoutColor || "#ffffff"}
                  onChange={(e) => {
                    const col = e.target.value;
                    if (selectedId) {
                      setAnnotations((prev) =>
                        prev.map((a) =>
                          a.id === selectedId
                            ? { ...a, underlayWhiteout: true, whiteoutColor: col, textHighlightColor: col }
                            : a
                        )
                      );
                    }
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>

            {selectedAnnotation?.originalText !== undefined && (
              <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-white/[0.1]">
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                  Edited Original
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedId && selectedAnnotation.originalText !== undefined) {
                      setAnnotations((prev) =>
                        prev.map((a) =>
                          a.id === selectedId ? { ...a, text: selectedAnnotation.originalText } : a
                        )
                      );
                      notify("Restored original text", "info");
                    }
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  title="Restore original text"
                >
                  Reset
                </button>
              </div>
            )}
          </>
        )}

        {/* Pen & Shapes Stroke Width */}
        {(activeTool === "draw" ||
          activeTool === "rectangle" ||
          activeTool === "circle" ||
          activeTool === "line" ||
          activeTool === "arrow") && (
          <>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.1]" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Thickness:</span>
              <input
                type="range"
                min={1}
                max={16}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="h-1.5 w-24 rounded-lg bg-slate-200 accent-blue-600 dark:bg-slate-700"
              />
              <span className="font-mono text-[11px] font-bold">{strokeWidth}px</span>
            </div>
          </>
        )}

        {/* Highlight Colors */}
        {activeTool === "highlight" && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Marker Color:</span>
            <div className="flex items-center gap-1.5">
              {HIGHLIGHT_COLORS.map((hc) => (
                <button
                  key={hc.hex}
                  type="button"
                  onClick={() => setHighlightColor(hc.hex)}
                  className={`h-5 w-7 rounded border border-slate-300 transition-transform ${
                    highlightColor === hc.hex ? "ring-2 ring-blue-500 scale-110" : ""
                  }`}
                  style={{ backgroundColor: hc.hex }}
                  title={hc.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Redaction Options */}
        {activeTool === "redact" && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Redaction Type:</span>
            <button
              type="button"
              onClick={() => setRedactColor("#000000")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                redactColor === "#000000"
                  ? "bg-black text-white ring-2 ring-blue-500"
                  : "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              Blackout
            </button>
            <button
              type="button"
              onClick={() => setRedactColor("#ffffff")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
                redactColor === "#ffffff"
                  ? "bg-white text-slate-900 ring-2 ring-blue-500 border-blue-500"
                  : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              Whiteout
            </button>
            <span className="text-[10px] text-slate-400 ml-2 italic">
              Permanently burns into PDF output to conceal sensitive data
            </span>
          </div>
        )}

        {/* Stamps Selector */}
        {activeTool === "stamp" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Preset:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {STAMP_PRESETS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSelectedStamp(s)}
                  className={`rounded-lg border px-2 py-0.5 text-[10px] font-black tracking-wider transition-all ${
                    selectedStamp.label === s.label
                      ? "ring-2 ring-blue-500 scale-105"
                      : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ color: s.color, borderColor: s.color }}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or Custom Stamp Text..."
              value={customStampText}
              onChange={(e) => setCustomStampText(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        )}

        {/* Erase / Logo Remover Options */}
        {(activeTool === "erase" || (selectedAnnotation && selectedAnnotation.type === "erase")) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Eraser size={12} className="text-rose-500" />
              Erase Match:
            </span>

            {/* Auto Match Background Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextMatch = !eraseColorAutoMatch;
                setEraseColorAutoMatch(nextMatch);
                if (nextMatch && selectedAnnotation && selectedAnnotation.type === "erase") {
                  const sampled = sampleBackgroundColor(
                    selectedAnnotation.xNorm,
                    selectedAnnotation.yNorm,
                    selectedAnnotation.widthNorm,
                    selectedAnnotation.heightNorm
                  );
                  setAnnotations((prev) =>
                    prev.map((a) => (a.id === selectedAnnotation.id ? { ...a, fillColor: sampled } : a))
                  );
                  notify(`Auto-matched background to ${sampled.toUpperCase()}`, "success");
                }
              }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all border ${
                eraseColorAutoMatch
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
              title="Automatically samples surrounding background color so erasures blend seamlessly"
            >
              <Sparkles size={11} />
              <span>Auto-Match BG {eraseColorAutoMatch ? "ON" : "OFF"}</span>
            </button>

            {/* Background Preservation Badge */}
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50">
              <Sparkles size={12} className="text-emerald-600" />
              <span>Background Preserved</span>
            </span>

            {/* Re-Clean Background Button for selected erase annotation */}
            {selectedAnnotation && selectedAnnotation.type === "erase" && (
              <button
                type="button"
                onClick={() => {
                  const patch = generateBackgroundInpaintPatch(
                    selectedAnnotation.xNorm,
                    selectedAnnotation.yNorm,
                    selectedAnnotation.widthNorm,
                    selectedAnnotation.heightNorm
                  );
                  setAnnotations((prev) =>
                    prev.map((a) =>
                      a.id === selectedAnnotation.id
                        ? { ...a, imageDataUrl: patch || undefined, eraseMode: "inpaint" }
                        : a
                    )
                  );
                  notify("Background cleanly reconstructed!", "success");
                }}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-500 shadow-xs cursor-pointer"
                title="Re-sample surrounding background and seamlessly blend without affecting background"
              >
                <Wand2 size={11} />
                <span>Re-Clean BG</span>
              </button>
            )}

            {/* Eyedropper Color Picker */}
            <button
              type="button"
              onClick={() => {
                setIsEyedropperActive((prev) => !prev);
                if (!isEyedropperActive) {
                  notify("Eyedropper active: Click anywhere on the PDF page to sample its color", "info");
                }
              }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all border ${
                isEyedropperActive
                  ? "bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/50 animate-pulse"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
              title="Pick exact background color from anywhere on the document"
            >
              <Pipette size={12} />
              <span>{isEyedropperActive ? "Sampling..." : "Pick Color"}</span>
            </button>

            {/* Erase Color Presets */}
            <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-white/[0.1]">
              {[
                { name: "Pure White", hex: "#ffffff" },
                { name: "Warm Cream", hex: "#fef9c3" },
                { name: "Off-White", hex: "#f8fafc" },
                { name: "Light Gray", hex: "#e2e8f0" },
                { name: "Dark Header", hex: "#0f172a" }
              ].map((c) => {
                const currentColor =
                  selectedAnnotation?.type === "erase"
                    ? selectedAnnotation.fillColor || "#ffffff"
                    : eraseColor;
                const isSelected = currentColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      setEraseColor(c.hex);
                      setEraseColorAutoMatch(false);
                      if (selectedAnnotation && selectedAnnotation.type === "erase") {
                        setAnnotations((prev) =>
                          prev.map((a) => (a.id === selectedAnnotation.id ? { ...a, fillColor: c.hex } : a))
                        );
                      }
                    }}
                    className={`h-5 w-5 rounded-md border border-slate-300 shadow-2xs transition-transform ${
                      isSelected ? "ring-2 ring-blue-500 scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                );
              })}

              {/* Custom Color Picker Input */}
              <label
                className="relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-linear-to-br from-red-400 via-green-400 to-blue-400 shadow-2xs hover:scale-105"
                title="Choose custom background color"
              >
                <input
                  type="color"
                  value={
                    selectedAnnotation?.type === "erase"
                      ? selectedAnnotation.fillColor || "#ffffff"
                      : eraseColor
                  }
                  onChange={(e) => {
                    const col = e.target.value;
                    setEraseColor(col);
                    setEraseColorAutoMatch(false);
                    if (selectedAnnotation && selectedAnnotation.type === "erase") {
                      setAnnotations((prev) =>
                        prev.map((a) => (a.id === selectedAnnotation.id ? { ...a, fillColor: col } : a))
                      );
                    }
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>

            {selectedAnnotation && selectedAnnotation.type === "erase" && (
              <button
                type="button"
                onClick={() => {
                  const sampled = sampleBackgroundColor(
                    selectedAnnotation.xNorm,
                    selectedAnnotation.yNorm,
                    selectedAnnotation.widthNorm,
                    selectedAnnotation.heightNorm
                  );
                  setAnnotations((prev) =>
                    prev.map((a) => (a.id === selectedAnnotation.id ? { ...a, fillColor: sampled } : a))
                  );
                  setEraseColor(sampled);
                  notify(`Re-sampled background: ${sampled.toUpperCase()}`, "success");
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                title="Re-sample background color directly under this patch"
              >
                Re-sample BG
              </button>
            )}
          </div>
        )}

        {/* Selected Annotation Actions */}
        {selectedAnnotation && (
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => duplicateAnnotation(selectedAnnotation.id)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              title="Duplicate (Ctrl+D)"
            >
              <Copy size={12} />
              <span>Duplicate</span>
            </button>
            <button
              type="button"
              onClick={() => deleteAnnotation(selectedAnnotation.id)}
              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
              title="Delete (Backspace/Delete)"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace Layout (Sidebar Rail + Stage) */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* Mobile Toggle for Page Rail & Text Inspector */}
        <div className="flex lg:hidden items-center justify-between w-full">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-100 dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-200"
          >
            <Layers size={14} className="text-blue-600" />
            <span>{mobileSidebarOpen ? "Hide Pages & Text Inspector" : `Show Pages (${pagesPlan.length}) & Text Inspector`}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${mobileSidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Left Page Rail / Text Inspector */}
        <div className={`${mobileSidebarOpen ? "block" : "hidden lg:block"} w-full lg:w-56 shrink-0 rounded-3xl border border-slate-200/80 bg-white/70 p-3 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/50 space-y-2.5`}>
          {/* Tabs: Pages vs Text */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setSidebarTab("pages")}
              className={`flex-1 rounded-lg py-1 text-center text-xs font-bold transition-all ${
                sidebarTab === "pages"
                  ? "bg-white shadow-xs text-blue-600 dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              Pages ({pagesPlan.length})
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab("text")}
              className={`flex-1 rounded-lg py-1 text-center text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                sidebarTab === "text"
                  ? "bg-white shadow-xs text-blue-600 dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <Sparkles size={11} className="text-blue-500" />
              <span>PDF Text</span>
            </button>
          </div>

          {sidebarTab === "pages" ? (
            <>
              <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-200/60 dark:border-white/[0.06]">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Page Navigation</span>
                <button
                  type="button"
                  onClick={addBlankPage}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400"
                  title="Add blank page"
                >
                  <Plus size={11} />
                  <span>Blank</span>
                </button>
              </div>

              {/* Page Cards List */}
              <div className="max-h-[550px] overflow-y-auto space-y-2 pr-1">
                {pagesPlan.map((plan, idx) => {
                  const isActive = idx === activePageIndex;
                  const countOnPage = annotations.filter((a) => a.pageIndex === idx).length;
                  const thumb = plan.originalPage ? info.thumbnails[plan.originalPage - 1] : null;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setActivePageIndex(idx)}
                      className={`group relative cursor-pointer rounded-2xl border p-2 transition-all ${
                        isActive
                          ? "border-blue-500 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/30 dark:bg-blue-950/30"
                          : "border-slate-200/70 bg-white hover:border-slate-300 dark:border-white/[0.05] dark:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1.5 text-[11px] font-bold">
                        <span className={isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300"}>
                          Page {idx + 1}
                        </span>
                        {countOnPage > 0 && (
                          <span className="rounded-full bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-black text-blue-700 dark:text-blue-300">
                            {countOnPage}
                          </span>
                        )}
                      </div>

                      {/* Thumbnail Preview Card */}
                      <div className="aspect-[1/1.35] w-full overflow-hidden rounded-xl border border-slate-200/60 bg-white dark:border-white/[0.05] dark:bg-slate-900 grid place-items-center">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={`Page ${idx + 1}`}
                            className="h-full w-full object-contain"
                            style={{ transform: `rotate(${plan.rotation}deg)` }}
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Blank Page</span>
                        )}
                      </div>

                      {/* Page Action Icons on Hover */}
                      {isActive && (
                        <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-white/[0.05] pt-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              rotateCurrentPage();
                            }}
                            className="p-1 rounded-md text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Rotate Page 90°"
                          >
                            <RotateCw size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateCurrentPage();
                            }}
                            className="p-1 rounded-md text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Duplicate Page"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCurrentPage();
                            }}
                            disabled={pagesPlan.length <= 1}
                            className="p-1 rounded-md text-slate-500 hover:text-rose-600 disabled:opacity-30"
                            title="Delete Page"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Detected PDF Text List & Actions */
            /* Detected PDF Items (Text & Logos) */
            <div className="space-y-2">
              {/* Type Switcher: Text vs Logos */}
              <div className="flex items-center rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800 border border-slate-200/60 dark:border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setDetectedItemType("text")}
                  className={`flex-1 rounded-lg py-1 text-[10px] font-bold transition-all ${
                    detectedItemType === "text"
                      ? "bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  Text ({(extractedTexts[activePageIndex] || []).length})
                </button>
                <button
                  type="button"
                  onClick={() => setDetectedItemType("images")}
                  className={`flex-1 rounded-lg py-1 text-[10px] font-bold transition-all ${
                    detectedItemType === "images"
                      ? "bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  Logos / Images ({(extractedImages[activePageIndex] || []).length})
                </button>
              </div>

              {detectedItemType === "text" ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Detected Text ({(extractedTexts[activePageIndex] || []).length})
                    </span>
                    <button
                      type="button"
                      onClick={handleMakeAllTextEditable}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400"
                      title="Make all detected lines editable on this page"
                    >
                      <Wand2 size={11} />
                      <span>Edit All</span>
                    </button>
                  </div>

                  {/* Filter search input */}
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter lines..."
                      value={textSearchQuery}
                      onChange={(e) => setTextSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-7 pr-2 py-1 text-[11px] font-bold text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  {/* Text list */}
                  <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
                    {loadingText && (
                      <div className="flex items-center justify-center py-6 text-slate-400 gap-2 text-xs">
                        <RefreshCw size={13} className="animate-spin text-blue-600" />
                        <span>Extracting page text...</span>
                      </div>
                    )}

                    {!loadingText && (extractedTexts[activePageIndex] || []).length === 0 && (
                      <div className="py-6 text-center text-xs text-slate-400 px-2">
                        No selectable text lines found on this page. Use "Erase & Type" to patch scanned text!
                      </div>
                    )}

                    {(extractedTexts[activePageIndex] || [])
                      .filter((item) =>
                        textSearchQuery ? item.text.toLowerCase().includes(textSearchQuery.toLowerCase()) : true
                      )
                      .map((item) => {
                        const isHovered = hoveredTextId === item.id;
                        const isEdited = pageAnnotations.some(
                          (a) =>
                            Math.abs(a.xNorm - item.xNorm) < 0.015 &&
                            Math.abs(a.yNorm - item.yNorm) < 0.015
                        );

                        return (
                          <div
                            key={item.id}
                            onPointerEnter={() => setHoveredTextId(item.id)}
                            onPointerLeave={() => setHoveredTextId(null)}
                            onClick={() => handleEditDetectedText(item)}
                            className={`group cursor-pointer rounded-xl border p-2 text-xs transition-all ${
                              isEdited
                                ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/30"
                                : isHovered
                                ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                                : "border-slate-200/70 bg-white hover:border-slate-300 dark:border-white/[0.05] dark:bg-slate-800/60"
                            }`}
                          >
                            <p className="line-clamp-2 font-medium text-slate-800 dark:text-slate-200 text-[11px] leading-snug">
                              {item.text}
                            </p>
                            <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400">
                              <span>{item.fontSize}pt • {item.fontFamily}</span>
                              <span className={`font-bold ${isEdited ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}>
                                {isEdited ? "Edited ✓" : "Click to Edit →"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              ) : (
                /* Detected Logos & Graphics Panel */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Logos & Graphics ({(extractedImages[activePageIndex] || []).length})
                    </span>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
                    {loadingImages && (
                      <div className="flex items-center justify-center py-6 text-slate-400 gap-2 text-xs">
                        <RefreshCw size={13} className="animate-spin text-blue-600" />
                        <span>Detecting logos & graphics...</span>
                      </div>
                    )}

                    {!loadingImages && (extractedImages[activePageIndex] || []).length === 0 && (
                      <div className="py-6 text-center text-xs text-slate-400 px-2 leading-relaxed">
                        No embedded logos or images found on this page. If the logo is printed on the background, pick the <strong>Erase / Remove Logo</strong> tool from the toolbar and draw a box over it to clean it with automatic background preservation!
                      </div>
                    )}

                    {(extractedImages[activePageIndex] || []).map((imgItem, imgIdx) => {
                      const isDeleted =
                        deletedImageNames.includes(imgItem.name) ||
                        pageAnnotations.some(
                          (a) =>
                            a.deletedImageName === imgItem.name ||
                            (a.type === "erase" &&
                              Math.abs(a.xNorm - imgItem.xNorm) < 0.02 &&
                              Math.abs(a.yNorm - imgItem.yNorm) < 0.02)
                        );
                      const isHovered = hoveredImageId === imgItem.id;
                      const isSelected = selectedImageItem?.id === imgItem.id;

                      return (
                        <div
                          key={imgItem.id}
                          onPointerEnter={() => setHoveredImageId(imgItem.id)}
                          onPointerLeave={() => setHoveredImageId(null)}
                          onClick={() => {
                            setSelectedImageItem(imgItem);
                            setSelectedId(null);
                          }}
                          className={`group cursor-pointer rounded-xl border p-2 text-xs transition-all ${
                            isDeleted
                              ? "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/40"
                              : isSelected
                              ? "border-rose-500 bg-rose-50/70 shadow-sm ring-2 ring-rose-500/30 dark:bg-rose-950/30"
                              : isHovered
                              ? "border-amber-500 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/30"
                              : "border-slate-200/70 bg-white hover:border-slate-300 dark:border-white/[0.05] dark:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              Logo #{imgIdx + 1} ({imgItem.name})
                            </span>
                            {isDeleted ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                Removed ✓
                              </span>
                            ) : (
                              <span className="text-amber-600 font-bold">Detected</span>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-500">
                              {Math.round(imgItem.widthNorm * 100)}% × {Math.round(imgItem.heightNorm * 100)}% box
                            </span>
                            {!isDeleted && (
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  handleDeleteLogo(imgItem);
                                }}
                                className="flex items-center gap-1 rounded bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 text-[10px] font-bold shadow-xs cursor-pointer transition-colors"
                              >
                                <Trash2 size={10} />
                                <span>Delete Logo</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center Stage: Page Canvas & Overlays */}
        <div className="flex-1 w-full flex flex-col items-center overflow-x-auto">
          <div className="relative p-2 sm:p-4 rounded-3xl border border-slate-200/80 bg-slate-100/60 dark:border-white/[0.08] dark:bg-slate-950/40 w-full flex justify-center">
            {loadingPage && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-xs rounded-3xl">
                <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-lg dark:bg-slate-900 border border-slate-200 dark:border-white/[0.1]">
                  <RefreshCw size={16} className="animate-spin text-blue-600" />
                  <span className="text-xs font-bold">Rendering High-DPI Page...</span>
                </div>
              </div>
            )}

            {/* Sejda Style Page Header Action Strip */}
            <div
              className="flex items-center justify-between pb-2 text-xs font-semibold text-slate-500 dark:text-slate-400"
              style={{ width: `${Math.round(pageDimensions.width * zoomScale)}px` }}
            >
              <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                <span>Page {activePageIndex + 1}</span>
                <span className="text-[10px] font-normal text-slate-400">({pageDimensions.width} × {pageDimensions.height} pt)</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={rotateCurrentPage}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                  title="Rotate page 90 degrees"
                >
                  <RotateCw size={12} />
                  <span className="hidden xs:inline">Rotate</span>
                </button>
                <button
                  type="button"
                  onClick={duplicateCurrentPage}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                  title="Duplicate page"
                >
                  <Copy size={12} />
                  <span className="hidden xs:inline">Duplicate</span>
                </button>
                <button
                  type="button"
                  onClick={addBlankPage}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                  title="Insert blank page after this page"
                >
                  <Plus size={12} />
                  <span className="hidden xs:inline">Insert</span>
                </button>
                {pagesPlan.length > 1 && (
                  <button
                    type="button"
                    onClick={deleteCurrentPage}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:bg-slate-800 dark:text-rose-400 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                    title="Delete page"
                  >
                    <Trash2 size={12} />
                    <span className="hidden xs:inline">Delete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Page Container */}
            <div
              ref={pageContainerRef}
              onPointerDown={handleStagePointerDown}
              onPointerMove={handleStagePointerMove}
              onPointerUp={handleStagePointerUp}
              className={`relative overflow-hidden rounded-2xl shadow-xl border border-slate-200/80 bg-white dark:border-white/[0.1] select-none transition-transform duration-100 ${
                isEyedropperActive
                  ? "cursor-crosshair"
                  : activeTool === "select"
                  ? "cursor-default"
                  : activeTool === "text"
                  ? "cursor-text"
                  : "cursor-crosshair"
              }`}
              style={{
                width: `${Math.round(pageDimensions.width * zoomScale)}px`,
                minHeight: `${Math.round(pageDimensions.height * zoomScale)}px`,
                aspectRatio: `${pageDimensions.width} / ${pageDimensions.height}`
              }}
            >
              {/* Eyedropper sampling indicator banner */}
              {isEyedropperActive && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce pointer-events-none">
                  <Pipette size={14} />
                  <span>Click anywhere on PDF to sample background color</span>
                </div>
              )}

              {/* Rendered PDF Page Background Image */}
              {pageImage && (
                <img
                  src={pageImage}
                  alt="Page Background"
                  className="pointer-events-none h-full w-full object-contain"
                  draggable={false}
                />
              )}

              {/* Text Detection Layer (Click to Edit Existing Text) */}
              {detectTextActive && activeTool !== "draw" && (
                <div className="absolute inset-0 pointer-events-none z-15">
                  {(extractedTexts[activePageIndex] || []).map((item) => {
                    const isAlreadyEdited = pageAnnotations.some(
                      (a) =>
                        Math.abs(a.xNorm - item.xNorm) < 0.015 &&
                        Math.abs(a.yNorm - item.yNorm) < 0.015
                    );
                    if (isAlreadyEdited) return null;

                    const isHovered = hoveredTextId === item.id;
                    const isFindMatch =
                      findAndReplaceOpen &&
                      findQuery.trim().length > 0 &&
                      (findCaseSensitive
                        ? item.text.includes(findQuery.trim())
                        : item.text.toLowerCase().includes(findQuery.trim().toLowerCase()));

                    return (
                      <div
                        key={item.id}
                        onPointerEnter={() => setHoveredTextId(item.id)}
                        onPointerLeave={() => setHoveredTextId(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditDetectedText(item);
                        }}
                        className={`absolute pointer-events-auto cursor-pointer rounded-xs transition-all ${
                          isFindMatch
                            ? "bg-amber-400/30 border-2 border-amber-500 shadow-md ring-2 ring-amber-400/50 z-25 animate-pulse"
                            : isHovered || activeTool === "editText"
                            ? "bg-blue-500/20 border border-blue-500 shadow-xs z-25"
                            : "hover:bg-blue-500/15 border border-dashed border-blue-400/30 hover:border-blue-500"
                        }`}
                        style={{
                          left: `${item.xNorm * 100}%`,
                          top: `${item.yNorm * 100}%`,
                          width: `${item.widthNorm * 100}%`,
                          height: `${item.heightNorm * 100}%`
                        }}
                        title={`Click to edit: "${item.text}"`}
                      >
                        {isHovered && (
                          <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none flex items-center gap-1 z-30">
                            <Sparkles size={10} />
                            <span>Click to Edit Text</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Logo / Image Detection Layer (Click to Select & Directly Delete) */}
              {(activeTool === "select" || activeTool === "erase") && (
                <div className="absolute inset-0 pointer-events-none z-16">
                  {(extractedImages[activePageIndex] || []).map((imgItem) => {
                    const isDeleted =
                      deletedImageNames.includes(imgItem.name) ||
                      pageAnnotations.some(
                        (a) =>
                          a.deletedImageName === imgItem.name ||
                          (a.type === "erase" &&
                            Math.abs(a.xNorm - imgItem.xNorm) < 0.02 &&
                            Math.abs(a.yNorm - imgItem.yNorm) < 0.02)
                      );
                    if (isDeleted) return null;

                    const isHovered = hoveredImageId === imgItem.id;
                    const isSelected = selectedImageItem?.id === imgItem.id;

                    return (
                      <div
                        key={imgItem.id}
                        onPointerEnter={() => setHoveredImageId(imgItem.id)}
                        onPointerLeave={() => setHoveredImageId(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageItem(imgItem);
                          setSelectedId(null);
                        }}
                        className={`absolute pointer-events-auto cursor-pointer rounded-md transition-all ${
                          isSelected
                            ? "bg-rose-500/20 border-2 border-rose-500 shadow-lg ring-2 ring-rose-400/50 z-30"
                            : isHovered
                            ? "bg-amber-500/25 border-2 border-amber-500 shadow-sm z-25"
                            : "hover:bg-amber-500/15 border border-dashed border-amber-500/60 hover:border-amber-500"
                        }`}
                        style={{
                          left: `${imgItem.xNorm * 100}%`,
                          top: `${imgItem.yNorm * 100}%`,
                          width: `${imgItem.widthNorm * 100}%`,
                          height: `${imgItem.heightNorm * 100}%`
                        }}
                        title="Click to select logo and directly delete without affecting background"
                      >
                        {(isHovered || isSelected) && (
                          <div
                            className={`absolute ${
                              imgItem.yNorm < 0.05 ? "top-full mt-1.5" : "-top-8"
                            } left-0 bg-slate-900/95 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-1.5 z-40 backdrop-blur-xs border border-white/[0.15]`}
                          >
                            <span className="text-amber-300 font-semibold">Logo</span>
                            <button
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                handleDeleteLogo(imgItem);
                              }}
                              className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors shadow-xs"
                            >
                              <Trash2 size={10} />
                              <span>Remove Logo</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Annotation Elements Layer */}
              {pageAnnotations.map((ann) => {
                const isSelected = selectedId === ann.id;
                const isEditing = editingTextId === ann.id;

                const left = `${ann.xNorm * 100}%`;
                const top = `${ann.yNorm * 100}%`;
                const width = `${ann.widthNorm * 100}%`;
                const height = `${ann.heightNorm * 100}%`;

                return (
                  <div
                    key={ann.id}
                    className={`pdf-annotation-box absolute group ${
                      isSelected ? "ring-2 ring-blue-500 ring-offset-1 z-20" : "z-10"
                    }`}
                    style={{
                      left,
                      top,
                      width,
                      height,
                      transform: ann.rotation ? `rotate(${ann.rotation}deg)` : undefined
                    }}
                    onPointerDown={(e) => {
                      if (activeTool === "select" || activeTool === "editText") {
                        e.stopPropagation();
                        setSelectedId(ann.id);

                        // Start dragging
                        if (!isEditing) {
                          setDraggingId(ann.id);
                          if (pageContainerRef.current) {
                            const rect = pageContainerRef.current.getBoundingClientRect();
                            const xNorm = (e.clientX - rect.left) / rect.width;
                            const yNorm = (e.clientY - rect.top) / rect.height;
                            setDragOffset({
                              xNorm: xNorm - ann.xNorm,
                              yNorm: yNorm - ann.yNorm
                            });
                          }
                        }
                      }
                    }}
                    onDoubleClick={() => {
                      if (ann.type === "text") {
                        setEditingTextId(ann.id);
                        setTimeout(() => textInputRef.current?.focus(), 50);
                      }
                    }}
                  >
                    {/* Render according to type */}
                    {ann.type === "text" && (
                      <div
                        className="h-full w-full overflow-visible p-0 leading-tight flex items-start"
                        style={{
                          fontSize: `${(ann.fontSize || 16) * zoomScale}px`,
                          fontFamily: getAnnotationCssFont(ann),
                          fontWeight: ann.fontWeight || "normal",
                          fontStyle: ann.fontStyle || "normal",
                          color: ann.textColor || "#0f172a",
                          backgroundColor:
                            ann.underlayWhiteout
                              ? ann.whiteoutColor || "#ffffff"
                              : ann.textHighlightColor || "transparent"
                        }}
                      >
                        {isEditing ? (
                          <textarea
                            ref={textInputRef}
                            value={ann.text || ""}
                            onChange={(e) => {
                              const newText = e.target.value;
                              const fontStr = getAnnotationCssFont(ann);
                              const measuredW = measureTextWidthNorm(
                                newText,
                                ann.fontSize || 14,
                                fontStr,
                                ann.fontWeight || "normal",
                                ann.fontStyle || "normal",
                                pageDimensions.width || 595
                              );
                              const lineCount = (newText.match(/\n/g) || []).length + 1;
                              const singleLineHeightNorm = ((ann.fontSize || 14) * 1.35) / (pageDimensions.height || 842);
                              const neededHeightNorm = Math.max(ann.heightNorm, singleLineHeightNorm * lineCount);

                              setAnnotations((prev) =>
                                prev.map((a) => {
                                  if (a.id !== ann.id) return a;
                                  const expandedW = Math.max(a.widthNorm, measuredW);
                                  return {
                                    ...a,
                                    text: newText,
                                    widthNorm: Math.min(0.99 - a.xNorm, expandedW),
                                    heightNorm: neededHeightNorm
                                  };
                                })
                              );
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                setEditingTextId(null);
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                setEditingTextId(null);
                              }
                            }}
                            onBlur={() => setEditingTextId(null)}
                            style={{
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              lineHeight: "1.15",
                              padding: "0 1px",
                              margin: 0
                            }}
                            className="h-full w-full resize-none bg-transparent outline-hidden font-inherit text-inherit border-none"
                            autoFocus
                          />
                        ) : (
                          <span
                            style={{
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              lineHeight: "1.15",
                              padding: "0 1px"
                            }}
                            className="inline-block w-full"
                          >
                            {ann.text}
                          </span>
                        )}
                      </div>
                    )}

                    {ann.type === "freehand" && (
                      <svg className="h-full w-full overflow-visible pointer-events-none">
                        {ann.points && ann.points.length > 0 && (
                          <path
                            d={`M ${ann.points.map((p) => `${((p.x - ann.xNorm) / ann.widthNorm) * 100}% ${((p.y - ann.yNorm) / ann.heightNorm) * 100}%`).join(" L ")}`}
                            stroke={ann.strokeColor || "#0284c7"}
                            strokeWidth={ann.strokeWidth || 3}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                      </svg>
                    )}

                    {ann.type === "highlight" && (
                      <div
                        className="h-full w-full rounded-sm"
                        style={{
                          backgroundColor: ann.fillColor || "#fef08a",
                          opacity: ann.opacity || 0.45
                        }}
                      />
                    )}

                    {ann.type === "redact" && (
                      <div
                        className="h-full w-full"
                        style={{ backgroundColor: ann.fillColor || "#000000" }}
                      />
                    )}

                    {ann.type === "erase" && (
                      <div
                        className="h-full w-full relative group/erase"
                        style={{
                          backgroundColor: ann.imageDataUrl ? "transparent" : (ann.fillColor || "#ffffff")
                        }}
                      >
                        {ann.imageDataUrl ? (
                          <img
                            src={ann.imageDataUrl}
                            alt="Clean Background Patch"
                            className="h-full w-full object-fill pointer-events-none select-none"
                            draggable={false}
                          />
                        ) : null}
                        {isSelected && !ann.deletedImageName && (
                          <div className="absolute inset-0 border border-dashed border-emerald-500/60 pointer-events-none" />
                        )}
                      </div>
                    )}

                    {ann.type === "rectangle" && (
                      <div
                        className="h-full w-full rounded-xs"
                        style={{
                          border: `${ann.strokeWidth || 2}px solid ${ann.strokeColor || "#0284c7"}`,
                          backgroundColor: ann.fillColor || "transparent"
                        }}
                      />
                    )}

                    {ann.type === "circle" && (
                      <div
                        className="h-full w-full rounded-full"
                        style={{
                          border: `${ann.strokeWidth || 2}px solid ${ann.strokeColor || "#0284c7"}`,
                          backgroundColor: ann.fillColor || "transparent"
                        }}
                      />
                    )}

                    {ann.type === "line" && (
                      <svg className="h-full w-full overflow-visible pointer-events-none">
                        <line
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                          stroke={ann.strokeColor || "#0284c7"}
                          strokeWidth={ann.strokeWidth || 3}
                          strokeLinecap="round"
                        />
                      </svg>
                    )}

                    {ann.type === "arrow" && (
                      <svg className="h-full w-full overflow-visible pointer-events-none">
                        <defs>
                          <marker
                            id={`arrowhead-${ann.id}`}
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                          >
                            <polygon
                              points="0 0, 10 3.5, 0 7"
                              fill={ann.strokeColor || "#0284c7"}
                            />
                          </marker>
                        </defs>
                        <line
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                          stroke={ann.strokeColor || "#0284c7"}
                          strokeWidth={ann.strokeWidth || 3}
                          markerEnd={`url(#arrowhead-${ann.id})`}
                          strokeLinecap="round"
                        />
                      </svg>
                    )}

                    {ann.type === "stamp" && (
                      <div
                        className="h-full w-full rounded-xl border-2 p-1.5 flex items-center justify-center font-black tracking-widest uppercase select-none"
                        style={{
                          borderColor: ann.stampColor || "#dc2626",
                          color: ann.stampColor || "#dc2626"
                        }}
                      >
                        <div
                          className="h-full w-full border border-dashed rounded-lg flex items-center justify-center px-2 py-0.5 text-center leading-tight"
                          style={{ borderColor: ann.stampColor || "#dc2626" }}
                        >
                          <span className="truncate">{ann.stampLabel || "APPROVED"}</span>
                        </div>
                      </div>
                    )}

                    {ann.type === "image" && ann.imageDataUrl && (
                      <img
                        src={ann.imageDataUrl}
                        alt="Placed"
                        className="h-full w-full object-contain pointer-events-none select-none"
                        draggable={false}
                      />
                    )}

                    {/* Resize Handles for Selected Element */}
                    {isSelected && !isEditing && (
                      <>
                        {["nw", "ne", "sw", "se"].map((handle) => (
                          <div
                            key={handle}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setResizingId(ann.id);
                              setResizeHandle(handle);
                              if (pageContainerRef.current) {
                                const rect = pageContainerRef.current.getBoundingClientRect();
                                setResizeInitial({
                                  xNorm: ann.xNorm,
                                  yNorm: ann.yNorm,
                                  wNorm: ann.widthNorm,
                                  hNorm: ann.heightNorm,
                                  pointerX: (e.clientX - rect.left) / rect.width,
                                  pointerY: (e.clientY - rect.top) / rect.height
                                });
                              }
                            }}
                            className={`absolute h-2.5 w-2.5 rounded-full border border-white bg-blue-600 shadow-xs z-30 ${
                              handle === "nw"
                                ? "-top-1 -left-1 cursor-nwse-resize"
                                : handle === "ne"
                                ? "-top-1 -right-1 cursor-nesw-resize"
                                : handle === "sw"
                                ? "-bottom-1 -left-1 cursor-nesw-resize"
                                : "-bottom-1 -right-1 cursor-nwse-resize"
                            }`}
                          />
                        ))}

                        {/* Contextual Quick Actions Floating Pill (Sejda style in-place controls) */}
                        <div
                          className={`absolute ${
                            ann.yNorm < 0.08 ? "top-full mt-2" : "-top-10"
                          } left-1/2 -translate-x-1/2 bg-slate-900/95 text-white px-2.5 py-1 rounded-xl shadow-2xl flex items-center gap-1.5 z-40 backdrop-blur-xs border border-white/[0.15] text-[11px] whitespace-nowrap pointer-events-auto`}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          {ann.type === "text" ? (
                            <>
                              {/* Font Family selector */}
                              <select
                                value={ann.fontFamily || "sans"}
                                onChange={(e) => {
                                  const newF = e.target.value as any;
                                  setAnnotations((prev) =>
                                    prev.map((a) => (a.id === ann.id ? { ...a, fontFamily: newF } : a))
                                  );
                                }}
                                className="bg-slate-800 text-white rounded-md px-1.5 py-0.5 text-[10px] font-bold border border-white/20 outline-hidden cursor-pointer"
                              >
                                {ann.actualFontName && (
                                  <option value={ann.fontFamily}>
                                    {ann.actualFontName} (Original)
                                  </option>
                                )}
                                <option value="sans">Sans (Arial / Calibri)</option>
                                <option value="serif">Serif (Times / Georgia)</option>
                                <option value="mono">Mono (Courier)</option>
                                <option value="cursive">Cursive (Script)</option>
                              </select>

                              {/* Font Size Stepper */}
                              <div className="flex items-center rounded-md border border-white/20 bg-slate-800">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextSz = Math.max(6, (ann.fontSize || 14) - 1);
                                    setAnnotations((prev) =>
                                      prev.map((a) => (a.id === ann.id ? { ...a, fontSize: nextSz } : a))
                                    );
                                  }}
                                  className="px-1.5 py-0.5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                                  title="Smaller (-1pt)"
                                >
                                  -
                                </button>
                                <span className="px-1 text-[10px] font-mono font-bold text-white min-w-[24px] text-center">
                                  {ann.fontSize || 14}pt
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextSz = Math.min(120, (ann.fontSize || 14) + 1);
                                    setAnnotations((prev) =>
                                      prev.map((a) => (a.id === ann.id ? { ...a, fontSize: nextSz } : a))
                                    );
                                  }}
                                  className="px-1.5 py-0.5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                                  title="Larger (+1pt)"
                                >
                                  +
                                </button>
                              </div>

                              {/* Bold & Italic */}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextB = ann.fontWeight === "bold" ? "normal" : "bold";
                                  setAnnotations((prev) =>
                                    prev.map((a) => (a.id === ann.id ? { ...a, fontWeight: nextB } : a))
                                  );
                                }}
                                className={`px-1.5 py-0.5 rounded font-black text-[10px] cursor-pointer transition-colors ${
                                  ann.fontWeight === "bold" ? "bg-white/30 text-white" : "text-slate-300 hover:bg-white/15"
                                }`}
                                title="Bold"
                              >
                                B
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextI = ann.fontStyle === "italic" ? "normal" : "italic";
                                  setAnnotations((prev) =>
                                    prev.map((a) => (a.id === ann.id ? { ...a, fontStyle: nextI } : a))
                                  );
                                }}
                                className={`px-1.5 py-0.5 rounded italic font-bold text-[10px] cursor-pointer transition-colors ${
                                  ann.fontStyle === "italic" ? "bg-white/30 text-white" : "text-slate-300 hover:bg-white/15"
                                }`}
                                title="Italic"
                              >
                                I
                              </button>

                              {/* Color swatch input */}
                              <label
                                className="h-4 w-4 rounded-full border border-white/40 cursor-pointer overflow-hidden shadow-xs relative"
                                title="Text color"
                              >
                                <span
                                  className="absolute inset-0 block"
                                  style={{ backgroundColor: ann.textColor || "#0f172a" }}
                                />
                                <input
                                  type="color"
                                  value={ann.textColor || "#0f172a"}
                                  onChange={(e) => {
                                    const col = e.target.value;
                                    setAnnotations((prev) =>
                                      prev.map((a) => (a.id === ann.id ? { ...a, textColor: col } : a))
                                    );
                                  }}
                                  className="opacity-0 absolute inset-0 cursor-pointer"
                                />
                              </label>

                              {/* Whiteout toggle */}
                              <button
                                type="button"
                                onClick={() => {
                                  setAnnotations((prev) =>
                                    prev.map((a) =>
                                      a.id === ann.id
                                        ? { ...a, underlayWhiteout: !a.underlayWhiteout }
                                        : a
                                    )
                                  );
                                }}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                                  ann.underlayWhiteout
                                    ? "bg-emerald-600 text-white"
                                    : "text-slate-400 hover:bg-white/15"
                                }`}
                                title="Toggle whiteout patch under text to conceal original PDF"
                              >
                                {ann.underlayWhiteout ? "Hide BG: ON" : "Hide BG: OFF"}
                              </button>
                            </>
                          ) : (
                            <span className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider px-1">
                              {ann.type === "image" ? "Logo / Image" : ann.type}
                            </span>
                          )}

                          <div className="h-3 w-px bg-white/20" />

                          {ann.type === "text" && !isEditing && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTextId(ann.id);
                                setTimeout(() => textInputRef.current?.focus(), 50);
                              }}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/15 text-white transition-colors cursor-pointer text-[10px] font-medium"
                              title="Edit text"
                            >
                              <FilePenLine size={11} />
                              <span>Edit</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateAnnotation(ann.id);
                            }}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/15 text-white transition-colors cursor-pointer text-[10px] font-medium"
                            title="Duplicate element"
                          >
                            <Copy size={11} />
                            <span>Duplicate</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAnnotation(ann.id);
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer text-[10px] font-bold shadow-xs"
                            title="Remove element"
                          >
                            <Trash2 size={11} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {/* Live drawing preview */}
              {isInteracting && activeTool === "draw" && currentDrawPoints.length > 0 && (
                <svg className="absolute inset-0 pointer-events-none h-full w-full z-30">
                  <path
                    d={`M ${currentDrawPoints.map((p) => `${p.x * 100}% ${p.y * 100}%`).join(" L ")}`}
                    stroke={activeColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {/* Live shape preview */}
              {isInteracting && tempShape && (
                <div
                  className={`absolute pointer-events-none z-30 ${
                    activeTool === "erase"
                      ? "border-2 border-dashed border-rose-500 bg-rose-500/15 flex items-center justify-center"
                      : "border border-dashed border-blue-500 bg-blue-500/10"
                  }`}
                  style={{
                    left: `${tempShape.x * 100}%`,
                    top: `${tempShape.y * 100}%`,
                    width: `${tempShape.w * 100}%`,
                    height: `${tempShape.h * 100}%`
                  }}
                >
                  {activeTool === "erase" && (
                    <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                      Erase Area
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sejda Style Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-40 mx-auto max-w-4xl rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 shadow-2xl backdrop-blur-md dark:border-white/[0.1] dark:bg-slate-900/95 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Page Navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
            disabled={activePageIndex === 0}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            title="Previous page"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Prev</span>
          </button>
          <span className="px-2 font-bold text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
            Page {activePageIndex + 1} of {pagesPlan.length}
          </span>
          <button
            type="button"
            onClick={() => setActivePageIndex((p) => Math.min(pagesPlan.length - 1, p + 1))}
            disabled={activePageIndex >= pagesPlan.length - 1}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            title="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={14} />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.1] mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={addBlankPage}
            className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            title="Insert blank page after this page"
          >
            <Plus size={13} />
            <span>Insert Page</span>
          </button>
        </div>

        {/* Center / Right: Big Sejda Green "Apply changes" Button */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          {onSwitchViceVersa && (
            <button
              type="button"
              onClick={onSwitchViceVersa}
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              title="Compress PDF"
            >
              <ArrowLeftRight size={13} />
              <span>Compress</span>
            </button>
          )}

          {editedFile && onShareFile && (
            <button
              type="button"
              onClick={() => onShareFile(editedFile)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400 shadow-xs transition-all cursor-pointer"
            >
              <QrCode size={14} />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-6 sm:px-8 py-2.5 text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {exporting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Applying changes...</span>
              </>
            ) : (
              <>
                <CheckCheck size={17} />
                <span>Apply changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSignature size={20} className="text-blue-600" />
                <h3 className="text-base font-black">Create Signature</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setSignMode("draw")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${
                  signMode === "draw" ? "bg-white shadow-xs text-blue-600 dark:bg-slate-800 dark:text-white" : "text-slate-500"
                }`}
              >
                Draw Signature
              </button>
              <button
                type="button"
                onClick={() => setSignMode("type")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${
                  signMode === "type" ? "bg-white shadow-xs text-blue-600 dark:bg-slate-800 dark:text-white" : "text-slate-500"
                }`}
              >
                Type Cursive
              </button>
            </div>

            {signMode === "draw" ? (
              <div className="space-y-2">
                <div className="rounded-2xl border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
                  <canvas
                    ref={signCanvasRef}
                    width={480}
                    height={180}
                    onPointerDown={(e) => {
                      setIsSignDrawing(true);
                      const canvas = signCanvasRef.current;
                      if (!canvas) return;
                      const rect = canvas.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      setSignDrawPoints([{ x, y }]);
                      const ctx = canvas.getContext("2d");
                      if (ctx) {
                        ctx.strokeStyle = activeColor;
                        ctx.lineWidth = 3;
                        ctx.lineCap = "round";
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                      }
                    }}
                    onPointerMove={(e) => {
                      if (!isSignDrawing) return;
                      const canvas = signCanvasRef.current;
                      if (!canvas) return;
                      const rect = canvas.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      setSignDrawPoints((prev) => [...prev, { x, y }]);
                      const ctx = canvas.getContext("2d");
                      if (ctx) {
                        ctx.lineTo(x, y);
                        ctx.stroke();
                      }
                    }}
                    onPointerUp={() => setIsSignDrawing(false)}
                    className="h-[180px] w-full max-w-full cursor-crosshair touch-none rounded-xl border border-dashed border-slate-200 dark:border-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const canvas = signCanvasRef.current;
                    if (canvas) {
                      const ctx = canvas.getContext("2d");
                      ctx?.clearRect(0, 0, canvas.width, canvas.height);
                      setSignDrawPoints([]);
                    }
                  }}
                  className="text-[11px] font-bold text-slate-500 hover:text-rose-600"
                >
                  Clear signature
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={signTypedName}
                  onChange={(e) => setSignTypedName(e.target.value)}
                  placeholder="Type your name..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"
                />
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-950">
                  <span
                    className="text-3xl text-blue-600 dark:text-blue-400"
                    style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
                  >
                    {signTypedName || "Your Signature"}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="btn-secondary h-9 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (signMode === "draw") {
                    const canvas = signCanvasRef.current;
                    if (canvas && signDrawPoints.length > 0) {
                      handlePlaceSignature(canvas.toDataURL("image/png"));
                    } else {
                      notify("Please draw a signature first", "error");
                    }
                  } else {
                    // Generate typed signature canvas
                    const c = document.createElement("canvas");
                    c.width = 500;
                    c.height = 180;
                    const ctx = c.getContext("2d");
                    if (ctx) {
                      ctx.font = "italic 48px 'Dancing Script', 'Brush Script MT', cursive";
                      ctx.fillStyle = activeColor;
                      ctx.textAlign = "center";
                      ctx.textBaseline = "middle";
                      ctx.fillText(signTypedName, c.width / 2, c.height / 2);
                      handlePlaceSignature(c.toDataURL("image/png"));
                    }
                  }
                }}
                className="rounded-xl bg-blue-600 px-5 h-9 text-xs font-black text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
              >
                Insert onto Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Find & Replace Floating Modal */}
      {findAndReplaceOpen && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 w-80 sm:w-96 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-white/[0.1] dark:bg-slate-900/95 dark:text-white space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Replace size={15} />
              </div>
              <div>
                <h4 className="text-xs font-black">Find & Replace in PDF</h4>
                <p className="text-[10px] text-slate-400">Search and replace words across document</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFindAndReplaceOpen(false)}
              className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Find Text</label>
              <div className="relative mt-0.5">
                <input
                  type="text"
                  placeholder="Word or phrase to find..."
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  autoFocus
                />
                {findQuery && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    {getFindMatches().length} match(es)
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Replace With</label>
              <input
                type="text"
                placeholder="New replacement text..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="mt-0.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={findCaseSensitive}
                  onChange={(e) => setFindCaseSensitive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>Match Case</span>
              </label>

              <div className="flex items-center rounded-lg border border-slate-200 p-0.5 text-[10px] font-bold dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setFindScope("page")}
                  className={`rounded-md px-2 py-0.5 ${findScope === "page" ? "bg-blue-600 text-white" : "text-slate-500"}`}
                >
                  Current Page
                </button>
                <button
                  type="button"
                  onClick={() => setFindScope("all")}
                  className={`rounded-md px-2 py-0.5 ${findScope === "all" ? "bg-blue-600 text-white" : "text-slate-500"}`}
                >
                  All Pages
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setFindAndReplaceOpen(false)}
              className="btn-secondary h-8 px-3 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReplaceAll}
              disabled={!findQuery.trim() || getFindMatches().length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 h-8 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-40 shadow-sm shadow-blue-500/20"
            >
              <CheckCheck size={14} />
              <span>Replace All ({getFindMatches().length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Sejda Style Export Success Modal */}
      {showExportSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-slate-900 dark:text-white text-center space-y-5">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 ring-8 ring-emerald-500/10">
              <CheckCheck size={32} />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Your task is complete!
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                All changes have been applied to your PDF.
              </p>
            </div>

            {editedFile && (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 text-left dark:border-white/[0.06] dark:bg-slate-800/50 flex items-center justify-between">
                <div className="truncate max-w-[240px]">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {editedFile.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {formatBytes(editedFile.size)} • {pagesPlan.length} page(s)
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Ready
                </span>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {editedFile && (
                <button
                  type="button"
                  onClick={() => downloadBlob(editedFile, editedFile.name)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white py-3 text-sm font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Download size={16} />
                  <span>Download PDF</span>
                </button>
              )}

              {editedFile && onShareFile && (
                <button
                  type="button"
                  onClick={() => onShareFile(editedFile)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 py-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  <QrCode size={14} />
                  <span>Share via QR Code to Phone</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowExportSuccessModal(false)}
                className="w-full rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 py-2.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Keep Editing Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
