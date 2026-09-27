export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface RemoveBackgroundOptions {
  targetColor?: ColorRGB;
  tolerance: number; // 0 - 100
  contiguous: boolean; // true = flood fill from edges, false = all matching pixels
  feather: number; // 0 - 10 px
  despill: boolean;
  invert?: boolean;
}

export type BackdropType = "transparent" | "color" | "gradient";

export interface BackdropConfig {
  type: BackdropType;
  color?: string; // Hex color e.g. #ffffff
  gradient?: {
    from: string;
    to: string;
    direction?: "to-bottom" | "to-bottom-right" | "radial";
  };
}

/**
 * Calculates Euclidean color distance between two RGB colors normalized to 0 - 100.
 */
export function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  // Weighted color distance for human visual perception (Red: 0.3, Green: 0.59, Blue: 0.11)
  const dist = Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
  // Max possible distance is sqrt(2*255^2 + 4*255^2 + 3*255^2) = sqrt(9 * 65025) = 765
  return (dist / 765) * 100;
}

/**
 * Samples perimeter corners and borders of an image to detect the dominant background color.
 */
export function samplePerimeterColor(imageData: ImageData): ColorRGB {
  const { width, height, data } = imageData;
  const samples: ColorRGB[] = [];

  const addSample = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    samples.push({
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2]
    });
  };

  // Sample corner patches (5x5 grid at each corner)
  const patchSize = Math.min(10, Math.floor(Math.min(width, height) / 10));
  for (let dy = 0; dy < patchSize; dy++) {
    for (let dx = 0; dx < patchSize; dx++) {
      // Top-Left
      addSample(dx, dy);
      // Top-Right
      addSample(width - 1 - dx, dy);
      // Bottom-Left
      addSample(dx, height - 1 - dy);
      // Bottom-Right
      addSample(width - 1 - dx, height - 1 - dy);
    }
  }

  // Also sample along the top edge
  const step = Math.max(1, Math.floor(width / 20));
  for (let x = 0; x < width; x += step) {
    addSample(x, 0);
  }

  // Calculate median or trimmed average
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  for (const s of samples) {
    totalR += s.r;
    totalG += s.g;
    totalB += s.b;
  }

  const count = samples.length || 1;
  return {
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count)
  };
}

/**
 * Performs fast background removal using edge-aware flood fill, color distance,
 * smoothing, and despill.
 */
export function processBackgroundRemoval(
  sourceImageData: ImageData,
  options: RemoveBackgroundOptions
): ImageData {
  const { width, height } = sourceImageData;
  const totalPixels = width * height;
  const src = sourceImageData.data;

  // Clone output image data
  const output = new ImageData(new Uint8ClampedArray(src), width, height);
  const out = output.data;

  // Background color to match against
  const bg = options.targetColor || samplePerimeterColor(sourceImageData);
  const tolerance = Math.max(1, Math.min(100, options.tolerance));

  // Binary mask: 0 = background (transparent), 255 = foreground (subject)
  const mask = new Uint8Array(totalPixels);

  if (!options.contiguous) {
    // Mode A: Global color removal (ideal for white backgrounds, signatures, logos)
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const r = src[idx];
      const g = src[idx + 1];
      const b = src[idx + 2];
      const d = colorDistance(r, g, b, bg.r, bg.g, bg.b);

      if (d <= tolerance) {
        mask[i] = 0; // background
      } else {
        mask[i] = 255; // foreground
      }
    }
  } else {
    // Mode B: Perimeter flood-fill (ideal for portraits, exam photos, clothes)
    // Flood fill starts only from perimeter pixels so internal white/light areas are preserved
    const visited = new Uint8Array(totalPixels);
    const queue = new Int32Array(totalPixels);
    let head = 0;
    let tail = 0;

    // All pixels start as foreground
    mask.fill(255);

    // Push all perimeter border pixels matching the background color
    const checkAndPush = (x: number, y: number) => {
      const idx = y * width + x;
      if (visited[idx] === 1) return;
      visited[idx] = 1;

      const pIdx = idx * 4;
      const d = colorDistance(src[pIdx], src[pIdx + 1], src[pIdx + 2], bg.r, bg.g, bg.b);
      if (d <= tolerance) {
        queue[tail++] = idx;
        mask[idx] = 0; // background
      }
    };

    // Top and Bottom edges
    for (let x = 0; x < width; x++) {
      checkAndPush(x, 0);
      checkAndPush(x, height - 1);
    }
    // Left and Right edges
    for (let y = 0; y < height; y++) {
      checkAndPush(0, y);
      checkAndPush(width - 1, y);
    }

    // 4-way breadth-first flood fill
    while (head < tail) {
      const curr = queue[head++];
      const cx = curr % width;
      const cy = Math.floor(curr / width);

      // Check 4 neighbors
      const neighbors = [
        cx > 0 ? curr - 1 : -1,
        cx < width - 1 ? curr + 1 : -1,
        cy > 0 ? curr - width : -1,
        cy < height - 1 ? curr + width : -1
      ];

      for (let n = 0; n < 4; n++) {
        const nIdx = neighbors[n];
        if (nIdx === -1 || visited[nIdx] === 1) continue;
        visited[nIdx] = 1;

        const pIdx = nIdx * 4;
        const d = colorDistance(src[pIdx], src[pIdx + 1], src[pIdx + 2], bg.r, bg.g, bg.b);
        if (d <= tolerance) {
          mask[nIdx] = 0; // background
          queue[tail++] = nIdx;
        }
      }
    }
  }

  // Handle invert mask if requested
  if (options.invert) {
    for (let i = 0; i < totalPixels; i++) {
      mask[i] = mask[i] === 0 ? 255 : 0;
    }
  }

  // Feathering / Edge smoothing (separable 1D box blur on the mask)
  const feather = Math.max(0, Math.min(10, Math.round(options.feather)));
  let smoothedMask: Uint8Array<ArrayBufferLike> = mask;

  if (feather > 0) {
    smoothedMask = applyMaskBlur(mask, width, height, feather);
  }

  // Apply smoothed mask to output alpha and despill edges
  const despill = options.despill;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const alphaVal = smoothedMask[i];
    out[idx + 3] = alphaVal;

    // Defringe / Despill along semi-transparent boundary
    if (despill && alphaVal > 0 && alphaVal < 255) {
      // Reduce the background color contribution on fringe pixels
      const factor = alphaVal / 255;
      out[idx] = Math.min(255, Math.max(0, Math.round((src[idx] - bg.r * (1 - factor)) / Math.max(0.01, factor))));
      out[idx + 1] = Math.min(255, Math.max(0, Math.round((src[idx + 1] - bg.g * (1 - factor)) / Math.max(0.01, factor))));
      out[idx + 2] = Math.min(255, Math.max(0, Math.round((src[idx + 2] - bg.b * (1 - factor)) / Math.max(0.01, factor))));
    }
  }

  return output;
}

/**
 * Fast separable 1D box blur on an 8-bit alpha mask to soften cutout edges.
 */
function applyMaskBlur(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const total = width * height;
  const temp = new Float32Array(total);
  const result = new Uint8Array(total);

  // Horizontal blur pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    let sum = 0;
    const windowSize = radius * 2 + 1;

    for (let x = -radius; x <= radius; x++) {
      const sampleX = Math.min(Math.max(x, 0), width - 1);
      sum += mask[rowOffset + sampleX];
    }
    temp[rowOffset] = sum / windowSize;

    for (let x = 1; x < width; x++) {
      const addX = Math.min(x + radius, width - 1);
      const subX = Math.max(x - radius - 1, 0);
      sum += mask[rowOffset + addX] - mask[rowOffset + subX];
      temp[rowOffset + x] = sum / windowSize;
    }
  }

  // Vertical blur pass
  for (let x = 0; x < width; x++) {
    let sum = 0;
    const windowSize = radius * 2 + 1;

    for (let y = -radius; y <= radius; y++) {
      const sampleY = Math.min(Math.max(y, 0), height - 1);
      sum += temp[sampleY * width + x];
    }
    result[x] = Math.round(sum / windowSize);

    for (let y = 1; y < height; y++) {
      const addY = Math.min(y + radius, height - 1);
      const subY = Math.max(y - radius - 1, 0);
      sum += temp[addY * width + x] - temp[subY * width + x];
      result[y * width + x] = Math.round(sum / windowSize);
    }
  }

  return result;
}

/**
 * Paints a brush stroke onto an existing ImageData alpha channel (Erase or Restore).
 */
export function applyBrushStroke(
  targetImageData: ImageData,
  sourceOriginalData: ImageData,
  centerX: number,
  centerY: number,
  radius: number,
  mode: "erase" | "restore"
): void {
  const { width, height } = targetImageData;
  const out = targetImageData.data;
  const orig = sourceOriginalData.data;

  const minX = Math.max(0, Math.floor(centerX - radius));
  const maxX = Math.min(width - 1, Math.ceil(centerX + radius));
  const minY = Math.max(0, Math.floor(centerY - radius));
  const maxY = Math.min(height - 1, Math.ceil(centerY + radius));

  const r2 = radius * radius;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const d2 = dx * dx + dy * dy;

      if (d2 <= r2) {
        const idx = (y * width + x) * 4;
        if (mode === "erase") {
          out[idx + 3] = 0;
        } else {
          // Restore original RGB and 255 alpha
          out[idx] = orig[idx];
          out[idx + 1] = orig[idx + 1];
          out[idx + 2] = orig[idx + 2];
          out[idx + 3] = 255;
        }
      }
    }
  }
}

/**
 * Renders the cutout over a selected background into a canvas and exports as Blob.
 */
export function renderCompositeToCanvas(
  cutoutImageData: ImageData,
  backdrop: BackdropConfig
): HTMLCanvasElement {
  const { width, height } = cutoutImageData;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context is unavailable.");

  // 1. Draw Background
  if (backdrop.type === "color" && backdrop.color) {
    ctx.fillStyle = backdrop.color;
    ctx.fillRect(0, 0, width, height);
  } else if (backdrop.type === "gradient" && backdrop.gradient) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, backdrop.gradient.from);
    grad.addColorStop(1, backdrop.gradient.to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
  // If transparent, we don't draw any backdrop

  // 2. Composite Foreground Cutout
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d");
  if (tempCtx) {
    tempCtx.putImageData(cutoutImageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0);
  }

  return canvas;
}
