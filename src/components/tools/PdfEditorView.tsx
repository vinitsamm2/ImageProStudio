import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eraser,
  EyeOff,
  FilePenLine,
  FileSignature,
  FileText,
  Highlighter,
  Image as ImageIcon,
  Layers,
  Minus,
  MousePointer,
  Move,
  PenTool,
  Plus,
  QrCode,
  Redo2,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Square,
  Circle,
  Stamp,
  Trash2,
  Type,
  Undo2,
  Upload,
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
  PdfFileInfo,
  compileEditedPdf,
  downloadBlob,
  formatBytes,
  readPdfInfo,
  renderPdfPageToDataUrl,
  uid
} from "../../lib/files";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

type ToolMode =
  | "select"
  | "text"
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

  // Annotations & History
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const [history, setHistory] = useState<PdfAnnotation[][]>([]);
  const [redoStack, setRedoStack] = useState<PdfAnnotation[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Active Tool & Mode
  const [activeTool, setActiveTool] = useState<ToolMode>("select");

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

      const plan: EditorPagePlanItem[] = Array.from({ length: pdf.pages }, (_, i) => ({
        id: `page-${i + 1}-${uid("plan")}`,
        originalPage: i + 1,
        rotation: 0
      }));
      setPagesPlan(plan);
      notify(`Loaded PDF with ${pdf.pages} page(s). Pick a tool to start editing!`, "info");
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

  // Render current page preview
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
      renderPdfPageToDataUrl(info.file, currentPlan.originalPage, 1.5, currentPlan.rotation)
        .then((url) => {
          if (!isCancelled) {
            setPageImage(url);
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
      setLoadingPage(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [info, activePageIndex, pagesPlan]);

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
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && !editingTextId) {
          e.preventDefault();
          deleteAnnotation(selectedId);
        }
      } else if (e.key.toLowerCase() === "v") {
        setActiveTool("select");
      } else if (e.key.toLowerCase() === "t") {
        setActiveTool("text");
      } else if (e.key.toLowerCase() === "p") {
        setActiveTool("draw");
      } else if (e.key.toLowerCase() === "h") {
        setActiveTool("highlight");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, editingTextId, handleUndo, handleRedo]);

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

    if (activeTool === "select") {
      // If clicking outside any annotation, deselect
      if (!(e.target as HTMLElement).closest(".pdf-annotation-box")) {
        setSelectedId(null);
        setEditingTextId(null);
      }
      return;
    }

    if (activeTool === "text") {
      // Add text box at clicked location
      const newTextAnn: PdfAnnotation = {
        id: uid("text"),
        pageIndex: activePageIndex,
        type: "text",
        xNorm: Math.min(0.75, xNorm),
        yNorm: Math.min(0.9, yNorm),
        widthNorm: 0.28,
        heightNorm: 0.08,
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
      const blob = await compileEditedPdf(info.file, pagesPlan, annotations);
      const safeName = info.file.name.replace(/\.[^.]+$/, "");
      const outputFilename = `${safeName}-edited.pdf`;

      const finalFile = new File([blob], outputFilename, { type: "application/pdf" });
      setEditedFile(finalFile);

      downloadBlob(blob, outputFilename);
      notify("Edited PDF compiled & downloaded successfully!", "success");
    } catch (err) {
      console.error(err);
      notify("Failed to compile edited PDF. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  const selectedAnnotation = annotations.find((a) => a.id === selectedId);
  const pageAnnotations = annotations.filter((a) => a.pageIndex === activePageIndex);

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
            onClick={() => setZoomScale((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
            className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="min-w-[42px] text-center font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
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

          <div className="h-5 w-px bg-slate-200 dark:bg-white/[0.1] mx-0.5" />

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

      {/* Primary Tool Mode Selection Dock */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/70 p-2 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60">
        {[
          { id: "select" as const, label: "Select", icon: MousePointer, key: "V" },
          { id: "text" as const, label: "Text", icon: Type, key: "T" },
          { id: "draw" as const, label: "Pen", icon: PenTool, key: "P" },
          { id: "highlight" as const, label: "Highlight", icon: Highlighter, key: "H" },
          { id: "rectangle" as const, label: "Rectangle", icon: Square },
          { id: "circle" as const, label: "Circle", icon: Circle },
          { id: "line" as const, label: "Line", icon: Minus },
          { id: "arrow" as const, label: "Arrow", icon: ArrowRight },
          { id: "redact" as const, label: "Redact", icon: EyeOff },
          { id: "stamp" as const, label: "Stamp", icon: Stamp },
          { id: "sign" as const, label: "Sign", icon: FileSignature }
        ].map((tool) => {
          const Icon = tool.icon;
          const isCurrent = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => {
                if (tool.id === "sign") {
                  setShowSignModal(true);
                } else {
                  setActiveTool(tool.id);
                  if (tool.id !== "select") setSelectedId(null);
                }
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                isCurrent
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={14} />
              <span>{tool.label}</span>
              {tool.key && (
                <span className={`text-[10px] font-mono px-1 rounded ${
                  isCurrent ? "bg-white/20 text-white" : "bg-slate-200/60 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  {tool.key}
                </span>
              )}
            </button>
          );
        })}

        {/* Upload Image Button */}
        <label className="flex items-center gap-1.5 cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all">
          <ImageIcon size={14} />
          <span>Insert Image</span>
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
      </div>

      {/* Contextual Properties Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 dark:border-white/[0.06] dark:bg-slate-900/40 text-xs">
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
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Size:</span>
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
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {[10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64].map((s) => (
                  <option key={s} value={s}>
                    {s}pt
                  </option>
                ))}
              </select>
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
                <option value="sans">Sans (Inter)</option>
                <option value="serif">Serif (Georgia)</option>
                <option value="mono">Monospace</option>
                <option value="cursive">Cursive (Script)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                const b = !isBold;
                setIsBold(b);
                if (selectedId) {
                  setAnnotations((prev) =>
                    prev.map((a) => (a.id === selectedId ? { ...a, fontWeight: b ? "bold" : "normal" } : a))
                  );
                }
              }}
              className={`h-7 w-7 rounded-lg border font-black ${
                isBold
                  ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                  : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => {
                const it = !isItalic;
                setIsItalic(it);
                if (selectedId) {
                  setAnnotations((prev) =>
                    prev.map((a) => (a.id === selectedId ? { ...a, fontStyle: it ? "italic" : "normal" } : a))
                  );
                }
              }}
              className={`h-7 w-7 rounded-lg border italic font-serif font-bold ${
                isItalic
                  ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                  : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              I
            </button>
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
        {/* Left Page Rail */}
        <div className="w-full lg:w-48 shrink-0 rounded-3xl border border-slate-200/80 bg-white/70 p-3 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/50 space-y-2.5">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-200/60 dark:border-white/[0.06]">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">Pages ({pagesPlan.length})</span>
            <button
              type="button"
              onClick={addBlankPage}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400"
              title="Add blank A4 page"
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

            {/* Interactive Page Container */}
            <div
              ref={pageContainerRef}
              onPointerDown={handleStagePointerDown}
              onPointerMove={handleStagePointerMove}
              onPointerUp={handleStagePointerUp}
              className={`relative overflow-hidden rounded-2xl shadow-xl border border-slate-200/80 bg-white dark:border-white/[0.1] select-none transition-transform duration-100 ${
                activeTool === "select" ? "cursor-default" : activeTool === "text" ? "cursor-text" : "cursor-crosshair"
              }`}
              style={{
                width: `${Math.round(595 * zoomScale)}px`,
                minHeight: `${Math.round(842 * zoomScale)}px`,
                aspectRatio: "595 / 842"
              }}
            >
              {/* Rendered PDF Page Background Image */}
              {pageImage && (
                <img
                  src={pageImage}
                  alt="Page Background"
                  className="pointer-events-none h-full w-full object-contain"
                  draggable={false}
                />
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
                      if (activeTool === "select") {
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
                        className="h-full w-full overflow-hidden p-1 leading-tight flex items-start"
                        style={{
                          fontSize: `${(ann.fontSize || 16) * zoomScale}px`,
                          fontFamily:
                            ann.fontFamily === "serif"
                              ? "Georgia, serif"
                              : ann.fontFamily === "mono"
                              ? "Courier New, monospace"
                              : ann.fontFamily === "cursive"
                              ? "'Dancing Script', cursive"
                              : "Inter, sans-serif",
                          fontWeight: ann.fontWeight || "normal",
                          fontStyle: ann.fontStyle || "normal",
                          color: ann.textColor || "#0f172a",
                          backgroundColor: ann.textHighlightColor || "transparent"
                        }}
                      >
                        {isEditing ? (
                          <textarea
                            ref={textInputRef}
                            value={ann.text || ""}
                            onChange={(e) => {
                              const newText = e.target.value;
                              setAnnotations((prev) =>
                                prev.map((a) => (a.id === ann.id ? { ...a, text: newText } : a))
                              );
                            }}
                            onBlur={() => setEditingTextId(null)}
                            className="h-full w-full resize-none bg-transparent p-0 outline-hidden font-inherit text-inherit"
                            autoFocus
                          />
                        ) : (
                          <span className="whitespace-pre-wrap break-words">{ann.text}</span>
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
                  className="absolute pointer-events-none border border-dashed border-blue-500 bg-blue-500/10 z-30"
                  style={{
                    left: `${tempShape.x * 100}%`,
                    top: `${tempShape.y * 100}%`,
                    width: `${tempShape.w * 100}%`,
                    height: `${tempShape.h * 100}%`
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action / Export Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              Ready to Save & Export
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {annotations.length} Total Annotation(s)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Vector high-DPI rasterization • 100% compliant with examination & corporate portals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onSwitchViceVersa && (
            <button
              type="button"
              onClick={onSwitchViceVersa}
              className="btn-secondary h-10 px-3.5 text-xs font-bold"
              title="Need smaller file size for exam portals?"
            >
              <ArrowLeftRight size={14} />
              <span>Compress PDF</span>
            </button>
          )}

          {editedFile && onShareFile && (
            <button
              type="button"
              onClick={() => onShareFile(editedFile)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 h-10 text-xs font-bold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400 shadow-xs transition-all"
            >
              <QrCode size={15} />
              <span>Share to Phone</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 h-10 text-xs font-black text-white shadow-lg shadow-blue-500/25 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {exporting ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Compiling PDF...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Save & Download PDF</span>
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
                    className="h-[180px] w-full cursor-crosshair touch-none"
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
    </div>
  );
}
