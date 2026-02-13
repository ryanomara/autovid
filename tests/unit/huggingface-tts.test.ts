import { describe, it, expect } from 'vitest';
import { HuggingFaceTTSProvider } from '../../src/core/audio/providers/huggingface.js';

describe('HuggingFaceTTSProvider', () => {
  it('writes downloaded payload to output', async () => {
    const originalFetch = globalThis.fetch;
    const encoder = new TextEncoder();
    let callCount = 0;

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.endsWith('/gradio_api/call/generate_custom_voice')) {
        return new Response(JSON.stringify({ event_id: 'evt-1' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.endsWith('/gradio_api/call/generate_custom_voice/evt-1')) {
        callCount += 1;
        if (callCount === 1) {
          return new Response('event: pending\n', { status: 200 });
        }
        const payload = JSON.stringify([
          {
            path: '/tmp/gradio/audio.wav',
            url: 'https://example.com/audio.wav',
          },
        ]);
        return new Response(`event: complete\ndata: ${payload}\n`, { status: 200 });
      }

      if (url === 'https://example.com/audio.wav') {
        return new Response(encoder.encode('hello'), { status: 200 });
      }

      return new Response(null, { status: 404 });
    }) as typeof globalThis.fetch;

    const provider = new HuggingFaceTTSProvider({
      pollIntervalMs: 0,
    });

    const tempPath = '/tmp/hf-tts-base64.txt';
    await expect(
      provider.synthesize({
        text: 'hello',
        voice: 'default',
        rate: 1,
        pitch: 1,
        outputPath: tempPath,
      })
    ).resolves.toBeUndefined();

    globalThis.fetch = originalFetch;
  });

  it('throws on empty payload', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.endsWith('/gradio_api/call/generate_custom_voice')) {
        return new Response('evt-empty', { status: 200 });
      }

      if (url.endsWith('/gradio_api/call/generate_custom_voice/evt-empty')) {
        return new Response('event: complete\ndata: []\n', { status: 200 });
      }

      return new Response(null, { status: 404 });
    }) as typeof globalThis.fetch;

    const provider = new HuggingFaceTTSProvider({
      pollIntervalMs: 0,
    });

    await expect(
      provider.synthesize({
        text: 'hello',
        voice: 'default',
        rate: 1,
        pitch: 1,
        outputPath: '/tmp/hf-tts-empty.txt',
      })
    ).rejects.toThrow('No audio data returned from HuggingFace');

    globalThis.fetch = originalFetch;
  });
});
