import type { PixelBuffer } from '../engine/canvas.js';

export type ParticlePreset = 'snow' | 'confetti' | 'fire' | 'smoke' | 'sparks';

export interface ParticleSystemConfig {
  preset: ParticlePreset;
  count: number;
}

export const generateParticles = (
  buffer: PixelBuffer,
  config: ParticleSystemConfig
): PixelBuffer => {
  const result = buffer;
  const count = Math.min(config.count, buffer.width * buffer.height);

  for (let i = 0; i < count; i++) {
    const idx = (i * 4) % result.data.length;
    result.data[idx] = 255;
    result.data[idx + 1] = 255;
    result.data[idx + 2] = 255;
    result.data[idx + 3] = 255;
  }

  return result;
};
