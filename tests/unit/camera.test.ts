import { describe, it, expect } from '../setup.js';
import { getCameraStateAtTime } from '../../src/core/animation/camera.js';

describe('Camera System', () => {
  it('returns default camera when config is missing', () => {
    const state = getCameraStateAtTime(undefined, 0, 1920, 1080);
    expect(state.position).toEqual({ x: 960, y: 540 });
    expect(state.zoom).toBe(1);
    expect(state.rotation).toBe(0);
  });

  it('uses static camera config values', () => {
    const state = getCameraStateAtTime(
      { position: { x: 100, y: 200 }, zoom: 1.5, rotation: 0.25 },
      0,
      1920,
      1080
    );

    expect(state.position).toEqual({ x: 100, y: 200 });
    expect(state.zoom).toBe(1.5);
    expect(state.rotation).toBe(0.25);
  });

  it('interpolates animated zoom', () => {
    const state = getCameraStateAtTime(
      {
        zoom: 1,
        animations: {
          zoom: [
            { time: 0, value: 1 },
            { time: 1000, value: 2 },
          ],
        },
      },
      500,
      1920,
      1080
    );

    expect(state.zoom).toBeGreaterThan(1);
    expect(state.zoom).toBeLessThan(2);
  });
});
