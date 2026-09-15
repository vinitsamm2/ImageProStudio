import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef
} from "react";
import {
  Canvas as FabricCanvas,
  Textbox as FabricTextbox,
  Rect as FabricRect,
  Circle as FabricCircle,
  Line as FabricLine,
  PencilBrush,
  FabricImage,
  FabricObject
} from "fabric";
import {
  Bold,
  Italic,
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Sparkles,
  Type
} from "lucide-react";
import { PdfExtractedTextItem } from "../../lib/files";

export interface FabricPdfOverlayRef {
  addTextbox: (text?: string, options?: any) => void;
  addRectangle: (options?: any) => void;
  addCircle: (options?: any) => void;
  addLine: (options?: any) => void;
  addWhiteout: (options?: any) => void;
  addImage: (url: string) => Promise<void>;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  exportOverlayDataUrl: () => string;
  hasObjects: () => boolean;
  clear: () => void;
}

interface FabricPdfOverlayProps {
  width: number;
  height: number;
  zoomScale: number;
  activeTool: string;
  activeColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: "sans" | "serif" | "mono" | "cursive";
  isBold: boolean;
  isItalic: boolean;
  onToolChange?: (tool: any) => void;
  onObjectSelected?: (obj: FabricObject | null) => void;
  onHistoryChange?: () => void;
}

const FONT_MAP: Record<string, string> = {
  sans: 'Arial, Helvetica, "Plus Jakarta Sans", sans-serif',
  serif: '"Times New Roman", Times, Georgia, serif',
  mono: '"Courier New", Courier, monospace',
  cursive: '"Brush Script MT", "Dancing Script", cursive'
};

const FabricPdfOverlay = forwardRef<FabricPdfOverlayRef, FabricPdfOverlayProps>(
  (
    {
      width,
      height,
      zoomScale,
      activeTool,
      activeColor,
      strokeWidth,
      fontSize,
      fontFamily,
      isBold,
      isItalic,
      onToolChange,
      onObjectSelected,
      onHistoryChange
    },
    ref
  ) => {
    const canvasElRef = useRef<HTMLCanvasElement | null>(null);
    const fabricRef = useRef<FabricCanvas | null>(null);

    // Floating contextual toolbar state
    const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
    const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
    const [activeObjFontFamily, setActiveObjFontFamily] = useState<string>("sans");
    const [activeObjFontSize, setActiveObjFontSize] = useState<number>(fontSize);
    const [activeObjBold, setActiveObjBold] = useState<boolean>(false);
    const [activeObjItalic, setActiveObjItalic] = useState<boolean>(false);
    const [activeObjFill, setActiveObjFill] = useState<string>("#0f172a");
    const [activeObjBg, setActiveObjBg] = useState<string>("#ffffff");

    // Initialize Fabric.js Canvas
    useEffect(() => {
      if (!canvasElRef.current) return;

      const canvasWidth = Math.round(width * zoomScale);
      const canvasHeight = Math.round(height * zoomScale);

      const fabricCanvas = new FabricCanvas(canvasElRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        selection: true,
        preserveObjectStacking: true
      });
      fabricRef.current = fabricCanvas;

      const updateToolbarPosition = () => {
        const active = fabricCanvas.getActiveObject();
        if (!active) {
          setSelectedObject(null);
          setToolbarPos(null);
          if (onObjectSelected) onObjectSelected(null);
          return;
        }

        setSelectedObject(active);
        if (onObjectSelected) onObjectSelected(active);

        const bound = active.getBoundingRect();
        setToolbarPos({
          x: Math.max(10, Math.min(canvasWidth - 280, bound.left)),
          y: Math.max(10, bound.top - 48)
        });

        if (active instanceof FabricTextbox) {
          setActiveObjFontSize(Math.round((active.fontSize || 16) / zoomScale));
          setActiveObjBold(active.fontWeight === "bold");
          setActiveObjItalic(active.fontStyle === "italic");
          setActiveObjFill(typeof active.fill === "string" ? active.fill : "#0f172a");
          setActiveObjBg(
            typeof active.backgroundColor === "string" ? active.backgroundColor : "#ffffff"
          );
        }
      };

      fabricCanvas.on("selection:created", updateToolbarPosition);
      fabricCanvas.on("selection:updated", updateToolbarPosition);
      fabricCanvas.on("selection:cleared", () => {
        setSelectedObject(null);
        setToolbarPos(null);
        if (onObjectSelected) onObjectSelected(null);
      });
      fabricCanvas.on("object:modified", () => {
        updateToolbarPosition();
        if (onHistoryChange) onHistoryChange();
      });
      fabricCanvas.on("object:added", () => {
        if (onHistoryChange) onHistoryChange();
      });
      fabricCanvas.on("object:removed", () => {
        if (onHistoryChange) onHistoryChange();
      });

      return () => {
        fabricCanvas.dispose();
        fabricRef.current = null;
      };
    }, [width, height, zoomScale]);

    // Handle Active Tool changes (e.g. Draw vs Select)
    useEffect(() => {
      const fabricCanvas = fabricRef.current;
      if (!fabricCanvas) return;

      if (activeTool === "draw") {
        fabricCanvas.isDrawingMode = true;
        fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
        fabricCanvas.freeDrawingBrush.color = activeColor;
        fabricCanvas.freeDrawingBrush.width = strokeWidth * zoomScale;
      } else {
        fabricCanvas.isDrawingMode = false;
      }
    }, [activeTool, activeColor, strokeWidth, zoomScale]);

    // Add Textbox
    const addTextbox = useCallback(
      (text = "Type here", options: any = {}) => {
        const fabricCanvas = fabricRef.current;
        if (!fabricCanvas) return;

        const effectiveFontSize = (options.fontSize || fontSize || 16) * zoomScale;
        const effectiveFontFam = FONT_MAP[options.fontFamily || fontFamily] || FONT_MAP.sans;

        const tb = new FabricTextbox(text, {
          left: options.left !== undefined ? options.left : width * zoomScale * 0.2,
          top: options.top !== undefined ? options.top : height * zoomScale * 0.2,
          width: options.width !== undefined ? options.width : 220 * zoomScale,
          fontSize: effectiveFontSize,
          fontFamily: effectiveFontFam,
          fontWeight: options.fontWeight || (isBold ? "bold" : "normal"),
          fontStyle: options.fontStyle || (isItalic ? "italic" : "normal"),
          fill: options.fill || activeColor || "#0f172a",
          backgroundColor: options.backgroundColor || "#ffffff", // clean whiteout underlay
          padding: 4,
          cornerColor: "#2563eb",
          cornerStrokeColor: "#ffffff",
          cornerSize: 8,
          transparentCorners: false,
          borderColor: "#3b82f6",
          editingBorderColor: "#2563eb",
          ...options
        });

        fabricCanvas.add(tb);
        fabricCanvas.setActiveObject(tb);
        tb.enterEditing();
        tb.selectAll();
        fabricCanvas.renderAll();

        if (onToolChange) onToolChange("select");
      },
      [width, height, zoomScale, fontSize, fontFamily, isBold, isItalic, activeColor, onToolChange]
    );

    // Add Rectangle
    const addRectangle = useCallback(
      (options: any = {}) => {
        const fabricCanvas = fabricRef.current;
        if (!fabricCanvas) return;

        const rect = new FabricRect({
          left: options.left || width * zoomScale * 0.3,
          top: options.top || height * zoomScale * 0.3,
          width: options.width || 140 * zoomScale,
          height: options.height || 80 * zoomScale,
          fill: options.fill || "transparent",
          stroke: options.stroke || activeColor || "#2563eb",
          strokeWidth: options.strokeWidth || strokeWidth * zoomScale,
          cornerColor: "#2563eb",
          cornerStrokeColor: "#ffffff",
          cornerSize: 8,
          transparentCorners: false,
          ...options
        });

        fabricCanvas.add(rect);
        fabricCanvas.setActiveObject(rect);
        fabricCanvas.renderAll();

        if (onToolChange) onToolChange("select");
      },
      [width, height, zoomScale, activeColor, strokeWidth, onToolChange]
    );

    // Add Whiteout Rect
    const addWhiteout = useCallback(
      (options: any = {}) => {
        const fabricCanvas = fabricRef.current;
        if (!fabricCanvas) return;

        const whiteout = new FabricRect({
          left: options.left || width * zoomScale * 0.3,
          top: options.top || height * zoomScale * 0.3,
          width: options.width || 150 * zoomScale,
          height: options.height || 40 * zoomScale,
          fill: options.fill || "#ffffff",
          strokeWidth: 0,
          cornerColor: "#2563eb",
          cornerStrokeColor: "#ffffff",
          cornerSize: 8,
          transparentCorners: false,
          ...options
        });

        fabricCanvas.add(whiteout);
        fabricCanvas.setActiveObject(whiteout);
        fabricCanvas.renderAll();

        if (onToolChange) onToolChange("select");
      },
      [width, height, zoomScale, onToolChange]
    );

    // Add Circle
    const addCircle = useCallback(
      (options: any = {}) => {
        const fabricCanvas = fabricRef.current;
        if (!fabricCanvas) return;

        const circle = new FabricCircle({
          left: options.left || width * zoomScale * 0.35,
          top: options.top || height * zoomScale * 0.35,
          radius: options.radius || 45 * zoomScale,
          fill: options.fill || "transparent",
          stroke: options.stroke || activeColor || "#dc2626",
          strokeWidth: options.strokeWidth || strokeWidth * zoomScale,
          cornerColor: "#2563eb",
          cornerStrokeColor: "#ffffff",
          cornerSize: 8,
          transparentCorners: false,
          ...options
        });

        fabricCanvas.add(circle);
        fabricCanvas.setActiveObject(circle);
        fabricCanvas.renderAll();

        if (onToolChange) onToolChange("select");
      },
      [width, height, zoomScale, activeColor, strokeWidth, onToolChange]
    );

    // Add Line
    const addLine = useCallback(
      (options: any = {}) => {
        const fabricCanvas = fabricRef.current;
        if (!fabricCanvas) return;

        const x1 = options.x1 || width * zoomScale * 0.25;
        const y1 = options.y1 || height * zoomScale * 0.35;
        const x2 = options.x2 || width * zoomScale * 0.55;
        const y2 = options.y2 || height * zoomScale * 0.35;

        const line = new FabricLine([x1, y1, x2, y2], {
          stroke: options.stroke || activeColor || "#0f172a",
          strokeWidth: options.strokeWidth || strokeWidth * zoomScale,
          cornerColor: "#2563eb",
          cornerStrokeColor: "#ffffff",
          cornerSize: 8,
          transparentCorners: false,
          ...options
        });

        fabricCanvas.add(line);
        fabricCanvas.setActiveObject(line);
        fabricCanvas.renderAll();

        if (onToolChange) onToolChange("select");
      },
      [width, height, zoomScale, activeColor, strokeWidth, onToolChange]
    );

    // Add Image / Logo / Signature
    const addImage = useCallback(
      async (url: string) => {
        const fabricCanvas = fabricRef.current;
        if (!fabricCanvas) return;

        try {
          const img = await FabricImage.fromURL(url);
          const maxDim = 250 * zoomScale;
          if (img.width && img.height && (img.width > maxDim || img.height > maxDim)) {
            const scale = maxDim / Math.max(img.width, img.height);
            img.scale(scale);
          }
          img.set({
            left: width * zoomScale * 0.3,
            top: height * zoomScale * 0.3,
            cornerColor: "#2563eb",
            cornerStrokeColor: "#ffffff",
            cornerSize: 8,
            transparentCorners: false
          });

          fabricCanvas.add(img);
          fabricCanvas.setActiveObject(img);
          fabricCanvas.renderAll();

          if (onToolChange) onToolChange("select");
        } catch (err) {
          console.warn("Could not load image onto Fabric canvas:", err);
        }
      },
      [width, height, zoomScale, onToolChange]
    );

    // Delete active object
    const deleteSelected = useCallback(() => {
      const fabricCanvas = fabricRef.current;
      if (!fabricCanvas) return;
      const active = fabricCanvas.getActiveObject();
      if (!active) return;

      fabricCanvas.remove(active);
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      setSelectedObject(null);
      setToolbarPos(null);
    }, []);

    // Duplicate active object
    const duplicateSelected = useCallback(async () => {
      const fabricCanvas = fabricRef.current;
      if (!fabricCanvas) return;
      const active = fabricCanvas.getActiveObject();
      if (!active) return;

      const cloned = await active.clone();
      cloned.set({
        left: (cloned.left || 0) + 16,
        top: (cloned.top || 0) + 16
      });
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
    }, []);

    // Export overlay as 2.0x high-DPI raster dataUrl for PDF-LIB embedding
    const exportOverlayDataUrl = useCallback((): string => {
      const fabricCanvas = fabricRef.current;
      if (!fabricCanvas) return "";
      const multiplier = 2.0 / zoomScale;
      return fabricCanvas.toDataURL({
        format: "png",
        multiplier
      });
    }, [zoomScale]);

    const hasObjects = useCallback((): boolean => {
      const fabricCanvas = fabricRef.current;
      if (!fabricCanvas) return false;
      return fabricCanvas.getObjects().length > 0;
    }, []);

    const clear = useCallback(() => {
      const fabricCanvas = fabricRef.current;
      if (!fabricCanvas) return;
      fabricCanvas.clear();
      setSelectedObject(null);
      setToolbarPos(null);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        addTextbox,
        addRectangle,
        addCircle,
        addLine,
        addWhiteout,
        addImage,
        deleteSelected,
        duplicateSelected,
        exportOverlayDataUrl,
        hasObjects,
        clear
      }),
      [
        addTextbox,
        addRectangle,
        addCircle,
        addLine,
        addWhiteout,
        addImage,
        deleteSelected,
        duplicateSelected,
        exportOverlayDataUrl,
        hasObjects,
        clear
      ]
    );

    return (
      <div className="absolute inset-0 z-20 pointer-events-auto">
        <canvas ref={canvasElRef} className="block w-full h-full" />

        {/* Floating Contextual Toolbar above selected Fabric object */}
        {selectedObject && toolbarPos && (
          <div
            className="absolute z-50 flex items-center gap-1 p-1 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-white/20 backdrop-blur-md animate-in fade-in duration-100"
            style={{
              left: `${toolbarPos.x}px`,
              top: `${toolbarPos.y}px`
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {selectedObject instanceof FabricTextbox && (
              <>
                {/* Font Size Decrement */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedObject instanceof FabricTextbox) {
                      const nextSize = Math.max(9, activeObjFontSize - 1);
                      selectedObject.set("fontSize", nextSize * zoomScale);
                      fabricRef.current?.renderAll();
                      setActiveObjFontSize(nextSize);
                    }
                  }}
                  className="grid h-7 w-7 place-items-center rounded-lg hover:bg-white/10 text-xs font-bold"
                  title="Decrease Font Size"
                >
                  -
                </button>
                <span className="min-w-[28px] text-center font-mono text-xs font-bold">
                  {activeObjFontSize}
                </span>
                {/* Font Size Increment */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedObject instanceof FabricTextbox) {
                      const nextSize = Math.min(72, activeObjFontSize + 1);
                      selectedObject.set("fontSize", nextSize * zoomScale);
                      fabricRef.current?.renderAll();
                      setActiveObjFontSize(nextSize);
                    }
                  }}
                  className="grid h-7 w-7 place-items-center rounded-lg hover:bg-white/10 text-xs font-bold"
                  title="Increase Font Size"
                >
                  +
                </button>

                <div className="h-4 w-px bg-white/20 mx-0.5" />

                {/* Bold */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedObject instanceof FabricTextbox) {
                      const nextBold = !activeObjBold;
                      selectedObject.set("fontWeight", nextBold ? "bold" : "normal");
                      fabricRef.current?.renderAll();
                      setActiveObjBold(nextBold);
                    }
                  }}
                  className={`grid h-7 w-7 place-items-center rounded-lg ${
                    activeObjBold ? "bg-blue-600 text-white font-black" : "hover:bg-white/10"
                  }`}
                  title="Bold"
                >
                  <Bold size={13} />
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedObject instanceof FabricTextbox) {
                      const nextItalic = !activeObjItalic;
                      selectedObject.set("fontStyle", nextItalic ? "italic" : "normal");
                      fabricRef.current?.renderAll();
                      setActiveObjItalic(nextItalic);
                    }
                  }}
                  className={`grid h-7 w-7 place-items-center rounded-lg ${
                    activeObjItalic ? "bg-blue-600 text-white" : "hover:bg-white/10"
                  }`}
                  title="Italic"
                >
                  <Italic size={13} />
                </button>

                {/* Text Color Picker */}
                <input
                  type="color"
                  value={activeObjFill}
                  onChange={(e) => {
                    const color = e.target.value;
                    if (selectedObject instanceof FabricTextbox) {
                      selectedObject.set("fill", color);
                      fabricRef.current?.renderAll();
                      setActiveObjFill(color);
                    }
                  }}
                  className="h-6 w-6 rounded-md cursor-pointer border border-white/20 bg-transparent p-0"
                  title="Text Color"
                />

                {/* Whiteout / Background Color Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedObject instanceof FabricTextbox) {
                      const hasBg = selectedObject.backgroundColor && selectedObject.backgroundColor !== "transparent";
                      selectedObject.set("backgroundColor", hasBg ? "transparent" : "#ffffff");
                      fabricRef.current?.renderAll();
                      setActiveObjBg(hasBg ? "transparent" : "#ffffff");
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    activeObjBg !== "transparent" ? "bg-emerald-600 text-white" : "hover:bg-white/10 text-slate-300"
                  }`}
                  title="Toggle Whiteout Underlay (Cover background PDF text)"
                >
                  Whiteout
                </button>

                <div className="h-4 w-px bg-white/20 mx-0.5" />
              </>
            )}

            {/* Duplicate */}
            <button
              type="button"
              onClick={duplicateSelected}
              className="grid h-7 w-7 place-items-center rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              title="Duplicate"
            >
              <Copy size={13} />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={deleteSelected}
              className="grid h-7 w-7 place-items-center rounded-lg hover:bg-rose-600 text-rose-300 hover:text-white"
              title="Delete Object"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    );
  }
);

FabricPdfOverlay.displayName = "FabricPdfOverlay";

export default FabricPdfOverlay;
