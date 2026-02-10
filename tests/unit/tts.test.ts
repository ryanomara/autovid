import { describe, it, expect } from '../setup.js';
import { TTSService, PlaceholderTTSProvider } from '../../src/core/audio/tts.js';

describe('TTS Service', () => {
  it('throws when no tts config', async () => {
    const service = new TTSService({ providers: [new PlaceholderTTSProvider()] });
    const track: any = { id: '1' };

    await expect(service.synthesize(track, '/tmp/test.mp3')).rejects.toThrow('TTS config missing');
  });

  it('uses placeholder provider by default', async () => {
    const service = new TTSService({ providers: [new PlaceholderTTSProvider()] });
    const track = {
      id: '1',
      type: 'voice' as const,
      startTime: 0,
      endTime: 1000,
      volume: 1,
      tts: {
        text: 'Hello',
        voice: 'default',
      },
    };

    await expect(service.synthesize(track, '/tmp/test-tts.txt')).resolves.toBeUndefined();
  });
});
