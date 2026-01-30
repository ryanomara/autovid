/**
 * Pure JavaScript Canvas - Low-level drawing operations
 * No native canvas dependencies - works in Node.js
 */

import type { Color, Position, Dimensions, Rect } from '../../types/index.js';

/**
 * RGBA pixel buffer - stored as Uint8ClampedArray for performance
 * Layout: [R, G, B, A, R, G, B, A, ...] - 4 bytes per pixel
 */
export interface PixelBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Text metrics for layout calculations
 */
export interface TextMetrics {
  width: number;
  height: number;
  lineHeight: number;
}

/**
 * Font rendering options
 */
export interface FontOptions {
  family: string;
  size: number;
  weight?: string;
  style?: 'normal' | 'italic';
}

/**
 * Simple bitmap font for basic text rendering
 * In production, we'd use opentype.js or similar for proper font support
 */
const BASIC_FONT: Record<string, number[][]> = {
  // 5x7 bitmap representations - 1 = pixel on, 0 = pixel off
  A: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  B: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
  ],
  C: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  D: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
  ],
  E: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  F: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
  ],
  G: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  H: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  I: [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  J: [
    [0, 0, 1, 1, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 1, 0],
    [0, 1, 1, 0, 0],
  ],
  K: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 1, 0, 0, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  L: [
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  M: [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  N: [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  O: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  P: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
  ],
  Q: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 1, 0],
    [0, 1, 1, 0, 1],
  ],
  R: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  S: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  T: [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  U: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  V: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  W: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 0, 0, 1],
  ],
  X: [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  Y: [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  Z: [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  ' ': [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  '0': [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  '1': [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
  ],
  '2': [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 1, 1, 0],
    [0, 1, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  '3': [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  '4': [
    [0, 0, 0, 1, 0],
    [0, 0, 1, 1, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 0],
  ],
  '5': [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  '6': [
    [0, 0, 1, 1, 0],
    [0, 1, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  '7': [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  '8': [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  '9': [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 1, 1, 0, 0],
  ],
  '.': [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 1, 1, 0, 0],
  ],
  ',': [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  '!': [
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  '?': [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  '-': [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  ':': [
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
  ],
};

// Add lowercase letters by referencing uppercase
for (let i = 97; i <= 122; i++) {
  const lower = String.fromCharCode(i);
  const upper = String.fromCharCode(i - 32);
  if (BASIC_FONT[upper]) {
    BASIC_FONT[lower] = BASIC_FONT[upper];
  }
}

/**
 * Create an empty pixel buffer
 */
export function createBuffer(width: number, height: number): PixelBuffer {
  return {
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
  };
}

/**
 * Clone a pixel buffer
 */
export function cloneBuffer(buffer: PixelBuffer): PixelBuffer {
  return {
    data: new Uint8ClampedArray(buffer.data),
    width: buffer.width,
    height: buffer.height,
  };
}

/**
 * Fill buffer with a solid color
 */
export function fillBuffer(buffer: PixelBuffer, color: Color): void {
  const { data, width, height } = buffer;
  const r = Math.round(color.r);
  const g = Math.round(color.g);
  const b = Math.round(color.b);
  const a = Math.round(color.a * 255);

  for (let i = 0; i < width * height * 4; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  }
}

/**
 * Set a single pixel with alpha blending
 */
export function setPixel(
  buffer: PixelBuffer,
  x: number,
  y: number,
  color: Color,
  opacity: number = 1
): void {
  const { data, width, height } = buffer;

  // Bounds check
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || px >= width || py < 0 || py >= height) return;

  const idx = (py * width + px) * 4;
  const srcAlpha = color.a * opacity;

  if (srcAlpha >= 1) {
    // Opaque - direct write
    data[idx] = color.r;
    data[idx + 1] = color.g;
    data[idx + 2] = color.b;
    data[idx + 3] = 255;
  } else if (srcAlpha > 0) {
    // Alpha blend
    const dstAlpha = data[idx + 3] / 255;
    const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);

    if (outAlpha > 0) {
      data[idx] = Math.round((color.r * srcAlpha + data[idx] * dstAlpha * (1 - srcAlpha)) / outAlpha);
      data[idx + 1] = Math.round((color.g * srcAlpha + data[idx + 1] * dstAlpha * (1 - srcAlpha)) / outAlpha);
      data[idx + 2] = Math.round((color.b * srcAlpha + data[idx + 2] * dstAlpha * (1 - srcAlpha)) / outAlpha);
      data[idx + 3] = Math.round(outAlpha * 255);
    }
  }
}

/**
 * Get pixel color at position
 */
export function getPixel(buffer: PixelBuffer, x: number, y: number): Color {
  const { data, width, height } = buffer;
  const px = Math.round(x);
  const py = Math.round(y);

  if (px < 0 || px >= width || py < 0 || py >= height) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const idx = (py * width + px) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
    a: data[idx + 3] / 255,
  };
}

/**
 * Draw a filled rectangle
 */
export function drawRect(
  buffer: PixelBuffer,
  rect: Rect,
  color: Color,
  opacity: number = 1
): void {
  const startX = Math.max(0, Math.round(rect.x));
  const startY = Math.max(0, Math.round(rect.y));
  const endX = Math.min(buffer.width, Math.round(rect.x + rect.width));
  const endY = Math.min(buffer.height, Math.round(rect.y + rect.height));

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      setPixel(buffer, x, y, color, opacity);
    }
  }
}

/**
 * Draw a rectangle with rounded corners
 */
export function drawRoundedRect(
  buffer: PixelBuffer,
  rect: Rect,
  color: Color,
  cornerRadius: number,
  opacity: number = 1
): void {
  const r = Math.min(cornerRadius, rect.width / 2, rect.height / 2);
  const { x, y, width, height } = rect;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      let draw = true;

      // Check corners
      if (px < r && py < r) {
        // Top-left corner
        const dx = r - px;
        const dy = r - py;
        draw = dx * dx + dy * dy <= r * r;
      } else if (px >= width - r && py < r) {
        // Top-right corner
        const dx = px - (width - r - 1);
        const dy = r - py;
        draw = dx * dx + dy * dy <= r * r;
      } else if (px < r && py >= height - r) {
        // Bottom-left corner
        const dx = r - px;
        const dy = py - (height - r - 1);
        draw = dx * dx + dy * dy <= r * r;
      } else if (px >= width - r && py >= height - r) {
        // Bottom-right corner
        const dx = px - (width - r - 1);
        const dy = py - (height - r - 1);
        draw = dx * dx + dy * dy <= r * r;
      }

      if (draw) {
        setPixel(buffer, x + px, y + py, color, opacity);
      }
    }
  }
}

/**
 * Draw a filled circle
 */
export function drawCircle(
  buffer: PixelBuffer,
  center: Position,
  radius: number,
  color: Color,
  opacity: number = 1
): void {
  const { x: cx, y: cy } = center;
  const r = Math.round(radius);

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        setPixel(buffer, cx + dx, cy + dy, color, opacity);
      }
    }
  }
}

/**
 * Draw a filled ellipse
 */
export function drawEllipse(
  buffer: PixelBuffer,
  center: Position,
  radiusX: number,
  radiusY: number,
  color: Color,
  opacity: number = 1
): void {
  const { x: cx, y: cy } = center;
  const rx = Math.round(radiusX);
  const ry = Math.round(radiusY);

  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      const nx = dx / rx;
      const ny = dy / ry;
      if (nx * nx + ny * ny <= 1) {
        setPixel(buffer, cx + dx, cy + dy, color, opacity);
      }
    }
  }
}

/**
 * Draw a line using Bresenham's algorithm
 */
export function drawLine(
  buffer: PixelBuffer,
  from: Position,
  to: Position,
  color: Color,
  thickness: number = 1,
  opacity: number = 1
): void {
  let x0 = Math.round(from.x);
  let y0 = Math.round(from.y);
  const x1 = Math.round(to.x);
  const y1 = Math.round(to.y);

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  const halfThick = Math.floor(thickness / 2);

  while (true) {
    // Draw thick line by drawing a small rect/circle at each point
    if (thickness <= 1) {
      setPixel(buffer, x0, y0, color, opacity);
    } else {
      drawCircle(buffer, { x: x0, y: y0 }, halfThick, color, opacity);
    }

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/**
 * Draw a rectangle stroke (outline)
 */
export function drawRectStroke(
  buffer: PixelBuffer,
  rect: Rect,
  color: Color,
  strokeWidth: number = 1,
  opacity: number = 1
): void {
  const { x, y, width, height } = rect;

  // Top
  drawRect(buffer, { x, y, width, height: strokeWidth }, color, opacity);
  // Bottom
  drawRect(buffer, { x, y: y + height - strokeWidth, width, height: strokeWidth }, color, opacity);
  // Left
  drawRect(buffer, { x, y, width: strokeWidth, height }, color, opacity);
  // Right
  drawRect(buffer, { x: x + width - strokeWidth, y, width: strokeWidth, height }, color, opacity);
}

/**
 * Draw text using bitmap font
 */
export function drawText(
  buffer: PixelBuffer,
  text: string,
  position: Position,
  color: Color,
  fontSize: number = 16,
  opacity: number = 1
): TextMetrics {
  const scale = Math.max(1, Math.round(fontSize / 7));
  const charWidth = 5 * scale;
  const charHeight = 7 * scale;
  const spacing = scale;

  let cursorX = position.x;
  let cursorY = position.y;
  let maxWidth = 0;
  let lines = 1;

  for (const char of text) {
    if (char === '\n') {
      maxWidth = Math.max(maxWidth, cursorX - position.x);
      cursorX = position.x;
      cursorY += charHeight + spacing;
      lines++;
      continue;
    }

    const bitmap = BASIC_FONT[char] || BASIC_FONT['?'];
    if (bitmap) {
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (bitmap[row][col] === 1) {
            // Draw scaled pixel
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                setPixel(
                  buffer,
                  cursorX + col * scale + sx,
                  cursorY + row * scale + sy,
                  color,
                  opacity
                );
              }
            }
          }
        }
      }
    }

    cursorX += charWidth + spacing;
  }

  maxWidth = Math.max(maxWidth, cursorX - position.x);

  return {
    width: maxWidth,
    height: lines * (charHeight + spacing),
    lineHeight: charHeight + spacing,
  };
}

/**
 * Measure text dimensions without drawing
 */
export function measureText(text: string, fontSize: number = 16): TextMetrics {
  const scale = Math.max(1, Math.round(fontSize / 7));
  const charWidth = 5 * scale;
  const charHeight = 7 * scale;
  const spacing = scale;

  let maxWidth = 0;
  let currentWidth = 0;
  let lines = 1;

  for (const char of text) {
    if (char === '\n') {
      maxWidth = Math.max(maxWidth, currentWidth);
      currentWidth = 0;
      lines++;
    } else {
      currentWidth += charWidth + spacing;
    }
  }

  maxWidth = Math.max(maxWidth, currentWidth);

  return {
    width: maxWidth,
    height: lines * (charHeight + spacing),
    lineHeight: charHeight + spacing,
  };
}

/**
 * Copy one buffer onto another with positioning and opacity
 */
export function blitBuffer(
  dest: PixelBuffer,
  src: PixelBuffer,
  position: Position,
  opacity: number = 1
): void {
  const destX = Math.round(position.x);
  const destY = Math.round(position.y);

  for (let sy = 0; sy < src.height; sy++) {
    const dy = destY + sy;
    if (dy < 0 || dy >= dest.height) continue;

    for (let sx = 0; sx < src.width; sx++) {
      const dx = destX + sx;
      if (dx < 0 || dx >= dest.width) continue;

      const srcIdx = (sy * src.width + sx) * 4;
      const srcColor: Color = {
        r: src.data[srcIdx],
        g: src.data[srcIdx + 1],
        b: src.data[srcIdx + 2],
        a: src.data[srcIdx + 3] / 255,
      };

      setPixel(dest, dx, dy, srcColor, opacity);
    }
  }
}

/**
 * Scale a buffer to new dimensions
 */
export function scaleBuffer(
  buffer: PixelBuffer,
  newWidth: number,
  newHeight: number
): PixelBuffer {
  const result = createBuffer(newWidth, newHeight);
  const xRatio = buffer.width / newWidth;
  const yRatio = buffer.height / newHeight;

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const srcIdx = (srcY * buffer.width + srcX) * 4;
      const destIdx = (y * newWidth + x) * 4;

      result.data[destIdx] = buffer.data[srcIdx];
      result.data[destIdx + 1] = buffer.data[srcIdx + 1];
      result.data[destIdx + 2] = buffer.data[srcIdx + 2];
      result.data[destIdx + 3] = buffer.data[srcIdx + 3];
    }
  }

  return result;
}

/**
 * Rotate a buffer by given angle (in radians)
 */
export function rotateBuffer(buffer: PixelBuffer, angle: number): PixelBuffer {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Calculate new dimensions to fit rotated image
  const corners = [
    { x: 0, y: 0 },
    { x: buffer.width, y: 0 },
    { x: 0, y: buffer.height },
    { x: buffer.width, y: buffer.height },
  ];

  const centerX = buffer.width / 2;
  const centerY = buffer.height / 2;

  const rotatedCorners = corners.map((c) => ({
    x: (c.x - centerX) * cos - (c.y - centerY) * sin + centerX,
    y: (c.x - centerX) * sin + (c.y - centerY) * cos + centerY,
  }));

  const minX = Math.min(...rotatedCorners.map((c) => c.x));
  const maxX = Math.max(...rotatedCorners.map((c) => c.x));
  const minY = Math.min(...rotatedCorners.map((c) => c.y));
  const maxY = Math.max(...rotatedCorners.map((c) => c.y));

  const newWidth = Math.ceil(maxX - minX);
  const newHeight = Math.ceil(maxY - minY);

  const result = createBuffer(newWidth, newHeight);
  const newCenterX = newWidth / 2;
  const newCenterY = newHeight / 2;

  // Inverse rotation to sample from source
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const dx = x - newCenterX;
      const dy = y - newCenterY;

      // Inverse rotate
      const srcX = dx * cos + dy * sin + centerX;
      const srcY = -dx * sin + dy * cos + centerY;

      if (srcX >= 0 && srcX < buffer.width && srcY >= 0 && srcY < buffer.height) {
        const srcIdx = (Math.floor(srcY) * buffer.width + Math.floor(srcX)) * 4;
        const destIdx = (y * newWidth + x) * 4;

        result.data[destIdx] = buffer.data[srcIdx];
        result.data[destIdx + 1] = buffer.data[srcIdx + 1];
        result.data[destIdx + 2] = buffer.data[srcIdx + 2];
        result.data[destIdx + 3] = buffer.data[srcIdx + 3];
      }
    }
  }

  return result;
}

/**
 * Apply opacity to entire buffer
 */
export function applyOpacity(buffer: PixelBuffer, opacity: number): void {
  const { data, width, height } = buffer;
  for (let i = 3; i < width * height * 4; i += 4) {
    data[i] = Math.round(data[i] * opacity);
  }
}

/**
 * Convert pixel buffer to PNG-compatible raw data
 * Returns RGB data (no alpha) in row-major order
 */
export function toRGB(buffer: PixelBuffer): Uint8Array {
  const { data, width, height } = buffer;
  const rgb = new Uint8Array(width * height * 3);

  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    rgb[j] = data[i];
    rgb[j + 1] = data[i + 1];
    rgb[j + 2] = data[i + 2];
  }

  return rgb;
}

/**
 * Convert pixel buffer to raw RGBA data
 */
export function toRGBA(buffer: PixelBuffer): Uint8Array {
  return new Uint8Array(buffer.data);
}
