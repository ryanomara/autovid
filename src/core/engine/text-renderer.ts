/**
 * Real text rendering using node-canvas
 * Provides proper font support with TTF/OTF fonts
 */

import { createCanvas, registerFont, Canvas, CanvasRenderingContext2D } from 'canvas';
import { existsSync } from 'fs';
import type { Color } from '../../types/index.js';
import { PixelBuffer } from './canvas.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('text-renderer');

export interface TextRenderOptions {
  text: string;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  color: Color;
  maxWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  textShadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: Color;
  };
}

/**
 * Register custom fonts for use in text rendering
 */
export function registerCustomFont(path: string, family: string): void {
  if (!existsSync(path)) {
    logger.warn({ path, family }, 'Font file not found, skipping registration');
    return;
  }
  
  try {
    registerFont(path, { family });
    logger.info({ path, family }, 'Registered custom font');
  } catch (error) {
    logger.error({ path, family, error }, 'Failed to register font');
  }
}

/**
 * Convert Color object to CSS color string
 */
function colorToCSS(color: Color): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

/**
 * Measure text dimensions
 */
export function measureText(options: TextRenderOptions): { width: number; height: number } {
  const canvas = createCanvas(1, 1);
  const ctx = canvas.getContext('2d');
  
  const fontWeight = options.fontWeight || 'normal';
  const fontStyle = options.fontStyle || 'normal';
  const fontFamily = options.fontFamily || 'Arial';
  ctx.font = `${fontStyle} ${fontWeight} ${options.fontSize}px ${fontFamily}`;
  
  const lines = options.maxWidth 
    ? wrapText(ctx, options.text, options.maxWidth)
    : [options.text];
  
  let maxWidth = 0;
  for (const line of lines) {
    const metrics = ctx.measureText(line);
    maxWidth = Math.max(maxWidth, metrics.width);
  }
  
  const lineHeight = options.lineHeight || options.fontSize * 1.2;
  const height = lines.length * lineHeight;
  
  return { 
    width: Math.ceil(maxWidth), 
    height: Math.ceil(height) 
  };
}

/**
 * Wrap text to fit within maxWidth
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Render text to a PixelBuffer using node-canvas
 */
export function renderText(options: TextRenderOptions): PixelBuffer {
  // Measure text first to determine canvas size
  const dimensions = measureText(options);
  const padding = 10;
  const width = dimensions.width + padding * 2;
  const height = dimensions.height + padding * 2;
  
  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Setup font
  const fontWeight = options.fontWeight || 'normal';
  const fontStyle = options.fontStyle || 'normal';
  const fontFamily = options.fontFamily || 'Arial';
  ctx.font = `${fontStyle} ${fontWeight} ${options.fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';
  
  // Apply text shadow if specified
  if (options.textShadow) {
    ctx.shadowOffsetX = options.textShadow.offsetX;
    ctx.shadowOffsetY = options.textShadow.offsetY;
    ctx.shadowBlur = options.textShadow.blur;
    ctx.shadowColor = colorToCSS(options.textShadow.color);
  }
  
  // Setup color
  ctx.fillStyle = colorToCSS(options.color);
  
  // Handle text wrapping
  const lines = options.maxWidth 
    ? wrapText(ctx, options.text, options.maxWidth)
    : [options.text];
  
  const lineHeight = options.lineHeight || options.fontSize * 1.2;
  const textAlign = options.textAlign || 'left';
  
  // Calculate starting Y position
  let y = padding;
  
  // Render each line
  for (const line of lines) {
    let x = padding;
    
    // Handle text alignment
    if (textAlign === 'center') {
      const metrics = ctx.measureText(line);
      x = (width - metrics.width) / 2;
    } else if (textAlign === 'right') {
      const metrics = ctx.measureText(line);
      x = width - metrics.width - padding;
    }
    
    // Apply letter spacing if specified
    if (options.letterSpacing && options.letterSpacing !== 0) {
      let currentX = x;
      for (const char of line) {
        ctx.fillText(char, currentX, y);
        const charWidth = ctx.measureText(char).width;
        currentX += charWidth + options.letterSpacing;
      }
    } else {
      ctx.fillText(line, x, y);
    }
    
    y += lineHeight;
  }
  
  // Convert canvas to PixelBuffer
  const imageData = ctx.getImageData(0, 0, width, height);
  
  return {
    data: new Uint8ClampedArray(imageData.data),
    width: width,
    height: height,
  };
}

/**
 * Render multiline text with advanced options
 */
export function renderMultilineText(
  lines: string[],
  options: Omit<TextRenderOptions, 'text'>
): PixelBuffer {
  const text = lines.join('\n');
  return renderText({ ...options, text });
}
