import { describe, it, expect } from 'vitest';
import { HuggingFaceTTSProvider } from '../../src/core/audio/providers/huggingface.js';

describe('HuggingFaceTTSProvider', () => {
  it('writes base64 payload to output', async () => {
    const provider = new HuggingFaceTTSProvider({
      clientConnector: async () => ({
        predict: async () => ({ data: ['aGVsbG8='] }),
      }),
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
  });

  it('throws on empty payload', async () => {
    const provider = new HuggingFaceTTSProvider({
      clientConnector: async () => ({
        predict: async () => ({ data: [] }),
      }),
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
  });
});
