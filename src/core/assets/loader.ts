import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { logger } from '../../utils/logger.js';

export interface AssetCache {
  get(key: string): Promise<Buffer | null>;
  set(key: string, data: Buffer): Promise<void>;
  has(key: string): Promise<boolean>;
}

export class SimpleAssetCache implements AssetCache {
  private cache: Map<string, Buffer> = new Map();

  async get(key: string): Promise<Buffer | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, data: Buffer): Promise<void> {
    this.cache.set(key, data);
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export class AssetLoader {
  private cache: AssetCache;

  constructor(cache?: AssetCache) {
    this.cache = cache || new SimpleAssetCache();
  }

  async loadImage(path: string): Promise<Buffer> {
    const cached = await this.cache.get(path);
    if (cached) {
      logger.debug({ path }, 'Loaded image from cache');
      return cached;
    }

    if (!existsSync(path)) {
      throw new Error(`Image not found: ${path}`);
    }

    const data = await readFile(path);
    await this.cache.set(path, data);

    logger.debug({ path, size: data.length }, 'Loaded image from disk');
    return data;
  }

  async loadVideo(path: string): Promise<Buffer> {
    const cached = await this.cache.get(path);
    if (cached) {
      logger.debug({ path }, 'Loaded video from cache');
      return cached;
    }

    if (!existsSync(path)) {
      throw new Error(`Video not found: ${path}`);
    }

    const data = await readFile(path);
    await this.cache.set(path, data);

    logger.debug({ path, size: data.length }, 'Loaded video from disk');
    return data;
  }

  async loadAudio(path: string): Promise<Buffer> {
    const cached = await this.cache.get(path);
    if (cached) {
      logger.debug({ path }, 'Loaded audio from cache');
      return cached;
    }

    if (!existsSync(path)) {
      throw new Error(`Audio not found: ${path}`);
    }

    const data = await readFile(path);
    await this.cache.set(path, data);

    logger.debug({ path, size: data.length }, 'Loaded audio from disk');
    return data;
  }

  clearCache(): void {
    if (this.cache instanceof SimpleAssetCache) {
      this.cache.clear();
      logger.info('Asset cache cleared');
    }
  }

  getCacheSize(): number {
    if (this.cache instanceof SimpleAssetCache) {
      return this.cache.size();
    }
    return 0;
  }
}
