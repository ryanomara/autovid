/**
 * Video transitions library for scene transitions
 * Supports: fade, slide (4 directions), zoom (in/out), dissolve, wipe (4 directions)
 */

import type { PixelBuffer } from '../engine/canvas.js';
import { createBuffer, cloneBuffer } from '../engine/canvas.js';

/**
 * Easing function type
 */
type EasingFunction = (t: number) => number;

/**
 * Common easing functions
 */
const easingFunctions: Record<string, EasingFunction> = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

/**
 * Get easing function by name, fallback to linear
 */
function getEasingFunction(easing: string = 'linear'): EasingFunction {
  return easingFunctions[easing] || easingFunctions.linear;
}

/**
 * Fade transition - crossfade between two buffers
 * @param fromBuffer - Outgoing buffer
 * @param toBuffer - Incoming buffer
 * @param progress - Transition progress (0-1)
 * @param easing - Easing function name
 * @returns Composited buffer showing transition state
 */
export function transitionFade(
  fromBuffer: PixelBuffer | null,
  toBuffer: PixelBuffer | null,
  progress: number = 0,
  easing: string = 'linear'
): PixelBuffer {
  if (!fromBuffer || !toBuffer) {
    return fromBuffer || toBuffer || createBuffer(1, 1);
  }

  const easeFunc = getEasingFunction(easing);
  const easedProgress = easeFunc(Math.max(0, Math.min(1, progress)));

  // Clone the destination buffer
  const result = cloneBuffer(toBuffer);

  // Blend from source to dest
  const { data: srcData, width: srcWidth, height: srcHeight } = fromBuffer;
  const { data: destData, width: destWidth, height: destHeight } = toBuffer;
  const { data: resultData } = result;

  const width = Math.min(srcWidth, destWidth);
  const height = Math.min(srcHeight, destHeight);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Source opacity = 1 - progress
      const srcOpacity = 1 - easedProgress;

      if (srcOpacity > 0) {
        const srcR = srcData[idx];
        const srcG = srcData[idx + 1];
        const srcB = srcData[idx + 2];
        const srcA = srcData[idx + 3] / 255;

        const dstR = destData[idx];
        const dstG = destData[idx + 1];
        const dstB = destData[idx + 2];
        const dstA = destData[idx + 3] / 255;

        // Alpha blend
        const outA = srcOpacity * srcA + easedProgress * dstA;

        if (outA > 0) {
          resultData[idx] = Math.round(
            (srcR * srcOpacity * srcA + dstR * easedProgress * dstA) / outA
          );
          resultData[idx + 1] = Math.round(
            (srcG * srcOpacity * srcA + dstG * easedProgress * dstA) / outA
          );
          resultData[idx + 2] = Math.round(
            (srcB * srcOpacity * srcA + dstB * easedProgress * dstA) / outA
          );
          resultData[idx + 3] = Math.round(outA * 255);
        }
      }
    }
  }

  return result;
}

/**
 * Slide transition - slides the new scene in from a direction
 * @param fromBuffer - Outgoing buffer
 * @param toBuffer - Incoming buffer
 * @param progress - Transition progress (0-1)
 * @param direction - Direction: 'left', 'right', 'up', 'down'
 * @param easing - Easing function name
 * @returns Composited buffer showing transition state
 */
export function transitionSlide(
  fromBuffer: PixelBuffer | null,
  toBuffer: PixelBuffer | null,
  progress: number = 0,
  direction: 'left' | 'right' | 'up' | 'down' = 'left',
  easing: string = 'linear'
): PixelBuffer {
  if (!fromBuffer || !toBuffer) {
    return fromBuffer || toBuffer || createBuffer(1, 1);
  }

  const easeFunc = getEasingFunction(easing);
  const easedProgress = easeFunc(Math.max(0, Math.min(1, progress)));

  const result = cloneBuffer(fromBuffer);
  const width = result.width;
  const height = result.height;

  // Calculate offset based on direction
  let offsetX = 0;
  let offsetY = 0;

  switch (direction) {
    case 'left':
      offsetX = -Math.round(width * easedProgress);
      break;
    case 'right':
      offsetX = Math.round(width * easedProgress);
      break;
    case 'up':
      offsetY = -Math.round(height * easedProgress);
      break;
    case 'down':
      offsetY = Math.round(height * easedProgress);
      break;
  }

  // Copy 'from' buffer to result
  const { data: resultData } = result;
  const { data: fromData } = fromBuffer;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      resultData[srcIdx] = fromData[srcIdx];
      resultData[srcIdx + 1] = fromData[srcIdx + 1];
      resultData[srcIdx + 2] = fromData[srcIdx + 2];
      resultData[srcIdx + 3] = fromData[srcIdx + 3];
    }
  }

  // Blit 'to' buffer with offset
  const { data: toData } = toBuffer;
  const toWidth = toBuffer.width;
  const toHeight = toBuffer.height;

  for (let sy = 0; sy < toHeight; sy++) {
    const dy = sy + offsetY;
    if (dy < 0 || dy >= height) continue;

    for (let sx = 0; sx < toWidth; sx++) {
      const dx = sx + offsetX;
      if (dx < 0 || dx >= width) continue;

      const srcIdx = (sy * toWidth + sx) * 4;
      const destIdx = (dy * width + dx) * 4;

      const srcA = toData[srcIdx + 3] / 255;
      const dstA = resultData[destIdx + 3] / 255;

      const outA = srcA + dstA * (1 - srcA);

      if (outA > 0) {
        resultData[destIdx] = Math.round(
          (toData[srcIdx] * srcA + resultData[destIdx] * dstA * (1 - srcA)) / outA
        );
        resultData[destIdx + 1] = Math.round(
          (toData[srcIdx + 1] * srcA + resultData[destIdx + 1] * dstA * (1 - srcA)) / outA
        );
        resultData[destIdx + 2] = Math.round(
          (toData[srcIdx + 2] * srcA + resultData[destIdx + 2] * dstA * (1 - srcA)) / outA
        );
        resultData[destIdx + 3] = Math.round(outA * 255);
      }
    }
  }

  return result;
}

/**
 * Zoom transition - zooms in or out
 * @param fromBuffer - Outgoing buffer
 * @param toBuffer - Incoming buffer
 * @param progress - Transition progress (0-1)
 * @param zoomType - 'in' or 'out'
 * @param easing - Easing function name
 * @returns Composited buffer showing transition state
 */
export function transitionZoom(
  fromBuffer: PixelBuffer | null,
  toBuffer: PixelBuffer | null,
  progress: number = 0,
  zoomType: 'in' | 'out' = 'in',
  easing: string = 'linear'
): PixelBuffer {
  if (!fromBuffer || !toBuffer) {
    return fromBuffer || toBuffer || createBuffer(1, 1);
  }

  const easeFunc = getEasingFunction(easing);
  const easedProgress = easeFunc(Math.max(0, Math.min(1, progress)));

  const result = cloneBuffer(toBuffer);
  const width = result.width;
  const height = result.height;
  const centerX = width / 2;
  const centerY = height / 2;

  // Calculate zoom scale
  const zoomScale = zoomType === 'in' ? 1 + easedProgress : 1 - easedProgress * 0.5;
  const fromOpacity = 1 - easedProgress;

  // Blit and scale the 'from' buffer
  const { data: fromData } = fromBuffer;
  const fromWidth = fromBuffer.width;
  const fromHeight = fromBuffer.height;
  const { data: resultData } = result;

  // Draw scaled 'from' buffer
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Map to source coordinates with zoom
      const srcX = (x - centerX) / zoomScale + centerX;
      const srcY = (y - centerY) / zoomScale + centerY;

      if (srcX >= 0 && srcX < fromWidth && srcY >= 0 && srcY < fromHeight) {
        const sx = Math.floor(srcX);
        const sy = Math.floor(srcY);
        const srcIdx = (sy * fromWidth + sx) * 4;
        const destIdx = (y * width + x) * 4;

        const srcR = fromData[srcIdx];
        const srcG = fromData[srcIdx + 1];
        const srcB = fromData[srcIdx + 2];
        const srcA = (fromData[srcIdx + 3] / 255) * fromOpacity;

        const dstA = resultData[destIdx + 3] / 255;
        const outA = srcA + dstA * (1 - srcA);

        if (outA > 0) {
          resultData[destIdx] = Math.round((srcR * srcA + resultData[destIdx] * dstA * (1 - srcA)) / outA);
          resultData[destIdx + 1] = Math.round(
            (srcG * srcA + resultData[destIdx + 1] * dstA * (1 - srcA)) / outA
          );
          resultData[destIdx + 2] = Math.round(
            (srcB * srcA + resultData[destIdx + 2] * dstA * (1 - srcA)) / outA
          );
          resultData[destIdx + 3] = Math.round(outA * 255);
        }
      }
    }
  }

  return result;
}

/**
 * Dissolve transition - pixelated dissolve effect
 * @param fromBuffer - Outgoing buffer
 * @param toBuffer - Incoming buffer
 * @param progress - Transition progress (0-1)
 * @param easing - Easing function name
 * @returns Composited buffer showing transition state
 */
export function transitionDissolve(
  fromBuffer: PixelBuffer | null,
  toBuffer: PixelBuffer | null,
  progress: number = 0,
  easing: string = 'linear'
): PixelBuffer {
  if (!fromBuffer || !toBuffer) {
    return fromBuffer || toBuffer || createBuffer(1, 1);
  }

  const easeFunc = getEasingFunction(easing);
  const easedProgress = easeFunc(Math.max(0, Math.min(1, progress)));

  const result = cloneBuffer(fromBuffer);
  const width = result.width;
  const height = result.height;
  const { data: resultData } = result;
  const { data: fromData } = fromBuffer;
  const { data: toData } = toBuffer;

  const fromWidth = fromBuffer.width;
  const toWidth = toBuffer.width;

  // Use a simple pseudo-random pattern based on coordinates
  const seed = 12345;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Simple pseudo-random for dissolve effect
      const rand = ((x * 73856093) ^ (y * 19349663) ^ seed) % 1000;
      const randThreshold = (rand / 1000) * easedProgress;

      if (randThreshold > easedProgress * 0.5) {
        // Show 'from' buffer
        if (x < fromWidth) {
          const srcIdx = (y * fromWidth + x) * 4;
          const destIdx = (y * width + x) * 4;
          resultData[destIdx] = fromData[srcIdx];
          resultData[destIdx + 1] = fromData[srcIdx + 1];
          resultData[destIdx + 2] = fromData[srcIdx + 2];
          resultData[destIdx + 3] = fromData[srcIdx + 3];
        }
      } else {
        // Show 'to' buffer
        if (x < toWidth) {
          const srcIdx = (y * toWidth + x) * 4;
          const destIdx = (y * width + x) * 4;
          resultData[destIdx] = toData[srcIdx];
          resultData[destIdx + 1] = toData[srcIdx + 1];
          resultData[destIdx + 2] = toData[srcIdx + 2];
          resultData[destIdx + 3] = toData[srcIdx + 3];
        }
      }
    }
  }

  return result;
}

/**
 * Wipe transition - reveals new scene with a moving line
 * @param fromBuffer - Outgoing buffer
 * @param toBuffer - Incoming buffer
 * @param progress - Transition progress (0-1)
 * @param direction - Direction: 'left', 'right', 'up', 'down'
 * @param easing - Easing function name
 * @returns Composited buffer showing transition state
 */
export function transitionWipe(
  fromBuffer: PixelBuffer | null,
  toBuffer: PixelBuffer | null,
  progress: number = 0,
  direction: 'left' | 'right' | 'up' | 'down' = 'left',
  easing: string = 'linear'
): PixelBuffer {
  if (!fromBuffer || !toBuffer) {
    return fromBuffer || toBuffer || createBuffer(1, 1);
  }

  const easeFunc = getEasingFunction(easing);
  const easedProgress = easeFunc(Math.max(0, Math.min(1, progress)));

  const result = cloneBuffer(fromBuffer);
  const width = result.width;
  const height = result.height;
  const { data: resultData } = result;
  const { data: fromData } = fromBuffer;
  const { data: toData } = toBuffer;

  const fromWidth = fromBuffer.width;
  const toWidth = toBuffer.width;

  // Calculate wipe position
  let wipeLine = 0;
  switch (direction) {
    case 'left':
      wipeLine = Math.round(width * easedProgress);
      break;
    case 'right':
      wipeLine = Math.round(width * (1 - easedProgress));
      break;
    case 'up':
      wipeLine = Math.round(height * easedProgress);
      break;
    case 'down':
      wipeLine = Math.round(height * (1 - easedProgress));
      break;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let useFrom = false;

      // Determine which buffer to use based on direction and wipe position
      switch (direction) {
        case 'left':
          useFrom = x >= wipeLine;
          break;
        case 'right':
          useFrom = x < wipeLine;
          break;
        case 'up':
          useFrom = y >= wipeLine;
          break;
        case 'down':
          useFrom = y < wipeLine;
          break;
      }

      const destIdx = (y * width + x) * 4;

      if (useFrom && x < fromWidth) {
        const srcIdx = (y * fromWidth + x) * 4;
        resultData[destIdx] = fromData[srcIdx];
        resultData[destIdx + 1] = fromData[srcIdx + 1];
        resultData[destIdx + 2] = fromData[srcIdx + 2];
        resultData[destIdx + 3] = fromData[srcIdx + 3];
      } else if (!useFrom && x < toWidth) {
        const srcIdx = (y * toWidth + x) * 4;
        resultData[destIdx] = toData[srcIdx];
        resultData[destIdx + 1] = toData[srcIdx + 1];
        resultData[destIdx + 2] = toData[srcIdx + 2];
        resultData[destIdx + 3] = toData[srcIdx + 3];
      }
    }
  }

  return result;
}

/**
 * Apply a transition between two buffers
 * @param fromBuffer - Outgoing buffer
 * @param toBuffer - Incoming buffer
 * @param transitionType - Type of transition
 * @param progress - Transition progress (0-1)
 * @param options - Additional transition options
 * @returns Composited buffer showing transition state
 */
export interface TransitionOptions {
  easing?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  zoomType?: 'in' | 'out';
}

export function applyTransition(
  fromBuffer: PixelBuffer | null,
  toBuffer: PixelBuffer | null,
  transitionType: 'fade' | 'slide' | 'zoom' | 'dissolve' | 'wipe',
  progress: number = 0,
  options: TransitionOptions = {}
): PixelBuffer {
  const { easing = 'linear', direction = 'left', zoomType = 'in' } = options;

  switch (transitionType) {
    case 'fade':
      return transitionFade(fromBuffer, toBuffer, progress, easing);
    case 'slide':
      return transitionSlide(fromBuffer, toBuffer, progress, direction, easing);
    case 'zoom':
      return transitionZoom(fromBuffer, toBuffer, progress, zoomType, easing);
    case 'dissolve':
      return transitionDissolve(fromBuffer, toBuffer, progress, easing);
    case 'wipe':
      return transitionWipe(fromBuffer, toBuffer, progress, direction, easing);
    default:
      return transitionFade(fromBuffer, toBuffer, progress, easing);
  }
}
