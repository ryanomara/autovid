import { describe, it, expect } from '../setup.js';
import { spring } from '../../src/core/animation/spring.js';

describe('Spring Animation', () => {
  it('returns from value at frame 0', () => {
    const value = spring({ frame: 0, fps: 30, from: 10, to: 20 });
    expect(value).toBe(10);
  });

  it('returns values within range for positive frames', () => {
    const value = spring({ frame: 15, fps: 30, from: 0, to: 1 });
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  });

  it('approaches the target as frames increase', () => {
    const start = spring({ frame: 1, fps: 30, from: 0, to: 1 });
    const mid = spring({ frame: 15, fps: 30, from: 0, to: 1 });
    const end = spring({ frame: 60, fps: 30, from: 0, to: 1 });

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(mid);
  });

  it('supports custom spring config', () => {
    const value = spring({
      frame: 10,
      fps: 30,
      config: {
        stiffness: 150,
        damping: 12,
        mass: 1.2,
        velocity: 0,
      },
    });

    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  });

  it('throws on invalid fps', () => {
    expect(() => spring({ frame: 1, fps: 0 })).toThrow('FPS must be greater than 0');
  });
});
