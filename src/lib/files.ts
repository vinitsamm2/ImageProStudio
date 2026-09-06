import JSZip from "jszip";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

// Standard worker initialization in Vite
if (typeof window !== "undefined") {
  GlobalWorkerOptions.workerSrc = workerUrl;
}

export type Unit = "px" | "mm" | "cm" | "in";
export type FitMode = "fit" | "fill" | "original";
export type Orientation = "portrait" | "landscape";
export type PageSizeName = "A4" | "A3" | "A5" | "Letter" | "Legal" | "Custom";

export type ImageItem = {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  rotation: number;
};

export type PdfFileInfo = {
  id: string;
  file: File;
  pages: number;
  thumbnails: string[];
  baseWidth?: number;
  baseHeight?: number;
};

export const pageSizes: Record<Exclude<PageSizeName, "Custom">, [number, number]> = {
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
  A5: [419.53, 595.28],
  Letter: [612, 792],
  Legal: [612, 1008]
};

export function uid(prefix = "file") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

export function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function createZipBlob(files: Array<{ name: string; blob: Blob }>): Promise<Blob> {
  const zip = new JSZip();
  files.forEach((file) => zip.file(file.name, file.blob));
  return await zip.generateAsync({ type: "blob" });
}

export async function zipAndDownload(files: Array<{ name: string; blob: Blob }>, name: string) {
  const blob = await createZipBlob(files);
  downloadBlob(blob, name);
}

function bytesToBlob(bytes: Uint8Array, type: string) {
  const copy = new Uint8Array(bytes);
  return new Blob([copy.buffer], { type });
}

// Robust image loader using HTMLImageElement onload
export async function loadBitmap(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      // Allow canvas draw operations to complete before revoking
      window.setTimeout(() => URL.revokeObjectURL(url), 15000);
      resolve(image);
    };
    image.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image. Please ensure the file is a valid image format."));
    };
    image.src = url;
  });
}

export async function createImageItem(file: File): Promise<ImageItem> {
  const image = await loadBitmap(file);
  return {
    id: uid("image"),
    file,
    url: URL.createObjectURL(file),
    width: image.naturalWidth || image.width || 800,
    height: image.naturalHeight || image.height || 600,
    rotation: 0
  };
}

export function canvasToBmpBlob(canvas: HTMLCanvasElement): Blob {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context is unavailable.");
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 32-bit standard BMP (BGRA) bottom-up
  const headerSize = 54;
  const imageSize = width * height * 4;
  const fileSize = headerSize + imageSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // Bitmap File Header (14 bytes)
  view.setUint16(0, 0x4d42, false); // "BM"
  view.setUint32(2, fileSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, headerSize, true);

  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // bottom-up
  view.setUint16(26, 1, true);
  view.setUint16(28, 32, true); // 32 bpp
  view.setUint32(30, 0, true); // BI_RGB
  view.setUint32(34, imageSize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  const pixels = new Uint8Array(buffer, headerSize);
  for (let y = 0; y < height; y++) {
    const srcRow = (height - 1 - y) * width * 4;
    const dstRow = y * width * 4;
    for (let x = 0; x < width; x++) {
      const si = srcRow + x * 4;
      const di = dstRow + x * 4;
      pixels[di] = data[si + 2];     // Blue
      pixels[di + 1] = data[si + 1]; // Green
      pixels[di + 2] = data[si];     // Red
      pixels[di + 3] = data[si + 3]; // Alpha
    }
  }

  return new Blob([buffer], { type: "image/bmp" });
}

export function canvasToTiffBlob(canvas: HTMLCanvasElement): Blob {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context is unavailable.");
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const ifdOffset = 8;
  const numEntries = 11;
  const ifdSize = 2 + numEntries * 12 + 4;
  const extraOffset = ifdOffset + ifdSize;
  const extraSize = 8 + 8 + 8;
  const pixelOffset = extraOffset + extraSize;
  const pixelSize = width * height * 4;
  const totalSize = pixelOffset + pixelSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // 1. Header (8 bytes)
  view.setUint16(0, 0x4949, false); // "II" Little Endian
  view.setUint16(2, 42, true);       // Magic number
  view.setUint32(4, ifdOffset, true); // Offset to 1st IFD

  // 2. IFD entries
  let offset = ifdOffset;
  view.setUint16(offset, numEntries, true);
  offset += 2;

  function writeEntry(tag: number, type: number, count: number, valueOrOffset: number) {
    view.setUint16(offset, tag, true);
    view.setUint16(offset + 2, type, true);
    view.setUint32(offset + 4, count, true);
    view.setUint32(offset + 8, valueOrOffset, true);
    offset += 12;
  }

  writeEntry(256, 4, 1, width);
  writeEntry(257, 4, 1, height);
  writeEntry(258, 3, 4, extraOffset);
  writeEntry(259, 3, 1, 1); // Compression: 1 = uncompressed
  writeEntry(262, 3, 1, 2); // RGB
  writeEntry(273, 4, 1, pixelOffset);
  writeEntry(277, 3, 1, 4); // Samples per pixel: 4 (RGBA)
  writeEntry(278, 4, 1, height);
  writeEntry(279, 4, 1, pixelSize);
  writeEntry(282, 5, 1, extraOffset + 8); // XResolution
  writeEntry(283, 5, 1, extraOffset + 16); // YResolution

  view.setUint32(offset, 0, true);

  // Extra data: BitsPerSample [8, 8, 8, 8]
  view.setUint16(extraOffset, 8, true);
  view.setUint16(extraOffset + 2, 8, true);
  view.setUint16(extraOffset + 4, 8, true);
  view.setUint16(extraOffset + 6, 8, true);

  // XResolution: 300 / 1
  view.setUint32(extraOffset + 8, 300, true);
  view.setUint32(extraOffset + 12, 1, true);

  // YResolution: 300 / 1
  view.setUint32(extraOffset + 16, 300, true);
  view.setUint32(extraOffset + 20, 1, true);

  const pixelBytes = new Uint8Array(buffer, pixelOffset);
  pixelBytes.set(data);

  return new Blob([buffer], { type: "image/tiff" });
}

export function canvasToSvgBlob(canvas: HTMLCanvasElement): Blob {
  const dataUrl = canvas.toDataURL("image/png");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <title>Rendered PDF Page</title>
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataUrl}"/>
</svg>`;
  return new Blob([svg], { type: "image/svg+xml" });
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality = 0.92
): Promise<Blob> {
  if (type === "image/bmp") {
    return canvasToBmpBlob(canvas);
  }
  if (type === "image/tiff") {
    return canvasToTiffBlob(canvas);
  }
  if (type === "image/svg+xml") {
    return canvasToSvgBlob(canvas);
  }

  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Graceful fallback to image/png if requested format (e.g. avif/gif) unsupported by current browser engine
            canvas.toBlob(
              (fallback) => (fallback ? resolve(fallback) : reject(new Error("Unable to export canvas image."))),
              "image/png"
            );
          }
        },
        type,
        quality
      );
    } catch {
      canvas.toBlob(
        (fallback) => (fallback ? resolve(fallback) : reject(new Error("Unable to export canvas image."))),
        "image/png"
      );
    }
  });
}

export function convertLength(value: number, from: Unit, to: Unit, dpi: number): number {
  if (from === to) return value;
  const inches =
    from === "px" ? value / dpi :
    from === "mm" ? value / 25.4 :
    from === "cm" ? value / 2.54 :
    value;
  return to === "px" ? inches * dpi : to === "mm" ? inches * 25.4 : to === "cm" ? inches * 2.54 : inches;
}

export function buildCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

// Resizes image with high-quality bicubic interpolation
export async function resizeImage(
  file: File,
  width: number,
  height: number,
  type = "image/png",
  quality = 0.94
): Promise<Blob> {
  const image = await loadBitmap(file);
  const canvas = buildCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D Canvas context is not supported in this browser.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (type === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return await canvasToBlob(canvas, type, quality);
}

// Compresses or converts image to given format & quality
export async function compressOrConvertImage(
  file: File,
  type: string,
  quality: number
): Promise<Blob> {
  const image = await loadBitmap(file);
  const canvas = buildCanvas(image.naturalWidth, image.naturalHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D Canvas context is not supported in this browser.");

  if (type === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(image, 0, 0);
  return await canvasToBlob(canvas, type, quality);
}

export type PdfCompressionPreset = "extreme" | "recommended" | "low" | "custom";

export interface CompressPdfOptions {
  quality?: number; // 0.1 to 1.0 (default 0.72)
  preset?: PdfCompressionPreset;
  targetDpi?: number;
  onProgress?: (current: number, total: number) => void;
}

// In-browser PDF compression by re-rasterizing and downsampling page canvases with object streams
export async function compressPdf(
  file: File,
  optionsOrQuality: number | CompressPdfOptions = 0.72
): Promise<Blob> {
  const options: CompressPdfOptions =
    typeof optionsOrQuality === "number"
      ? { quality: optionsOrQuality }
      : optionsOrQuality;

  let quality = options.quality ?? 0.72;
  let renderScale = 1.0 + quality * 1.3;

  if (options.preset === "extreme") {
    quality = 0.45;
    renderScale = 1.0; // ~96-100 DPI
  } else if (options.preset === "recommended") {
    quality = 0.72;
    renderScale = 1.4; // ~135-150 DPI
  } else if (options.preset === "low") {
    quality = 0.88;
    renderScale = 2.0; // ~190-200 DPI
  } else if (options.targetDpi) {
    renderScale = Math.max(0.75, options.targetDpi / 72);
  }

  const buffer = await file.arrayBuffer();
  const doc = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const numPages = doc.numPages;

  const newPdf = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    if (options.onProgress) {
      options.onProgress(i, numPages);
    }
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const jpegBlob = await canvasToBlob(canvas, "image/jpeg", quality);
    const jpegBytes = await jpegBlob.arrayBuffer();
    const embeddedImg = await newPdf.embedJpg(jpegBytes);

    const baseViewport = page.getViewport({ scale: 1 });
    const pdfPage = newPdf.addPage([baseViewport.width, baseViewport.height]);
    pdfPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height
    });
  }

  const outputBytes = await newPdf.save({ useObjectStreams: true });
  return bytesToBlob(outputBytes, "application/pdf");
}

// Estimates output size based on dimension changes, quality curve, and format
export function estimateFileSize({
  originalSize,
  originalWidth,
  originalHeight,
  targetWidth,
  targetHeight,
  quality = 0.8,
  format = "image/jpeg",
  isPdf = false
}: {
  originalSize: number;
  originalWidth?: number;
  originalHeight?: number;
  targetWidth?: number;
  targetHeight?: number;
  quality?: number;
  format?: string;
  isPdf?: boolean;
}): { bytes: number; changePercent: number; isReduction: boolean } {
  if (originalSize <= 0) return { bytes: 0, changePercent: 0, isReduction: true };

  if (isPdf) {
    const factor = 0.2 + Math.pow(quality, 1.4) * 0.7;
    const bytes = Math.max(1024, Math.round(originalSize * factor));
    const changePercent = Math.round(((bytes - originalSize) / originalSize) * 100);
    return { bytes, changePercent, isReduction: bytes <= originalSize };
  }

  const origPixels = (originalWidth && originalHeight && originalWidth > 0 && originalHeight > 0)
    ? originalWidth * originalHeight
    : 1;
  const targPixels = (targetWidth && targetHeight && targetWidth > 0 && targetHeight > 0)
    ? targetWidth * targetHeight
    : origPixels;

  const pixelRatio = targPixels / origPixels;

  let formatMultiplier = 0.85;
  if (format === "image/webp" || format === "webp") formatMultiplier = 0.6;
  else if (format === "image/avif" || format === "avif") formatMultiplier = 0.45;
  else if (format === "image/png" || format === "png") formatMultiplier = 1.35;
  else if (format === "image/jpeg" || format === "jpg" || format === "jpeg" || format === "jepg") formatMultiplier = 0.85;
  else if (format === "image/bmp" || format === "bmp") formatMultiplier = 3.8;
  else if (format === "image/tiff" || format === "tiff") formatMultiplier = 3.5;
  else if (format === "image/svg+xml" || format === "svg") formatMultiplier = 1.4;
  else if (format === "image/gif" || format === "gif") formatMultiplier = 1.1;

  const qualityCurve = Math.pow(Math.max(0.1, quality), 1.35);

  let bytes = Math.round(originalSize * pixelRatio * formatMultiplier * qualityCurve);
  bytes = Math.max(1024, bytes);
  const changePercent = Math.round(((bytes - originalSize) / originalSize) * 100);
  return { bytes, changePercent, isReduction: bytes <= originalSize };
}

// Canvas extender / padding
export async function expandCanvas(
  file: File,
  width: number,
  height: number,
  background: string,
  transparent: boolean,
  align: "all sides" | "top" | "bottom" | "left" | "right"
): Promise<Blob> {
  const image = await loadBitmap(file);
  const canvas = buildCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D Canvas context is not supported.");

  if (!transparent) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  let x = Math.round((canvas.width - image.naturalWidth) / 2);
  let y = Math.round((canvas.height - image.naturalHeight) / 2);

  if (align === "top") y = 0;
  if (align === "bottom") y = canvas.height - image.naturalHeight;
  if (align === "left") x = 0;
  if (align === "right") x = canvas.width - image.naturalWidth;

  ctx.drawImage(image, x, y);
  return await canvasToBlob(canvas, transparent ? "image/png" : "image/jpeg", 0.94);
}

// Pre-renders rotated image on canvas for clean PDF insertion
async function getRotatedImagePng(item: ImageItem): Promise<Blob> {
  const image = await loadBitmap(item.file);
  const rot = ((item.rotation % 360) + 360) % 360;
  const isTransposed = rot === 90 || rot === 270;
  const targetW = isTransposed ? image.naturalHeight : image.naturalWidth;
  const targetH = isTransposed ? image.naturalWidth : image.naturalHeight;

  const canvas = buildCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context is unavailable.");

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  return await canvasToBlob(canvas, "image/png", 0.95);
}

// Converts a collection of images into a single PDF document
export async function imagesToPdf(
  images: ImageItem[],
  options: {
    pageSize: PageSizeName;
    customWidth: number;
    customHeight: number;
    orientation: Orientation;
    fit: FitMode;
    margin: number;
    quality?: number;
  }
): Promise<Blob> {
  const pdf = await PDFDocument.create();
  let [pageWidth, pageHeight] =
    options.pageSize === "Custom"
      ? [options.customWidth, options.customHeight]
      : pageSizes[options.pageSize];

  if (options.orientation === "landscape" && pageHeight > pageWidth) {
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }
  if (options.orientation === "portrait" && pageWidth > pageHeight) {
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }

  const quality = options.quality ?? 0.85;

  for (const item of images) {
    let embedded;
    if (quality >= 0.98) {
      const pngBlob = await getRotatedImagePng(item);
      const pngBytes = await pngBlob.arrayBuffer();
      embedded = await pdf.embedPng(pngBytes);
    } else {
      const image = await loadBitmap(item.file);
      const canvas = buildCanvas(
        item.rotation % 180 === 0 ? item.width : item.height,
        item.rotation % 180 === 0 ? item.height : item.width
      );
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
        ctx.restore();
      }
      const jpegBlob = await canvasToBlob(canvas, "image/jpeg", quality);
      const jpegBytes = await jpegBlob.arrayBuffer();
      embedded = await pdf.embedJpg(jpegBytes);
    }

    const page = pdf.addPage([pageWidth, pageHeight]);
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(1, 1, 1) });

    const imgW = embedded.width;
    const imgH = embedded.height;
    const availW = Math.max(1, pageWidth - options.margin * 2);
    const availH = Math.max(1, pageHeight - options.margin * 2);

    const scale =
      options.fit === "original"
        ? 1
        : options.fit === "fill"
        ? Math.max(availW / imgW, availH / imgH)
        : Math.min(availW / imgW, availH / imgH);

    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const x = (pageWidth - drawW) / 2;
    const y = (pageHeight - drawH) / 2;

    page.drawImage(embedded, {
      x,
      y,
      width: drawW,
      height: drawH
    });
  }

  return bytesToBlob(await pdf.save(), "application/pdf");
}

// Generates an SVG thumbnail placeholder if PDF.js fails to render
function createFallbackThumbnail(pageNum: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260">
    <rect width="200" height="260" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="25" y="30" width="150" height="14" rx="4" fill="#e2e8f0"/>
    <rect x="25" y="55" width="110" height="10" rx="3" fill="#e2e8f0"/>
    <rect x="25" y="75" width="130" height="10" rx="3" fill="#e2e8f0"/>
    <rect x="25" y="95" width="90" height="10" rx="3" fill="#e2e8f0"/>
    <rect x="50" y="140" width="100" height="50" rx="8" fill="#e0f2fe"/>
    <text x="100" y="170" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0284c7" text-anchor="middle">PAGE ${pageNum}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Reads PDF page count & generates thumbnails with graceful fallbacks
export async function readPdfInfo(file: File, maxThumbs = 8): Promise<PdfFileInfo> {
  const buffer = await file.arrayBuffer();

  // 1. Get exact page count reliably with pdf-lib (no worker required)
  let totalPages = 1;
  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    totalPages = pdfDoc.getPageCount();
  } catch (err) {
    console.warn("pdf-lib page count error:", err);
  }

  // 2. Attempt rendering thumbnails with pdfjs-dist
  const thumbnails: string[] = [];
  const limit = Math.min(totalPages, maxThumbs);
  let baseWidth = 595;
  let baseHeight = 842;

  try {
    const loadingTask = getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    totalPages = pdf.numPages || totalPages;

    try {
      const p1 = await pdf.getPage(1);
      const vp1 = p1.getViewport({ scale: 1.0 });
      baseWidth = Math.round(vp1.width);
      baseHeight = Math.round(vp1.height);
    } catch {}

    for (let i = 1; i <= limit; i++) {
      try {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = buildCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        thumbnails.push(canvas.toDataURL("image/png"));
      } catch (pageErr) {
        thumbnails.push(createFallbackThumbnail(i));
      }
    }
  } catch (pdfJsErr) {
    console.warn("PDF.js render error, using fallback thumbnails:", pdfJsErr);
    for (let i = 1; i <= limit; i++) {
      thumbnails.push(createFallbackThumbnail(i));
    }
  }

  return {
    id: uid("pdf"),
    file,
    pages: totalPages,
    thumbnails,
    baseWidth,
    baseHeight
  };
}

export function parsePageRanges(input: string, max: number): number[] {
  const pages = new Set<number>();
  input.split(",").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const [startText, endText] = trimmed.split("-");
    const start = Number(startText);
    const end = endText ? Number(endText) : start;
    if (!Number.isFinite(start) || !Number.isFinite(end)) return;
    for (let page = Math.max(1, start); page <= Math.min(max, end); page += 1) {
      pages.add(page);
    }
  });
  return Array.from(pages).sort((a, b) => a - b);
}

// Splits PDF into pages or sub-documents using pdf-lib (100% reliable)
export async function splitPdf(
  file: File,
  pages: number[],
  separate: boolean
): Promise<Array<{ name: string; blob: Blob }>> {
  const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });

  if (separate) {
    const output: Array<{ name: string; blob: Blob }> = [];
    for (const pageNumber of pages) {
      const pdf = await PDFDocument.create();
      const [page] = await pdf.copyPages(source, [pageNumber - 1]);
      pdf.addPage(page);
      output.push({
        name: `${file.name.replace(/\.pdf$/i, "")}-page-${pageNumber}.pdf`,
        blob: bytesToBlob(await pdf.save(), "application/pdf")
      });
    }
    return output;
  }

  const pdf = await PDFDocument.create();
  const copied = await pdf.copyPages(
    source,
    pages.map((p) => p - 1)
  );
  copied.forEach((page) => pdf.addPage(page));
  return [
    {
      name: `${file.name.replace(/\.pdf$/i, "")}-split.pdf`,
      blob: bytesToBlob(await pdf.save(), "application/pdf")
    }
  ];
}

// Merges multiple PDFs into one document using pdf-lib (100% client-side)
export async function mergePdfs(files: PdfFileInfo[]): Promise<Blob> {
  const merged = await PDFDocument.create();
  for (const fileInfo of files) {
    const source = await PDFDocument.load(await fileInfo.file.arrayBuffer(), {
      ignoreEncryption: true
    });
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return bytesToBlob(await merged.save(), "application/pdf");
}

export type PdfImageOutput = {
  name: string;
  blob: Blob;
  width: number;
  height: number;
  url: string;
};

export type PdfImageFormat =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/bmp"
  | "image/tiff"
  | "image/svg+xml"
  | "image/avif"
  | "image/gif";

export function getImageExtension(type: string): string {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/bmp":
      return "bmp";
    case "image/tiff":
      return "tiff";
    case "image/svg+xml":
      return "svg";
    case "image/avif":
      return "avif";
    case "image/gif":
      return "gif";
    default:
      return type.split("/")[1] || "jpg";
  }
}

export type PdfToImageOptions = {
  type: PdfImageFormat | string;
  quality: number;
  scaleMode?: "scale" | "dpi" | "width" | "height";
  scale?: number;
  dpi?: number;
  targetWidth?: number;
  targetHeight?: number;
  extension?: string;
};

// Extracts PDF pages to images with custom resolution, DPI, and width/height controls
export async function pdfPagesToImages(
  file: File,
  pages: number[],
  options: PdfToImageOptions | string,
  qualityParam = 0.92
): Promise<PdfImageOutput[]> {
  const opts: PdfToImageOptions =
    typeof options === "string"
      ? { type: options, quality: qualityParam, scale: 2.0 }
      : options;

  const buffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const output: PdfImageOutput[] = [];
  const ext = opts.extension || getImageExtension(opts.type);

  for (const pageNumber of pages) {
    const page = await pdf.getPage(pageNumber);
    const naturalViewport = page.getViewport({ scale: 1.0 });

    let renderScale = 2.0;
    if (opts.scaleMode === "dpi" && opts.dpi) {
      renderScale = opts.dpi / 72;
    } else if (opts.scaleMode === "width" && opts.targetWidth) {
      renderScale = opts.targetWidth / naturalViewport.width;
    } else if (opts.scaleMode === "height" && opts.targetHeight) {
      renderScale = opts.targetHeight / naturalViewport.height;
    } else if (opts.scale) {
      renderScale = opts.scale;
    }

    renderScale = Math.max(0.2, Math.min(renderScale, 6.0));

    const viewport = page.getViewport({ scale: renderScale });
    const canvas = buildCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available.");

    if (opts.type === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob = await canvasToBlob(canvas, opts.type, opts.quality);
    const url = URL.createObjectURL(blob);

    output.push({
      name: `${file.name.replace(/\.pdf$/i, "")}-page-${pageNumber}.${ext}`,
      blob,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      url
    });
  }
  return output;
}

// Rotates all or specific pages of a PDF document
export async function rotatePdf(
  file: File,
  rotations: Record<number, number> | number
): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(buffer);
  const count = pdfDoc.getPageCount();

  for (let i = 0; i < count; i++) {
    const pageNum = i + 1;
    const page = pdfDoc.getPage(i);
    const currentAngle = page.getRotation().angle;
    const angleDelta = typeof rotations === "number" ? rotations : rotations[pageNum] || 0;
    const newAngle = ((currentAngle + angleDelta) % 360 + 360) % 360;
    page.setRotation(degrees(newAngle));
  }

  const outputBytes = await pdfDoc.save();
  return bytesToBlob(outputBytes, "application/pdf");
}

export interface OrganizePageItem {
  id: string;
  originalPage: number;
  rotation: number;
}

// Reorders, duplicates, or removes pages according to an interactive page plan
export async function organizePdf(
  file: File,
  pagesPlan: OrganizePageItem[]
): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(buffer);
  const newDoc = await PDFDocument.create();

  const indicesToCopy = pagesPlan.map((p) => p.originalPage - 1);
  const copiedPages = await newDoc.copyPages(srcDoc, indicesToCopy);

  for (let i = 0; i < copiedPages.length; i++) {
    const page = copiedPages[i];
    const plan = pagesPlan[i];
    const currentAngle = page.getRotation().angle;
    const finalAngle = ((currentAngle + plan.rotation) % 360 + 360) % 360;
    page.setRotation(degrees(finalAngle));
    newDoc.addPage(page);
  }

  const outputBytes = await newDoc.save();
  return bytesToBlob(outputBytes, "application/pdf");
}

export interface WatermarkConfig {
  type: "text" | "image";
  text?: string;
  imageBlob?: Blob;
  fontSize?: number;
  opacity?: number;
  rotation?: number; // angle in degrees
  colorHex?: string;
  position: "center" | "tile" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  pages?: number[]; // empty = all pages
}

// Stamps text or image watermark onto PDF document pages
export async function watermarkPdf(
  file: File,
  config: WatermarkConfig
): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(buffer);
  const count = pdfDoc.getPageCount();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let embeddedLogo: any = null;
  if (config.type === "image" && config.imageBlob) {
    const imgBuffer = await config.imageBlob.arrayBuffer();
    try {
      embeddedLogo = await pdfDoc.embedPng(imgBuffer);
    } catch {
      embeddedLogo = await pdfDoc.embedJpg(imgBuffer);
    }
  }

  let r = 0.5, g = 0.5, b = 0.5;
  if (config.colorHex && config.colorHex.startsWith("#")) {
    const hex = config.colorHex.replace("#", "");
    if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16) / 255;
      g = parseInt(hex.substring(2, 4), 16) / 255;
      b = parseInt(hex.substring(4, 6), 16) / 255;
    }
  }

  const opacity = config.opacity !== undefined ? config.opacity : 0.35;
  const rotationAngle = config.rotation !== undefined ? config.rotation : 45;
  const targetPages = config.pages && config.pages.length > 0
    ? config.pages
    : Array.from({ length: count }, (_, i) => i + 1);

  for (const pageNum of targetPages) {
    if (pageNum < 1 || pageNum > count) continue;
    const page = pdfDoc.getPage(pageNum - 1);
    const { width, height } = page.getSize();

    if (config.type === "text" && config.text) {
      const fontSize = config.fontSize || Math.round(Math.min(width, height) * 0.08);
      const textWidth = font.widthOfTextAtSize(config.text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      if (config.position === "tile") {
        const stepX = Math.max(150, textWidth + 100);
        const stepY = Math.max(120, textHeight + 100);
        for (let x = -width; x < width * 2; x += stepX) {
          for (let y = -height; y < height * 2; y += stepY) {
            page.drawText(config.text, {
              x,
              y,
              size: fontSize * 0.75,
              font,
              color: rgb(r, g, b),
              opacity: opacity * 0.75,
              rotate: degrees(rotationAngle)
            });
          }
        }
      } else {
        let x = (width - textWidth) / 2;
        let y = (height - textHeight) / 2;

        if (config.position === "top-left") {
          x = 40;
          y = height - textHeight - 40;
        } else if (config.position === "top-right") {
          x = width - textWidth - 40;
          y = height - textHeight - 40;
        } else if (config.position === "bottom-left") {
          x = 40;
          y = 40;
        } else if (config.position === "bottom-right") {
          x = width - textWidth - 40;
          y = 40;
        }

        page.drawText(config.text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity,
          rotate: degrees(rotationAngle)
        });
      }
    } else if (config.type === "image" && embeddedLogo) {
      const maxW = width * 0.45;
      const scale = Math.min(maxW / embeddedLogo.width, 1);
      const imgW = embeddedLogo.width * scale;
      const imgH = embeddedLogo.height * scale;

      let x = (width - imgW) / 2;
      let y = (height - imgH) / 2;

      if (config.position === "top-left") {
        x = 40;
        y = height - imgH - 40;
      } else if (config.position === "top-right") {
        x = width - imgW - 40;
        y = height - imgH - 40;
      } else if (config.position === "bottom-left") {
        x = 40;
        y = 40;
      } else if (config.position === "bottom-right") {
        x = width - imgW - 40;
        y = 40;
      }

      page.drawImage(embeddedLogo, {
        x,
        y,
        width: imgW,
        height: imgH,
        opacity,
        rotate: degrees(rotationAngle)
      });
    }
  }

  const outputBytes = await pdfDoc.save();
  return bytesToBlob(outputBytes, "application/pdf");
}

export interface SignaturePlacement {
  id: string;
  pageNumber: number; // 1-indexed
  dataUrl: string; // PNG data URL
  // Normalized coordinates (0 to 1)
  xNorm: number;
  yNorm: number;
  widthNorm: number;
  heightNorm: number;
}

// Stamps signature onto PDF pages at coordinates
export async function signPdf(
  file: File,
  placements: SignaturePlacement[]
): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(buffer);
  const count = pdfDoc.getPageCount();

  for (const stamp of placements) {
    if (stamp.pageNumber < 1 || stamp.pageNumber > count) continue;
    const page = pdfDoc.getPage(stamp.pageNumber - 1);
    const { width, height } = page.getSize();

    const base64Clean = stamp.dataUrl.replace(/^data:image\/[^;]+;base64,/, "");
    const binary = atob(base64Clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    let embeddedImg: any;
    try {
      embeddedImg = await pdfDoc.embedPng(bytes);
    } catch {
      embeddedImg = await pdfDoc.embedJpg(bytes);
    }
    const stampWidth = stamp.widthNorm * width;
    const stampHeight = stamp.heightNorm * height;
    const x = stamp.xNorm * width;
    const y = height - (stamp.yNorm * height) - stampHeight;

    page.drawImage(embeddedImg, {
      x,
      y,
      width: stampWidth,
      height: stampHeight
    });
  }

  const outputBytes = await pdfDoc.save();
  return bytesToBlob(outputBytes, "application/pdf");
}

export async function renderPdfPageToDataUrl(
  file: File,
  pageNumber: number,
  scale = 1.5
): Promise<string> {
  const buffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = buildCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas.toDataURL("image/jpeg", 0.92);
}
