import type { Color, Layer, BaseLayer } from '../../types/index.js';
import {
  PixelBuffer,
  createBuffer,
  cloneBuffer,
  fillBuffer,
  setPixel,
  getPixel,
  blitBuffer,
  scaleBuffer,
  rotateBuffer,
  applyOpacity,
} from './canvas.js';

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay';

interface CompositeLayer {
  buffer: PixelBuffer;
  zIndex: number;
  blendMode: BlendMode;
  opacity: number;
}

function blendNormal(src: Color, dst: Color, opacity: number): Color {
  const srcA = src.a * opacity;
  const outA = srcA + dst.a * (1 - srcA);

  if (outA === 0) return { r: 0, g: 0, b: 0, a: 0 };

  return {
    r: Math.round((src.r * srcA + dst.r * dst.a * (1 - srcA)) / outA),
    g: Math.round((src.g * srcA + dst.g * dst.a * (1 - srcA)) / outA),
    b: Math.round((src.b * srcA + dst.b * dst.a * (1 - srcA)) / outA),
    a: outA,
  };
}

function blendMultiply(src: Color, dst: Color, opacity: number): Color {
  const blended: Color = {
    r: Math.round((src.r * dst.r) / 255),
    g: Math.round((src.g * dst.g) / 255),
    b: Math.round((src.b * dst.b) / 255),
    a: src.a,
  };
  return blendNormal(blended, dst, opacity);
}

function blendScreen(src: Color, dst: Color, opacity: number): Color {
  const blended: Color = {
    r: 255 - Math.round(((255 - src.r) * (255 - dst.r)) / 255),
    g: 255 - Math.round(((255 - src.g) * (255 - dst.g)) / 255),
    b: 255 - Math.round(((255 - src.b) * (255 - dst.b)) / 255),
    a: src.a,
  };
  return blendNormal(blended, dst, opacity);
}

function blendOverlay(src: Color, dst: Color, opacity: number): Color {
  const overlayChannel = (s: number, d: number): number => {
    if (d < 128) {
      return Math.round((2 * s * d) / 255);
    }
    return 255 - Math.round((2 * (255 - s) * (255 - d)) / 255);
  };

  const blended: Color = {
    r: overlayChannel(src.r, dst.r),
    g: overlayChannel(src.g, dst.g),
    b: overlayChannel(src.b, dst.b),
    a: src.a,
  };
  return blendNormal(blended, dst, opacity);
}

function getBlendFunction(
  mode: BlendMode
): (src: Color, dst: Color, opacity: number) => Color {
  switch (mode) {
    case 'multiply':
      return blendMultiply;
    case 'screen':
      return blendScreen;
    case 'overlay':
      return blendOverlay;
    default:
      return blendNormal;
  }
}

export class Compositor {
  private width: number;
  private height: number;
  private backgroundColor: Color;

  constructor(width: number, height: number, backgroundColor?: Color) {
    this.width = width;
    this.height = height;
    this.backgroundColor = backgroundColor || { r: 0, g: 0, b: 0, a: 1 };
  }

  composite(layers: CompositeLayer[]): PixelBuffer {
    const result = createBuffer(this.width, this.height);
    fillBuffer(result, this.backgroundColor);

    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      if (layer.opacity <= 0) continue;

      const blendFn = getBlendFunction(layer.blendMode);
      this.blendLayer(result, layer.buffer, blendFn, layer.opacity);
    }

    return result;
  }

  private blendLayer(
    dest: PixelBuffer,
    src: PixelBuffer,
    blendFn: (src: Color, dst: Color, opacity: number) => Color,
    opacity: number
  ): void {
    const minWidth = Math.min(dest.width, src.width);
    const minHeight = Math.min(dest.height, src.height);

    for (let y = 0; y < minHeight; y++) {
      for (let x = 0; x < minWidth; x++) {
        const srcIdx = (y * src.width + x) * 4;
        const dstIdx = (y * dest.width + x) * 4;

        const srcColor: Color = {
          r: src.data[srcIdx],
          g: src.data[srcIdx + 1],
          b: src.data[srcIdx + 2],
          a: src.data[srcIdx + 3] / 255,
        };

        if (srcColor.a === 0) continue;

        const dstColor: Color = {
          r: dest.data[dstIdx],
          g: dest.data[dstIdx + 1],
          b: dest.data[dstIdx + 2],
          a: dest.data[dstIdx + 3] / 255,
        };

        const result = blendFn(srcColor, dstColor, opacity);

        dest.data[dstIdx] = result.r;
        dest.data[dstIdx + 1] = result.g;
        dest.data[dstIdx + 2] = result.b;
        dest.data[dstIdx + 3] = Math.round(result.a * 255);
      }
    }
  }

  compositeWithPosition(
    layers: Array<CompositeLayer & { x: number; y: number }>
  ): PixelBuffer {
    const result = createBuffer(this.width, this.height);
    fillBuffer(result, this.backgroundColor);

    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      if (layer.opacity <= 0) continue;

      const blendFn = getBlendFunction(layer.blendMode);
      this.blendLayerAtPosition(
        result,
        layer.buffer,
        layer.x,
        layer.y,
        blendFn,
        layer.opacity
      );
    }

    return result;
  }

  private blendLayerAtPosition(
    dest: PixelBuffer,
    src: PixelBuffer,
    offsetX: number,
    offsetY: number,
    blendFn: (src: Color, dst: Color, opacity: number) => Color,
    opacity: number
  ): void {
    for (let sy = 0; sy < src.height; sy++) {
      const dy = offsetY + sy;
      if (dy < 0 || dy >= dest.height) continue;

      for (let sx = 0; sx < src.width; sx++) {
        const dx = offsetX + sx;
        if (dx < 0 || dx >= dest.width) continue;

        const srcIdx = (sy * src.width + sx) * 4;
        const dstIdx = (dy * dest.width + dx) * 4;

        const srcColor: Color = {
          r: src.data[srcIdx],
          g: src.data[srcIdx + 1],
          b: src.data[srcIdx + 2],
          a: src.data[srcIdx + 3] / 255,
        };

        if (srcColor.a === 0) continue;

        const dstColor: Color = {
          r: dest.data[dstIdx],
          g: dest.data[dstIdx + 1],
          b: dest.data[dstIdx + 2],
          a: dest.data[dstIdx + 3] / 255,
        };

        const result = blendFn(srcColor, dstColor, opacity);

        dest.data[dstIdx] = result.r;
        dest.data[dstIdx + 1] = result.g;
        dest.data[dstIdx + 2] = result.b;
        dest.data[dstIdx + 3] = Math.round(result.a * 255);
      }
    }
  }

  applyTransform(
    buffer: PixelBuffer,
    scale: { x: number; y: number },
    rotation: number
  ): PixelBuffer {
    let result = buffer;

    if (scale.x !== 1 || scale.y !== 1) {
      const newWidth = Math.round(buffer.width * scale.x);
      const newHeight = Math.round(buffer.height * scale.y);
      if (newWidth > 0 && newHeight > 0) {
        result = scaleBuffer(result, newWidth, newHeight);
      }
    }

    if (rotation !== 0) {
      result = rotateBuffer(result, rotation);
    }

    return result;
  }

  setBackgroundColor(color: Color): void {
    this.backgroundColor = color;
  }

  getBackgroundColor(): Color {
    return this.backgroundColor;
  }

  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}

export function createCompositeLayer(
  buffer: PixelBuffer,
  zIndex: number = 0,
  blendMode: BlendMode = 'normal',
  opacity: number = 1
): CompositeLayer {
  return { buffer, zIndex, blendMode, opacity };
}

export function createPositionedLayer(
  buffer: PixelBuffer,
  x: number,
  y: number,
  zIndex: number = 0,
  blendMode: BlendMode = 'normal',
  opacity: number = 1
): CompositeLayer & { x: number; y: number } {
  return { buffer, x, y, zIndex, blendMode, opacity };
}
