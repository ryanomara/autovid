import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { AudioTrack } from '../../types/index.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('tts');

export interface TTSRequest {
  text: string;
  voice: string;
  rate: number;
  pitch: number;
  outputPath: string;
}

export interface TTSProvider {
  name: string;
  synthesize(request: TTSRequest): Promise<void>;
  isAvailable(): Promise<boolean>;
}

export interface TTSConfig {
  providers: TTSProvider[];
  fallbackOrder?: string[];
}

export class PlaceholderTTSProvider implements TTSProvider {
  name = 'placeholder';

  async synthesize(request: TTSRequest): Promise<void> {
    await mkdir(join(request.outputPath, '..'), { recursive: true });
    await writeFile(request.outputPath, Buffer.from(request.text));
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

export class TTSService {
  private providers: TTSProvider[];
  private fallbackOrder?: string[];

  constructor(config: TTSConfig) {
    this.providers = config.providers;
    this.fallbackOrder = config.fallbackOrder;
  }

  async synthesize(track: AudioTrack, outputPath: string): Promise<void> {
    if (!track.tts) {
      throw new Error('TTS config missing');
    }

    const request: TTSRequest = {
      text: track.tts.text,
      voice: track.tts.voice,
      rate: track.tts.rate ?? 1.0,
      pitch: track.tts.pitch ?? 1.0,
      outputPath,
    };

    const orderedProviders = this.getOrderedProviders();

    for (const provider of orderedProviders) {
      if (!(await provider.isAvailable())) {
        continue;
      }

      try {
        await provider.synthesize(request);
        if (existsSync(outputPath)) {
          logger.info({ provider: provider.name }, 'TTS generated');
          return;
        }
      } catch (error) {
        logger.warn({ provider: provider.name, error }, 'TTS provider failed');
      }
    }

    throw new Error('All TTS providers failed');
  }

  private getOrderedProviders(): TTSProvider[] {
    if (!this.fallbackOrder || this.fallbackOrder.length === 0) {
      return this.providers;
    }

    const map = new Map(this.providers.map((provider) => [provider.name, provider]));
    const ordered: TTSProvider[] = [];

    for (const name of this.fallbackOrder) {
      const provider = map.get(name);
      if (provider) {
        ordered.push(provider);
      }
    }

    for (const provider of this.providers) {
      if (!ordered.includes(provider)) {
        ordered.push(provider);
      }
    }

    return ordered;
  }
}
