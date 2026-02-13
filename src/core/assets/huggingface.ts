import { mkdir, writeFile } from 'fs/promises';
import { dirname, extname } from 'path';

export interface HuggingFaceAssetConfig {
  token?: string;
  imageSpaceUrl?: string;
  imageToVideoSpaceUrl?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export interface ImageGenerationRequest {
  prompt: string;
  outputPath: string;
  resolution?: string;
  seed?: number;
  steps?: number;
  shift?: number;
  randomSeed?: boolean;
  enhance?: boolean;
  endpointName?: string;
}

export interface ImageToVideoRequest {
  prompt: string;
  inputImage: string;
  outputPath: string;
  seed?: number;
  numFrames?: number;
  endpointName?: string;
}

export interface GeneratedAssetMetadata {
  type: 'image' | 'video';
  prompt: string;
  sourceSpace: string;
  endpoint: string;
  createdAt: string;
  localPath: string;
  seed?: number;
  resolution?: string;
  inputImage?: string;
}

export class HuggingFaceAssetService {
  private token?: string;
  private imageSpaceUrl: string;
  private imageToVideoSpaceUrl: string;
  private timeoutMs: number;
  private pollIntervalMs: number;

  constructor(config: HuggingFaceAssetConfig = {}) {
    this.token = config.token;
    this.imageSpaceUrl = config.imageSpaceUrl ?? 'https://mcp-tools-z-image-turbo.hf.space';
    this.imageToVideoSpaceUrl =
      config.imageToVideoSpaceUrl ?? 'https://alexnasa-ltx-2-turbo.hf.space';
    this.timeoutMs = config.timeoutMs ?? 60000;
    this.pollIntervalMs = config.pollIntervalMs ?? 800;
  }

  async generateImage(request: ImageGenerationRequest): Promise<GeneratedAssetMetadata> {
    const endpoint =
      request.endpointName ??
      (await this.discoverEndpoint(this.imageSpaceUrl, ['generate', 'predict', 'run']));

    const payload = {
      data: [
        request.prompt,
        request.resolution ?? '1024x1024 ( 1:1 )',
        request.seed ?? 42,
        request.steps ?? 8,
        request.shift ?? 3.0,
        request.randomSeed ?? true,
        request.enhance ?? false,
      ],
    };

    const eventId = await this.callEndpoint(this.imageSpaceUrl, endpoint, payload);
    const result = await this.pollResult(this.imageSpaceUrl, endpoint, eventId);
    const mediaUrl = this.extractMediaUrl(this.imageSpaceUrl, result.data);
    const media = await this.downloadBinary(mediaUrl);

    await this.ensureParentDir(request.outputPath);
    await writeFile(request.outputPath, media);

    const metadata: GeneratedAssetMetadata = {
      type: 'image',
      prompt: request.prompt,
      sourceSpace: this.imageSpaceUrl,
      endpoint,
      createdAt: new Date().toISOString(),
      localPath: request.outputPath,
      seed: request.seed,
      resolution: request.resolution,
    };

    await this.writeMetadata(request.outputPath, metadata);
    return metadata;
  }

  async generateVideoFromImage(request: ImageToVideoRequest): Promise<GeneratedAssetMetadata> {
    const endpoint =
      request.endpointName ??
      (await this.discoverEndpoint(this.imageToVideoSpaceUrl, ['generate', 'predict', 'run']));

    const payload = {
      data: [request.prompt, request.inputImage, request.seed ?? 42, request.numFrames ?? 120],
    };

    const eventId = await this.callEndpoint(this.imageToVideoSpaceUrl, endpoint, payload);
    const result = await this.pollResult(this.imageToVideoSpaceUrl, endpoint, eventId);
    const mediaUrl = this.extractMediaUrl(this.imageToVideoSpaceUrl, result.data);
    const media = await this.downloadBinary(mediaUrl);

    await this.ensureParentDir(request.outputPath);
    await writeFile(request.outputPath, media);

    const metadata: GeneratedAssetMetadata = {
      type: 'video',
      prompt: request.prompt,
      sourceSpace: this.imageToVideoSpaceUrl,
      endpoint,
      createdAt: new Date().toISOString(),
      localPath: request.outputPath,
      seed: request.seed,
      inputImage: request.inputImage,
    };

    await this.writeMetadata(request.outputPath, metadata);
    return metadata;
  }

  private async discoverEndpoint(spaceUrl: string, preferredNames: string[]): Promise<string> {
    const infoUrl = `${spaceUrl}/gradio_api/info`;
    const response = await this.fetchWithTimeout(infoUrl);
    if (!response.ok) {
      return 'generate';
    }

    const payload = (await response.json()) as {
      named_endpoints?: Record<string, unknown>;
    };

    const keys = Object.keys(payload.named_endpoints ?? {}).map((k) => k.replace(/^\//, ''));
    for (const name of preferredNames) {
      const found = keys.find((k) => k.toLowerCase().includes(name.toLowerCase()));
      if (found) {
        return found;
      }
    }

    return keys[0] ?? 'generate';
  }

  private async callEndpoint(
    spaceUrl: string,
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<string> {
    const url = `${spaceUrl}/gradio_api/call/${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face call failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { event_id?: string };
      if (!payload.event_id) {
        throw new Error('No event_id returned from Hugging Face space');
      }
      return payload.event_id;
    }

    const text = (await response.text()).trim();
    if (!text) {
      throw new Error('No event_id returned from Hugging Face space');
    }
    return text;
  }

  private async pollResult(
    spaceUrl: string,
    endpoint: string,
    eventId: string
  ): Promise<{ data: unknown[] }> {
    const url = `${spaceUrl}/gradio_api/call/${endpoint}/${eventId}`;
    const start = Date.now();

    while (Date.now() - start < this.timeoutMs) {
      const response = await this.fetchWithTimeout(url, {
        headers: {
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Hugging Face poll failed: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const parsed = this.parseSSE(text);
      if (parsed) {
        return parsed;
      }

      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }

    throw new Error('Hugging Face generation timed out');
  }

  private parseSSE(text: string): { data: unknown[] } | null {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('event: complete')) {
        continue;
      }

      const next = lines[i + 1];
      if (!next || !next.startsWith('data: ')) {
        continue;
      }

      const payload = JSON.parse(next.slice(6)) as unknown;
      if (Array.isArray(payload)) {
        return { data: payload };
      }

      if (typeof payload === 'object' && payload !== null) {
        const wrapped = payload as { result?: { data?: unknown[] }; data?: unknown[] };
        if (Array.isArray(wrapped.result?.data)) {
          return { data: wrapped.result.data };
        }
        if (Array.isArray(wrapped.data)) {
          return { data: wrapped.data };
        }
      }
    }

    return null;
  }

  private extractMediaUrl(spaceUrl: string, data: unknown[]): string {
    const candidate = data.find((item) => {
      if (typeof item === 'string') return true;
      if (typeof item !== 'object' || item === null) return false;
      return 'url' in item || 'path' in item;
    });

    if (!candidate) {
      throw new Error('No media URL returned from Hugging Face space');
    }

    let url: string | undefined;
    if (typeof candidate === 'string') {
      url = candidate;
    } else {
      const obj = candidate as { url?: string | null; path?: string };
      url = obj.url ?? obj.path;
    }

    if (!url) {
      throw new Error('No media URL returned from Hugging Face space');
    }

    if (url.startsWith('/tmp/')) {
      return `${spaceUrl}/gradio_api/file=${url}`;
    }
    if (url.startsWith('/')) {
      return `${spaceUrl}${url}`;
    }

    return url;
  }

  private async downloadBinary(url: string): Promise<Buffer> {
    const response = await this.fetchWithTimeout(url, {
      headers: {
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.status} ${response.statusText}`);
    }

    const data = await response.arrayBuffer();
    return Buffer.from(data);
  }

  private async ensureParentDir(path: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
  }

  private async writeMetadata(path: string, metadata: GeneratedAssetMetadata): Promise<void> {
    const extension = extname(path);
    const sidecar = path.slice(0, path.length - extension.length) + '.asset.json';
    await writeFile(sidecar, JSON.stringify(metadata, null, 2));
  }

  private async fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Hugging Face request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
