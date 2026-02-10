import { writeFile } from 'fs/promises';
import type { TTSProvider, TTSRequest } from '../tts.js';

export interface HuggingFaceTTSConfig {
  token?: string;
  primarySpace?: string;
  fallbackSpace?: string;
  timeoutMs?: number;
  clientConnector?: (space: string, options?: { token?: string }) => Promise<{ predict: Function }>;
}

export class HuggingFaceTTSProvider implements TTSProvider {
  name = 'huggingface';
  private token?: string;
  private primarySpace: string;
  private fallbackSpace: string;
  private timeoutMs: number;
  private clientConnector: (
    space: string,
    options?: { token?: string }
  ) => Promise<{ predict: Function }>;

  constructor(config: HuggingFaceTTSConfig = {}) {
    this.token = config.token;
    this.primarySpace = config.primarySpace ?? 'Qwen/Qwen3-TTS';
    this.fallbackSpace = config.fallbackSpace ?? 'ResembleAI/Chatterbox-Multilingual-TTS';
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.clientConnector = config.clientConnector ?? this.defaultConnector;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async synthesize(request: TTSRequest): Promise<void> {
    const output = await this.invokeSpace(this.primarySpace, request).catch(() =>
      this.invokeSpace(this.fallbackSpace, request)
    );

    if (!output) {
      throw new Error('HuggingFace TTS failed');
    }

    await writeFile(request.outputPath, output);
  }

  private async invokeSpace(space: string, request: TTSRequest): Promise<Buffer> {
    const client = await this.clientConnector(
      space,
      this.token ? { token: this.token } : undefined
    );

    const result = await this.withTimeout(
      client.predict('/predict', {
        text: request.text,
        voice: request.voice,
        rate: request.rate,
        pitch: request.pitch,
      }) as Promise<{ data: unknown[] }>
    );

    const data = result.data;
    if (!data || data.length === 0) {
      throw new Error('No audio data returned from HuggingFace');
    }

    const audioPayload = data.find(
      (item) => typeof item === 'string' || item instanceof Uint8Array
    );
    if (!audioPayload) {
      throw new Error('Unexpected HuggingFace TTS response');
    }

    if (typeof audioPayload === 'string') {
      return Buffer.from(audioPayload, 'base64');
    }

    return Buffer.from(audioPayload);
  }

  private async defaultConnector(
    space: string,
    options?: { token?: string }
  ): Promise<{ predict: Function }> {
    const clientModule = await import('@gradio/client');
    const clientFactory = (
      clientModule as unknown as {
        Client: {
          connect: (space: string, options?: { token?: string }) => Promise<{ predict: Function }>;
        };
      }
    ).Client;

    return clientFactory.connect(space, options);
  }

  private withTimeout<T>(promise: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('HuggingFace TTS timeout')), this.timeoutMs);
      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}
