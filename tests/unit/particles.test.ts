import { describe, it, expect } from '../setup.js';
import { createBuffer } from '../../src/core/engine/canvas.js';
import { generateParticles } from '../../src/core/effects/particles.js';

describe('Particles', () => {
  it('generates non-empty particle alpha on buffer', () => {
    const buffer = createBuffer(64, 64);
    const result = generateParticles(buffer, {
      preset: 'confetti',
      count: 80,
      timeMs: 16,
      seed: 42,
    });

    const alphaValues = result.data.filter((_, idx) => idx % 4 === 3);
    const nonZeroAlpha = alphaValues.some((a) => a > 0);

    expect(result.data.length).toBe(buffer.data.length);
    expect(nonZeroAlpha).toBe(true);
  });

  it('is deterministic for same seed and time', () => {
    const a = generateParticles(createBuffer(64, 64), {
      preset: 'snow',
      count: 120,
      timeMs: 750,
      seed: 99,
      speed: 1.1,
    });
    const b = generateParticles(createBuffer(64, 64), {
      preset: 'snow',
      count: 120,
      timeMs: 750,
      seed: 99,
      speed: 1.1,
    });

    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });

  it('changes particle frame over time', () => {
    const early = generateParticles(createBuffer(64, 64), {
      preset: 'fire',
      count: 90,
      timeMs: 120,
      seed: 7,
      speed: 1,
    });
    const later = generateParticles(createBuffer(64, 64), {
      preset: 'fire',
      count: 90,
      timeMs: 1800,
      seed: 7,
      speed: 1,
    });

    expect(Array.from(early.data)).not.toEqual(Array.from(later.data));
  });

  it('emits particles near configured emitter source bounds', () => {
    const width = 100;
    const height = 80;
    const result = generateParticles(createBuffer(width, height), {
      preset: 'confetti',
      count: 180,
      timeMs: 180,
      seed: 123,
      speed: 1,
      wind: 0,
      emitter: { x: 8, y: 10, width: 12, height: 14 },
    });

    let weightedX = 0;
    let weightedY = 0;
    let total = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        const alpha = result.data[idx + 3];
        if (alpha <= 0) {
          continue;
        }
        weightedX += x * alpha;
        weightedY += y * alpha;
        total += alpha;
      }
    }

    const centroidX = weightedX / total;
    const centroidY = weightedY / total;

    expect(total).toBeGreaterThan(0);
    expect(centroidX).toBeLessThan(35);
    expect(centroidY).toBeLessThan(50);
  });

  it('supports strict edge-only mode when no edge points exist', () => {
    const width = 80;
    const height = 60;
    const result = generateParticles(createBuffer(width, height), {
      preset: 'confetti',
      count: 120,
      timeMs: 180,
      seed: 21,
      emitter: { x: 10, y: 10, width: 20, height: 20, edgePoints: [] },
      edgeFallbackRatio: 0,
    });

    const alphaValues = result.data.filter((_, idx) => idx % 4 === 3);
    const nonZero = alphaValues.some((a) => a > 0);
    expect(nonZero).toBe(false);
  });

  it('creates a trailing spray opposite to emitter direction', () => {
    const width = 140;
    const height = 90;
    const result = generateParticles(createBuffer(width, height), {
      preset: 'sparks',
      count: 220,
      timeMs: 500,
      seed: 17,
      edgeFallbackRatio: 0,
      emitter: {
        x: 100,
        y: 40,
        width: 1,
        height: 1,
        edgePoints: [{ x: 100, y: 40 }],
        flow: 'trail',
        directionX: 1,
        directionY: 0,
        trailLength: 50,
        trailSpread: 0,
      },
    });

    let weightedX = 0;
    let total = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        const alpha = result.data[idx + 3];
        if (alpha <= 0) {
          continue;
        }
        weightedX += x * alpha;
        total += alpha;
      }
    }

    const centroidX = weightedX / total;
    expect(total).toBeGreaterThan(0);
    expect(centroidX).toBeLessThan(100);
  });

  it('renders no particles on first frame', () => {
    const result = generateParticles(createBuffer(96, 96), {
      preset: 'sparks',
      count: 180,
      timeMs: 0,
      seed: 9,
      emitter: {
        x: 40,
        y: 40,
        width: 12,
        height: 12,
        edgePoints: [{ x: 46, y: 46 }],
      },
    });

    const alphaValues = result.data.filter((_, idx) => idx % 4 === 3);
    expect(alphaValues.some((a) => a > 0)).toBe(false);
  });
});
