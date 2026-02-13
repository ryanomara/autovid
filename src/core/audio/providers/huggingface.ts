import { writeFile } from 'fs/promises';
import type { TTSProvider, TTSRequest } from '../tts.js';

export interface HuggingFaceTTSConfig {
  token?: string;
  primarySpace?: string;
  fallbackSpace?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
  clientConnector?: (space: string, options?: { token?: string }) => Promise<{ predict: Function }>;
}

export class HuggingFaceTTSProvider implements TTSProvider {
  name = 'huggingface';
  private token?: string;
  private primarySpace: string;
  private fallbackSpace: string;
  private timeoutMs: number;
  private pollIntervalMs: number;
  private clientConnector: (
    space: string,
    options?: { token?: string }
  ) => Promise<{ predict: Function }>;

  constructor(config: HuggingFaceTTSConfig = {}) {
    this.token = config.token;
    this.primarySpace = config.primarySpace ?? 'Qwen/Qwen3-TTS';
    this.fallbackSpace = config.fallbackSpace ?? 'ResembleAI/Chatterbox-Multilingual-TTS';
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.pollIntervalMs = config.pollIntervalMs ?? 500;
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
    const spaceUrl = this.getSpaceUrl(space);
    const eventId = await this.callGradioEndpoint(spaceUrl, request);
    const result = await this.pollGradioResult(spaceUrl, eventId);
    const audioBuffer = await this.downloadAudio(spaceUrl, result);

    return audioBuffer;
  }

  private getSpaceUrl(space: string): string {
    if (space.includes('http')) {
      return space;
    }
    return `https://${space.replace('/', '-')}.hf.space`;
  }

  private async callGradioEndpoint(spaceUrl: string, request: TTSRequest): Promise<string> {
    const endpoint = 'generate_custom_voice';
    const callUrl = `${spaceUrl}/gradio_api/call/${endpoint}`;

    const language = 'English';
    const speaker = 'Ryan';
    const model = '1.7B';

    const payload = {
      data: [request.text, language, speaker, null, model],
    };

    const response = await this.fetchWithTimeout(callUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Gradio API call failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = (await this.readJsonWithTimeout(response)) as { event_id?: string };
      if (!data.event_id) {
        throw new Error('No event_id returned from Gradio API');
      }
      return data.event_id;
    }

    const text = (await this.readTextWithTimeout(response)).trim();
    if (!text) {
      throw new Error('No event_id returned from Gradio API');
    }
    return text;
  }

  private async pollGradioResult(spaceUrl: string, eventId: string): Promise<{ data: unknown[] }> {
    const endpoint = 'generate_custom_voice';
    const pollUrl = `${spaceUrl}/gradio_api/call/${endpoint}/${eventId}`;
    const startTime = Date.now();

    while (Date.now() - startTime < this.timeoutMs) {
      const response = await this.fetchWithTimeout(pollUrl, {
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Gradio API poll failed: ${response.status} ${response.statusText}`);
      }

      const text = await this.readTextWithTimeout(response);
      const result = this.parseGradioSSEResponse(text);

      if (result) {
        return result;
      }

      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }

    throw new Error('Gradio API poll timeout');
  }

  private parseGradioSSEResponse(text: string): { data: unknown[] } | null {
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('event: complete')) {
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.startsWith('data: ')) {
          const jsonStr = nextLine.substring(6);
          const data = JSON.parse(jsonStr);

          if (Array.isArray(data)) {
            return { data };
          }
          if (data.result && data.result.data) {
            return { data: data.result.data };
          }
          return { data: data.data || [] };
        }
      }
    }

    return null;
  }

  private async downloadAudio(spaceUrl: string, result: { data: unknown[] }): Promise<Buffer> {
    const data = result.data;
    if (!data || data.length === 0) {
      throw new Error('No audio data returned from HuggingFace');
    }

    const audioPayload = data.find(
      (item) =>
        typeof item === 'string' ||
        (typeof item === 'object' && item !== null && ('url' in item || 'path' in item))
    );

    if (!audioPayload) {
      throw new Error('No audio file URL in Gradio response');
    }

    let fileUrl: string | undefined;
    if (typeof audioPayload === 'string') {
      fileUrl = audioPayload;
    } else if (typeof audioPayload === 'object' && audioPayload !== null) {
      const payload = audioPayload as { url?: string | null; path?: string };
      fileUrl = payload.url ?? payload.path;
    }

    if (!fileUrl) {
      throw new Error('No audio file URL in Gradio response');
    }

    let absoluteUrl = fileUrl;
    if (fileUrl.startsWith('/')) {
      if (fileUrl.startsWith('/tmp/')) {
        absoluteUrl = `${spaceUrl}/gradio_api/file=${fileUrl}`;
      } else {
        absoluteUrl = `${spaceUrl}${fileUrl}`;
      }
    }

    const response = await this.fetchWithTimeout(absoluteUrl);

    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await this.readArrayBufferWithTimeout(response);
    return Buffer.from(arrayBuffer);
  }

  private async defaultConnector(
    space: string,
    options?: { token?: string }
  ): Promise<{ predict: Function }> {
    const clientModule = await import('@gradio/client');
    const clientFactory = (
      clientModule as unknown as {
        client: (space: string, options?: { hf_token?: string }) => Promise<{ predict: Function }>;
      }
    ).client;

    return clientFactory(space, options?.token ? { hf_token: options.token } : undefined);
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

  private async fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('HuggingFace TTS timeout');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private async readTextWithTimeout(response: Response): Promise<string> {
    return this.withTimeout(response.text());
  }

  private async readJsonWithTimeout<T>(response: Response): Promise<T> {
    return this.withTimeout(response.json() as Promise<T>);
  }

  private async readArrayBufferWithTimeout(response: Response): Promise<ArrayBuffer> {
    return this.withTimeout(response.arrayBuffer());
  }
}
