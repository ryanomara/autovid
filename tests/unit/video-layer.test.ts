import { describe, it, expect } from '../setup.js';
import { extractVideoFrame } from '../../src/core/layers/video.js';

describe('Video Layer', () => {
  it('throws on invalid path', async () => {
    await expect(
      extractVideoFrame({
        src: '/tmp/does-not-exist.mp4',
        time: 0,
        width: 2,
        height: 2,
      })
    ).rejects.toBeDefined();
  });
});
