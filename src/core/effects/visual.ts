import sharp from 'sharp';
import type { PixelBuffer } from '../engine/canvas.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('effects');

export interface EffectOptions {
  strength?: number;
}

export interface BlurOptions extends EffectOptions {
  sigma?: number;
}

export interface GlowOptions extends EffectOptions {
  color?: { r: number; g: number; b: number };
  spread?: number;
}

export interface ShadowOptions {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: { r: number; g: number; b: number; a: number };
}

export async function applyBlur(
  buffer: PixelBuffer,
  options: BlurOptions = {}
): Promise<PixelBuffer> {
  const sigma = options.sigma || 5;

  const image = sharp(Buffer.from(buffer.data), {
    raw: {
      width: buffer.width,
      height: buffer.height,
      channels: 4,
    },
  });

  const { data, info } = await image
    .blur(sigma)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
  };
}

export async function applyGrayscale(buffer: PixelBuffer): Promise<PixelBuffer> {
  const image = sharp(Buffer.from(buffer.data), {
    raw: {
      width: buffer.width,
      height: buffer.height,
      channels: 4,
    },
  });

  const { data, info } = await image
    .grayscale()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
  };
}

export async function applySharpen(
  buffer: PixelBuffer,
  options: EffectOptions = {}
): Promise<PixelBuffer> {
  const strength = options.strength || 1;

  const image = sharp(Buffer.from(buffer.data), {
    raw: {
      width: buffer.width,
      height: buffer.height,
      channels: 4,
    },
  });

  const { data, info } = await image
    .sharpen({ sigma: strength })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
  };
}

export async function applyGlow(
  buffer: PixelBuffer,
  options: GlowOptions = {}
): Promise<PixelBuffer> {
  const spread = options.spread || 10;
  const color = options.color || { r: 255, g: 255, b: 255 };
  const strength = options.strength || 0.5;

  const image = sharp(Buffer.from(buffer.data), {
    raw: {
      width: buffer.width,
      height: buffer.height,
      channels: 4,
    },
  });

  const blurred = await image
    .blur(spread)
    .modulate({ brightness: 1 + strength })
    .ensureAlpha()
    .raw()
    .toBuffer();

  const original = Buffer.from(buffer.data);
  const result = new Uint8ClampedArray(original.length);

  for (let i = 0; i < original.length; i += 4) {
    result[i] = Math.min(255, original[i] + blurred[i] * strength);
    result[i + 1] = Math.min(255, original[i + 1] + blurred[i + 1] * strength);
    result[i + 2] = Math.min(255, original[i + 2] + blurred[i + 2] * strength);
    result[i + 3] = original[i + 3];
  }

  return {
    data: result,
    width: buffer.width,
    height: buffer.height,
  };
}

export async function applyBrightness(
  buffer: PixelBuffer,
  brightness: number
): Promise<PixelBuffer> {
  const image = sharp(Buffer.from(buffer.data), {
    raw: {
      width: buffer.width,
      height: buffer.height,
      channels: 4,
    },
  });

  const { data, info } = await image
    .modulate({ brightness })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
  };
}

export async function applyContrast(
  buffer: PixelBuffer,
  contrast: number
): Promise<PixelBuffer> {
  const image = sharp(Buffer.from(buffer.data), {
    raw: {
      width: buffer.width,
      height: buffer.height,
      channels: 4,
    },
  });

  const { data, info } = await image
    .linear(contrast, -(128 * contrast) + 128)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
  };
}

export async function applySaturation(
  buffer: PixelBuffer,
  saturation: number
): Promise<PixelBuffer> {
  const image = sharp(Buffer.from(buffer.data), {
    raw: {
      width: buffer.width,
      height: buffer.height,
      channels: 4,
    },
  });

  const { data, info } = await image
    .modulate({ saturation })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
  };
}

export async function applyTint(
  buffer: PixelBuffer,
  color: { r: number; g: number; b: number }
): Promise<PixelBuffer> {
  const image = sharp(Buffer.from(buffer.data), {
    raw: {
      width: buffer.width,
      height: buffer.height,
      channels: 4,
    },
  });

  const { data, info } = await image
    .tint(color)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
  };
}

export async function applyVignette(
  buffer: PixelBuffer,
  strength: number = 0.5
): Promise<PixelBuffer> {
  const result = new Uint8ClampedArray(buffer.data);
  const centerX = buffer.width / 2;
  const centerY = buffer.height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < buffer.height; y++) {
    for (let x = 0; x < buffer.width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const vignette = 1 - (dist / maxDist) * strength;
      
      const i = (y * buffer.width + x) * 4;
      result[i] = Math.floor(buffer.data[i] * vignette);
      result[i + 1] = Math.floor(buffer.data[i + 1] * vignette);
      result[i + 2] = Math.floor(buffer.data[i + 2] * vignette);
      result[i + 3] = buffer.data[i + 3];
    }
  }

  return {
    data: result,
    width: buffer.width,
    height: buffer.height,
  };
}

export async function applyColorMatrix(
  buffer: PixelBuffer,
  matrix: number[]
): Promise<PixelBuffer> {
  if (matrix.length !== 20) {
    throw new Error('Color matrix must have 20 elements (5x4)');
  }

  const result = new Uint8ClampedArray(buffer.data);

  for (let i = 0; i < buffer.data.length; i += 4) {
    const r = buffer.data[i];
    const g = buffer.data[i + 1];
    const b = buffer.data[i + 2];
    const a = buffer.data[i + 3];

    result[i] = Math.min(255, Math.max(0, 
      matrix[0] * r + matrix[1] * g + matrix[2] * b + matrix[3] * a + matrix[4]
    ));
    result[i + 1] = Math.min(255, Math.max(0,
      matrix[5] * r + matrix[6] * g + matrix[7] * b + matrix[8] * a + matrix[9]
    ));
    result[i + 2] = Math.min(255, Math.max(0,
      matrix[10] * r + matrix[11] * g + matrix[12] * b + matrix[13] * a + matrix[14]
    ));
    result[i + 3] = Math.min(255, Math.max(0,
      matrix[15] * r + matrix[16] * g + matrix[17] * b + matrix[18] * a + matrix[19]
    ));
  }

  return {
    data: result,
    width: buffer.width,
    height: buffer.height,
  };
}

export const presetMatrices = {
  sepia: [
    0.393, 0.769, 0.189, 0, 0,
    0.349, 0.686, 0.168, 0, 0,
    0.272, 0.534, 0.131, 0, 0,
    0, 0, 0, 1, 0
  ],
  vintage: [
    0.6, 0.3, 0.1, 0, 0,
    0.2, 0.5, 0.1, 0, 0,
    0.2, 0.3, 0.4, 0, 0,
    0, 0, 0, 1, 0
  ],
  cool: [
    1.2, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1.2, 0, 0,
    0, 0, 0, 1, 0
  ],
  warm: [
    1.2, 0, 0, 0, 0,
    0, 1.1, 0, 0, 0,
    0, 0, 0.8, 0, 0,
    0, 0, 0, 1, 0
  ],
};
