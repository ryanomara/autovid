import sharp from 'sharp';
import { existsSync } from 'fs';
import type { PixelBuffer } from './canvas.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('image-loader');

export interface ImageLoadOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  background?: { r: number; g: number; b: number; a: number };
}

export async function loadImageToBuffer(
  src: string,
  options?: ImageLoadOptions
): Promise<PixelBuffer> {
  if (!existsSync(src)) {
    throw new Error(`Image not found: ${src}`);
  }

  try {
    let image = sharp(src);
    
    const metadata = await image.metadata();
    let finalWidth = metadata.width || 100;
    let finalHeight = metadata.height || 100;

    if (options?.width || options?.height) {
      const resizeOptions: any = {
        width: options.width,
        height: options.height,
        fit: options.fit || 'contain',
        position: options.position || 'center',
      };

      if (options.background) {
        resizeOptions.background = options.background;
      }

      image = image.resize(resizeOptions);
      finalWidth = options.width || finalWidth;
      finalHeight = options.height || finalHeight;
    }

    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    logger.debug({ 
      src, 
      width: info.width, 
      height: info.height,
      channels: info.channels 
    }, 'Loaded image');

    return {
      data: new Uint8ClampedArray(data),
      width: info.width,
      height: info.height,
    };
  } catch (error) {
    logger.error({ src, error }, 'Failed to load image');
    throw new Error(`Failed to load image ${src}: ${error}`);
  }
}

export async function loadImageFromURL(
  url: string,
  options?: ImageLoadOptions
): Promise<PixelBuffer> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let image = sharp(buffer);
    
    const metadata = await image.metadata();
    let finalWidth = metadata.width || 100;
    let finalHeight = metadata.height || 100;

    if (options?.width || options?.height) {
      const resizeOptions: any = {
        width: options.width,
        height: options.height,
        fit: options.fit || 'contain',
        position: options.position || 'center',
      };

      if (options.background) {
        resizeOptions.background = options.background;
      }

      image = image.resize(resizeOptions);
      finalWidth = options.width || finalWidth;
      finalHeight = options.height || finalHeight;
    }

    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    logger.debug({ 
      url, 
      width: info.width, 
      height: info.height,
      channels: info.channels 
    }, 'Loaded image from URL');

    return {
      data: new Uint8ClampedArray(data),
      width: info.width,
      height: info.height,
    };
  } catch (error) {
    logger.error({ url, error }, 'Failed to load image from URL');
    throw new Error(`Failed to load image from URL ${url}: ${error}`);
  }
}

export async function createThumbnail(
  src: string,
  maxWidth: number,
  maxHeight: number
): Promise<PixelBuffer> {
  return loadImageToBuffer(src, {
    width: maxWidth,
    height: maxHeight,
    fit: 'inside',
  });
}

export async function applyImageFilter(
  buffer: PixelBuffer,
  filter: 'blur' | 'sharpen' | 'grayscale' | 'sepia'
): Promise<PixelBuffer> {
  let image = sharp(Buffer.from(buffer.data), {
    raw: {
      width: buffer.width,
      height: buffer.height,
      channels: 4,
    },
  });

  switch (filter) {
    case 'blur':
      image = image.blur(5);
      break;
    case 'sharpen':
      image = image.sharpen();
      break;
    case 'grayscale':
      image = image.grayscale();
      break;
    case 'sepia':
      image = image.tint({ r: 112, g: 66, b: 20 });
      break;
  }

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
  };
}
