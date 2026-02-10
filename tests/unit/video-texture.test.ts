import { describe, it, expect } from '../setup.js';
import { createVideoTexture } from '../../src/core/3d/video-texture.js';
import { createBuffer } from '../../src/core/engine/canvas.js';

describe('Video Texture', () => {
  it('creates Three.js data texture', () => {
    const buffer = createBuffer(2, 2);
    const texture = createVideoTexture(buffer);
    expect(texture.image.width).toBe(2);
  });
});
