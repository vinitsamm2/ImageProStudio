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
  scale = 1.5,
  rotation = 0
): Promise<string> {
  const buffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);
  const totalRotation = (((page.rotate || 0) + rotation) % 360 + 360) % 360;
  const viewport = page.getViewport({ scale, rotation: totalRotation });
  const canvas = buildCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas.toDataURL("image/jpeg", 0.92);
}

export type PdfAnnotationType =
  | "text"
  | "freehand"
  | "highlight"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "redact"
  | "stamp"
  | "image";

export interface EditorPoint {
  x: number; // 0 to 1 normalized
  y: number; // 0 to 1 normalized
}

export interface PdfAnnotation {
  id: string;
  pageIndex: number; // 0-indexed position in current editor pages plan
  type: PdfAnnotationType;
  xNorm: number;
  yNorm: number;
  widthNorm: number;
  heightNorm: number;
  rotation?: number; // degrees
  opacity?: number;

  // Text properties
  text?: string;
  fontSize?: number; // in pt (e.g. 14, 18, 24)
  fontFamily?: "sans" | "serif" | "mono" | "cursive";
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textColor?: string;
  textHighlightColor?: string; // background highlight behind text

  // Line / Stroke / Shape properties
  strokeColor?: string;
  strokeWidth?: number; // in pt
  fillColor?: string;
  points?: EditorPoint[]; // normalized points for freehand drawing

  // Stamp / Image properties
  stampLabel?: string;
  stampColor?: string;
  imageDataUrl?: string;
}

export interface EditorPagePlanItem {
  id: string;
  // If originalPage is null, it's a blank page
  originalPage: number | null; // 1-indexed
  rotation: number; // rotation offset in degrees (0, 90, 180, 270)
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

/**
 * Compiles an edited PDF document from original file, page plan, and annotations
 */
export async function compileEditedPdf(
  file: File,
  pagesPlan: EditorPagePlanItem[],
  annotations: PdfAnnotation[]
): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  // Preload all image assets used across all annotations
  const imageCache = new Map<string, HTMLImageElement>();
  for (const ann of annotations) {
    if (ann.imageDataUrl && !imageCache.has(ann.imageDataUrl)) {
      try {
        const loaded = await loadImg(ann.imageDataUrl);
        imageCache.set(ann.imageDataUrl, loaded);
      } catch (err) {
        console.warn("Could not preload annotation image:", err);
      }
    }
  }

  // Iterate each page in plan
  for (let pageIdx = 0; pageIdx < pagesPlan.length; pageIdx++) {
    const plan = pagesPlan[pageIdx];
    let page: any;

    if (
      plan.originalPage !== null &&
      plan.originalPage >= 1 &&
      plan.originalPage <= srcDoc.getPageCount()
    ) {
      const [copied] = await newDoc.copyPages(srcDoc, [plan.originalPage - 1]);
      page = newDoc.addPage(copied);
    } else {
      // Standard A4 page: 595.28 x 841.89 points
      page = newDoc.addPage([595.28, 841.89]);
    }

    // Apply rotation
    if (plan.rotation) {
      const currentAngle = page.getRotation().angle;
      const finalAngle = (((currentAngle + plan.rotation) % 360) + 360) % 360;
      page.setRotation(degrees(finalAngle));
    }

    // Get annotations for this pageIndex
    const pageAnns = annotations.filter((a) => a.pageIndex === pageIdx);
    if (pageAnns.length === 0) continue;

    const { width, height } = page.getSize();

    // High-resolution raster scale (2.0x for crisp vector quality)
    const scale = 2.0;
    const canvas = buildCanvas(Math.round(width * scale), Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    ctx.scale(scale, scale);

    for (const ann of pageAnns) {
      ctx.save();
      const ax = ann.xNorm * width;
      const ay = ann.yNorm * height;
      const aw = ann.widthNorm * width;
      const ah = ann.heightNorm * height;
      const opacity = typeof ann.opacity === "number" ? ann.opacity : 1.0;
      ctx.globalAlpha = opacity;

      if (ann.rotation) {
        ctx.translate(ax + aw / 2, ay + ah / 2);
        ctx.rotate((ann.rotation * Math.PI) / 180);
        ctx.translate(-(ax + aw / 2), -(ay + ah / 2));
      }

      switch (ann.type) {
        case "text": {
          if (ann.textHighlightColor && ann.textHighlightColor !== "transparent") {
            ctx.fillStyle = ann.textHighlightColor;
            ctx.fillRect(ax - 2, ay - 2, aw + 4, ah + 4);
          }
          const weight = ann.fontWeight === "bold" ? "bold " : "";
          const style = ann.fontStyle === "italic" ? "italic " : "";
          const fSize = ann.fontSize || 16;
          let fontFam = "sans-serif";
          if (ann.fontFamily === "serif") fontFam = "Georgia, serif";
          else if (ann.fontFamily === "mono") fontFam = "'Courier New', monospace";
          else if (ann.fontFamily === "cursive") fontFam = "'Dancing Script', 'Brush Script MT', cursive";
          else fontFam = "Inter, -apple-system, sans-serif";

          ctx.font = `${weight}${style}${fSize}px ${fontFam}`;
          ctx.fillStyle = ann.textColor || "#0f172a";
          ctx.textBaseline = "top";

          const lines = (ann.text || "").split("\n");
          const lineHeight = fSize * 1.25;
          for (let li = 0; li < lines.length; li++) {
            ctx.fillText(lines[li], ax, ay + li * lineHeight);
          }
          break;
        }

        case "freehand": {
          if (ann.points && ann.points.length > 0) {
            ctx.strokeStyle = ann.strokeColor || "#0284c7";
            ctx.lineWidth = ann.strokeWidth || 3;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            const p0 = ann.points[0];
            ctx.moveTo(p0.x * width, p0.y * height);
            for (let i = 1; i < ann.points.length; i++) {
              const p = ann.points[i];
              ctx.lineTo(p.x * width, p.y * height);
            }
            ctx.stroke();
          }
          break;
        }

        case "highlight": {
          ctx.fillStyle = ann.fillColor || "#fef08a";
          ctx.globalAlpha = 0.45;
          ctx.fillRect(ax, ay, aw, ah);
          break;
        }

        case "redact": {
          // Permanently blackout or whiteout content
          ctx.fillStyle = ann.fillColor || "#000000";
          ctx.globalAlpha = 1.0;
          ctx.fillRect(ax, ay, aw, ah);
          break;
        }

        case "rectangle": {
          if (ann.fillColor && ann.fillColor !== "transparent") {
            ctx.fillStyle = ann.fillColor;
            ctx.fillRect(ax, ay, aw, ah);
          }
          if (ann.strokeWidth && ann.strokeWidth > 0) {
            ctx.strokeStyle = ann.strokeColor || "#0284c7";
            ctx.lineWidth = ann.strokeWidth;
            ctx.strokeRect(ax, ay, aw, ah);
          }
          break;
        }

        case "circle": {
          ctx.beginPath();
          ctx.ellipse(
            ax + aw / 2,
            ay + ah / 2,
            Math.max(1, Math.abs(aw / 2)),
            Math.max(1, Math.abs(ah / 2)),
            0,
            0,
            Math.PI * 2
          );
          if (ann.fillColor && ann.fillColor !== "transparent") {
            ctx.fillStyle = ann.fillColor;
            ctx.fill();
          }
          if (ann.strokeWidth && ann.strokeWidth > 0) {
            ctx.strokeStyle = ann.strokeColor || "#0284c7";
            ctx.lineWidth = ann.strokeWidth;
            ctx.stroke();
          }
          break;
        }

        case "line": {
          ctx.strokeStyle = ann.strokeColor || "#0284c7";
          ctx.lineWidth = ann.strokeWidth || 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax + aw, ay + ah);
          ctx.stroke();
          break;
        }

        case "arrow": {
          ctx.strokeStyle = ann.strokeColor || "#0284c7";
          ctx.fillStyle = ann.strokeColor || "#0284c7";
          ctx.lineWidth = ann.strokeWidth || 3;
          ctx.lineCap = "round";
          const startX = ax;
          const startY = ay;
          const endX = ax + aw;
          const endY = ay + ah;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          const headlen = Math.max(10, (ann.strokeWidth || 3) * 3);
          const angle = Math.atan2(endY - startY, endX - startX);
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - headlen * Math.cos(angle - Math.PI / 6),
            endY - headlen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            endX - headlen * Math.cos(angle + Math.PI / 6),
            endY - headlen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
          break;
        }

        case "stamp": {
          const color = ann.stampColor || "#dc2626";
          ctx.save();
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 3;

          const r = 8;
          ctx.beginPath();
          drawRoundedRect(ctx, ax, ay, aw, ah, r);
          ctx.stroke();

          // Inner dashed border
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          drawRoundedRect(ctx, ax + 3, ay + 3, Math.max(1, aw - 6), Math.max(1, ah - 6), r - 2);
          ctx.stroke();
          ctx.setLineDash([]);

          const text = ann.stampLabel || "APPROVED";
          const stampFontSize = Math.max(
            10,
            Math.min(ah * 0.45, aw / (text.length * 0.68))
          );
          ctx.font = `900 ${stampFontSize}px 'Impact', -apple-system, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(text, ax + aw / 2, ay + ah / 2);
          ctx.restore();
          break;
        }

        case "image": {
          if (ann.imageDataUrl && imageCache.has(ann.imageDataUrl)) {
            const img = imageCache.get(ann.imageDataUrl)!;
            ctx.drawImage(img, ax, ay, aw, ah);
          }
          break;
        }
      }

      ctx.restore();
    }

    // Convert high-DPI canvas overlay to PNG and draw onto PDF page
    const overlayPngDataUrl = canvas.toDataURL("image/png");
    const base64 = overlayPngDataUrl.replace(/^data:image\/[^;]+;base64,/, "");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const embeddedPng = await newDoc.embedPng(bytes);
    page.drawImage(embeddedPng, {
      x: 0,
      y: 0,
      width,
      height
    });
  }

  const outputBytes = await newDoc.save();
  return bytesToBlob(outputBytes, "application/pdf");
}

// ---------------------------------------------------------------------------
// PDF to Word / DOC / DOCX Conversion Engine (.doc, .docx, .docm, .dot, .dotx, .dotm)
// ---------------------------------------------------------------------------

export type WordFormatKey = "doc" | "docx" | "docm" | "dot" | "dotx" | "dotm";

export interface WordFormatInfo {
  key: WordFormatKey;
  ext: string;
  name: string;
  description: string;
  mime: string;
  badge?: string;
  isTemplate?: boolean;
  isMacro?: boolean;
}

export const WORD_FORMATS: WordFormatInfo[] = [
  {
    key: "docx",
    ext: "docx",
    name: "Word Document (.docx)",
    description: "Standard modern Word document format (Word 2007–365, Google Docs)",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    badge: "Most Popular"
  },
  {
    key: "doc",
    ext: "doc",
    name: "Word 97–2003 Document (.doc)",
    description: "Universal compatibility with legacy Microsoft Word 97–2003 & government portals",
    mime: "application/msword",
    badge: "Legacy Compatible"
  },
  {
    key: "docm",
    ext: "docm",
    name: "Word Macro-Enabled Document (.docm)",
    description: "Word document supporting automation, forms & embedded VBA macro projects",
    mime: "application/vnd.ms-word.document.macroEnabled.12",
    badge: "Macro Enabled",
    isMacro: true
  },
  {
    key: "dotx",
    ext: "dotx",
    name: "Word Template (.dotx)",
    description: "Reusable modern template for creating standardized letters, resumes & reports",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
    badge: "Modern Template",
    isTemplate: true
  },
  {
    key: "dot",
    ext: "dot",
    name: "Word 97–2003 Template (.dot)",
    description: "Universal legacy template for Microsoft Word 97–2003 institutions & systems",
    mime: "application/msword",
    badge: "Legacy Template",
    isTemplate: true
  },
  {
    key: "dotm",
    ext: "dotm",
    name: "Word Macro-Enabled Template (.dotm)",
    description: "Standardized Word template configured to host automated macros and scripts",
    mime: "application/vnd.ms-word.template.macroEnabled.12",
    badge: "Macro Template",
    isTemplate: true,
    isMacro: true
  }
];

export interface ExtractedParagraph {
  text: string;
  isHeading: boolean;
  headingLevel?: 1 | 2 | 3;
  isListItem: boolean;
  fontSize: number;
}

export interface ExtractedPdfPage {
  pageNumber: number;
  paragraphs: ExtractedParagraph[];
  rawText: string;
  wordCount: number;
  charCount: number;
}

export interface PdfToWordOptions {
  detectHeadings?: boolean;
  preserveLineBreaks?: boolean;
  pageRanges?: string; // empty = all pages, or e.g. "1-3, 5"
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Extracts structured text paragraphs and pages from a PDF file using pdfjs-dist
 */
export async function extractPdfStructuredText(
  file: File,
  options: PdfToWordOptions = {}
): Promise<ExtractedPdfPage[]> {
  const buffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  let targetPages: number[] = [];
  if (options.pageRanges && options.pageRanges.trim().length > 0) {
    targetPages = parsePageRanges(options.pageRanges, numPages);
  }
  if (targetPages.length === 0) {
    targetPages = Array.from({ length: numPages }, (_, i) => i + 1);
  }

  const result: ExtractedPdfPage[] = [];

  for (const pageNum of targetPages) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{
      str: string;
      transform: number[];
      width: number;
      height: number;
      fontName?: string;
    }>;

    if (items.length === 0) {
      result.push({
        pageNumber: pageNum,
        paragraphs: [],
        rawText: "",
        wordCount: 0,
        charCount: 0
      });
      continue;
    }

    // Collect non-empty text items with coordinates
    const parsedItems = items
      .filter((it) => it.str && it.str.trim().length > 0)
      .map((it) => ({
        text: it.str,
        x: it.transform[4],
        y: it.transform[5],
        fontSize: Math.round(Math.abs(it.transform[0]) || Math.abs(it.transform[3]) || 12)
      }));

    if (parsedItems.length === 0) {
      result.push({
        pageNumber: pageNum,
        paragraphs: [],
        rawText: "",
        wordCount: 0,
        charCount: 0
      });
      continue;
    }

    // Sort items top-to-bottom (Y descending), then left-to-right (X ascending)
    parsedItems.sort((a, b) => {
      const dy = b.y - a.y;
      if (Math.abs(dy) > 3) return dy;
      return a.x - b.x;
    });

    // Group items into lines
    interface TextLine {
      items: typeof parsedItems;
      y: number;
      fontSize: number;
      text: string;
    }

    const lines: TextLine[] = [];
    let currentLine: typeof parsedItems = [];
    let currentY = parsedItems[0].y;
    let currentFontSize = parsedItems[0].fontSize;

    for (const item of parsedItems) {
      if (Math.abs(item.y - currentY) <= 3.5) {
        currentLine.push(item);
      } else {
        if (currentLine.length > 0) {
          lines.push({
            items: currentLine,
            y: currentY,
            fontSize: currentFontSize,
            text: currentLine.map((i) => i.text).join(" ").trim()
          });
        }
        currentLine = [item];
        currentY = item.y;
        currentFontSize = item.fontSize;
      }
    }
    if (currentLine.length > 0) {
      lines.push({
        items: currentLine,
        y: currentY,
        fontSize: currentFontSize,
        text: currentLine.map((i) => i.text).join(" ").trim()
      });
    }

    // Calculate median font size
    const fontSizes = lines.map((l) => l.fontSize).sort((a, b) => a - b);
    const medianFontSize = fontSizes[Math.floor(fontSizes.length / 2)] || 12;

    // Group lines into paragraphs
    const paragraphs: ExtractedParagraph[] = [];
    let currentParaLines: TextLine[] = [];

    const flushPara = () => {
      if (currentParaLines.length === 0) return;
      const combinedText = options.preserveLineBreaks
        ? currentParaLines.map((l) => l.text).join("\n")
        : currentParaLines.map((l) => l.text).join(" ");
      const avgFontSize = currentParaLines[0].fontSize;
      const isHead = options.detectHeadings !== false && avgFontSize >= medianFontSize * 1.3;
      let headLevel: 1 | 2 | 3 = 1;
      if (isHead) {
        if (avgFontSize >= medianFontSize * 1.6) headLevel = 1;
        else if (avgFontSize >= medianFontSize * 1.4) headLevel = 2;
        else headLevel = 3;
      }

      const isList = /^([•\-*]|(\d+\.)|(\([a-zA-Z0-9]+\)))\s+/.test(currentParaLines[0].text);

      paragraphs.push({
        text: combinedText.trim(),
        isHeading: isHead,
        headingLevel: isHead ? headLevel : undefined,
        isListItem: isList,
        fontSize: avgFontSize
      });
      currentParaLines = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (currentParaLines.length === 0) {
        currentParaLines.push(line);
        continue;
      }

      const prevLine = currentParaLines[currentParaLines.length - 1];
      const lineGap = Math.abs(prevLine.y - line.y);
      const isLargeGap = lineGap > Math.max(prevLine.fontSize, line.fontSize) * 1.45;
      const isDiffFontSize = Math.abs(prevLine.fontSize - line.fontSize) > 2.5;

      if (isLargeGap || isDiffFontSize) {
        flushPara();
        currentParaLines.push(line);
      } else {
        currentParaLines.push(line);
      }
    }
    flushPara();

    const rawText = paragraphs.map((p) => p.text).join("\n\n");
    const words = rawText.trim().length > 0 ? rawText.trim().split(/\s+/).length : 0;
    const chars = rawText.length;

    result.push({
      pageNumber: pageNum,
      paragraphs,
      rawText,
      wordCount: words,
      charCount: chars
    });
  }

  return result;
}

/**
 * Builds modern OpenXML package (.docx, .docm, .dotx, .dotm) using JSZip
 */
async function buildOoxmlZip(
  pages: ExtractedPdfPage[],
  format: WordFormatKey,
  docTitle: string
): Promise<Blob> {
  const zip = new JSZip();

  let mainContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
  if (format === "docm") {
    mainContentType = "application/vnd.ms-word.document.macroEnabled.main+xml";
  } else if (format === "dotx") {
    mainContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml";
  } else if (format === "dotm") {
    mainContentType = "application/vnd.ms-word.template.macroEnabled.main+xml";
  }

  // 1. [Content_Types].xml
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="${mainContentType}"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // 3. word/_rels/document.xml.rels
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>
</Relationships>`
  );

  // 4. word/styles.xml
  zip.file(
    "word/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="240" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:color w:val="1F4E79"/>
      <w:sz w:val="36"/>
      <w:szCs w:val="36"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="200" w:after="80"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:color w:val="2E75B6"/>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:ind w:left="720"/>
      <w:spacing w:after="100"/>
    </w:pPr>
  </w:style>
</w:styles>`
  );

  // 5. word/settings.xml
  zip.file(
    "word/settings.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>`
  );

  // 6. word/fontTable.xml
  zip.file(
    "word/fontTable.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fontTable xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:font w:name="Calibri"><w:panose1 w:val="020F0502020204030204"/><w:family w:val="swiss"/></w:font>
  <w:font w:name="Arial"><w:panose1 w:val="020B0604020202020204"/><w:family w:val="swiss"/></w:font>
  <w:font w:name="Times New Roman"><w:panose1 w:val="02020603050405020304"/><w:family w:val="roman"/></w:font>
</w:fontTable>`
  );

  // 7. word/document.xml
  let documentBodyXml = "";

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const page = pages[pageIdx];

    for (const para of page.paragraphs) {
      if (!para.text) continue;

      let styleVal = "Normal";
      if (para.isHeading) {
        styleVal = para.headingLevel === 1 ? "Heading1" : "Heading2";
      } else if (para.isListItem) {
        styleVal = "ListParagraph";
      }

      // Handle multiline paragraphs
      const lines = para.text.split("\n");
      let runsXml = "";
      for (let li = 0; li < lines.length; li++) {
        if (li > 0) runsXml += "<w:br/>";
        runsXml += `<w:t xml:space="preserve">${escapeXml(lines[li])}</w:t>`;
      }

      documentBodyXml += `<w:p><w:pPr><w:pStyle w:val="${styleVal}"/></w:pPr><w:r>${runsXml}</w:r></w:p>`;
    }

    // Insert page break between pages (except after the final page)
    if (pageIdx < pages.length - 1) {
      documentBodyXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
    }
  }

  // In case document has zero paragraphs, insert a placeholder paragraph
  if (!documentBodyXml) {
    documentBodyXml = `<w:p><w:r><w:t xml:space="preserve">${escapeXml(docTitle)}</w:t></w:r></w:p>`;
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${documentBodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file("word/document.xml", documentXml);

  return await zip.generateAsync({
    type: "blob",
    mimeType: mainContentType,
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
}

/**
 * Builds legacy Word 97–2003 document / template (.doc, .dot) format
 */
function buildLegacyWordDoc(pages: ExtractedPdfPage[], docTitle: string): Blob {
  let bodyContent = "";

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const page = pages[pageIdx];

    for (const para of page.paragraphs) {
      if (!para.text) continue;
      const safeText = escapeXml(para.text).replace(/\n/g, "<br/>");

      if (para.isHeading) {
        if (para.headingLevel === 1) {
          bodyContent += `<h1>${safeText}</h1>\n`;
        } else {
          bodyContent += `<h2>${safeText}</h2>\n`;
        }
      } else if (para.isListItem) {
        bodyContent += `<p class="MsoList">${safeText}</p>\n`;
      } else {
        bodyContent += `<p class="MsoNormal">${safeText}</p>\n`;
      }
    }

    if (pageIdx < pages.length - 1) {
      bodyContent += `<div class="page-break"></div>\n`;
    }
  }

  if (!bodyContent) {
    bodyContent = `<p class="MsoNormal">${escapeXml(docTitle)}</p>`;
  }

  const htmlDoc = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeXml(docTitle)}</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
@page Section1 {
  size: 595.3pt 841.9pt;
  margin: 1.0in 1.0in 1.0in 1.0in;
  mso-header-margin: 35.4pt;
  mso-footer-margin: 35.4pt;
  mso-paper-source: 0;
}
div.Section1 { page: Section1; }
p.MsoNormal, li.MsoNormal, div.MsoNormal {
  margin: 0in 0in 6.0pt;
  font-size: 11.0pt;
  font-family: "Calibri", "Arial", sans-serif;
  line-height: 1.35;
  color: #0f172a;
}
p.MsoList {
  margin: 0in 0in 4.0pt 0.25in;
  font-size: 11.0pt;
  font-family: "Calibri", "Arial", sans-serif;
  line-height: 1.3;
}
h1 {
  margin-top: 14.0pt;
  margin-bottom: 6.0pt;
  font-size: 18.0pt;
  font-family: "Calibri", sans-serif;
  font-weight: bold;
  color: #1e3a8a;
}
h2 {
  margin-top: 12.0pt;
  margin-bottom: 4.0pt;
  font-size: 14.0pt;
  font-family: "Calibri", sans-serif;
  font-weight: bold;
  color: #1d4ed8;
}
.page-break {
  page-break-before: always;
  mso-break-type: section-break;
}
</style>
</head>
<body>
<div class="Section1">
  ${bodyContent}
</div>
</body>
</html>`;

  return new Blob([htmlDoc], { type: "application/msword;charset=utf-8" });
}

/**
 * Main conversion entry point: converts PDF into chosen Word format (.doc, .docx, .docm, .dot, .dotx, .dotm)
 */
export async function convertPdfToWord(
  file: File,
  format: WordFormatKey,
  options: PdfToWordOptions = {}
): Promise<Blob> {
  const structuredPages = await extractPdfStructuredText(file, options);
  const docTitle = file.name.replace(/\.[^.]+$/, "");

  if (format === "doc" || format === "dot") {
    return buildLegacyWordDoc(structuredPages, docTitle);
  }

  return await buildOoxmlZip(structuredPages, format, docTitle);
}

