import { describe, it, expect } from '../setup.js';
import { easingFunctions, interpolate, interpolateColor, getAnimationValueAtTime } from '../../src/core/animation/easing.js';

describe('Easing Functions', () => {
  it('linear should return input', () => {
    expect(easingFunctions.linear(0.5)).toBe(0.5);
    expect(easingFunctions.linear(0)).toBe(0);
    expect(easingFunctions.linear(1)).toBe(1);
  });

  it('easeIn should be slower at start', () => {
    const result = easingFunctions.easeIn(0.5);
    expect(result).toBeLessThan(0.5);
    expect(result).toBeGreaterThan(0);
  });

  it('easeOut should be slower at end', () => {
    const result = easingFunctions.easeOut(0.5);
    expect(result).toBeGreaterThan(0.5);
    expect(result).toBeLessThan(1);
  });

  it('all easing functions should return 0-1 range', () => {
    const easings = Object.keys(easingFunctions);
    easings.forEach((name) => {
      const fn = easingFunctions[name as keyof typeof easingFunctions];
      expect(fn(0)).toBeCloseTo(0, 5);
      expect(fn(1)).toBeCloseTo(1, 5);
    });
  });
});

describe('Interpolation', () => {
  it('should interpolate between numbers', () => {
    expect(interpolate(0, 100, 0)).toBe(0);
    expect(interpolate(0, 100, 1)).toBe(100);
    expect(interpolate(0, 100, 0.5)).toBe(50);
  });

  it('should interpolate colors', () => {
    const from = { r: 0, g: 0, b: 0, a: 0 };
    const to = { r: 255, g: 255, b: 255, a: 1 };
    
    const result = interpolateColor(from, to, 0.5);
    expect(result.r).toBe(128);
    expect(result.g).toBe(128);
    expect(result.b).toBe(128);
    expect(result.a).toBeCloseTo(0.5, 5);
  });

  it('should apply easing to interpolation', () => {
    const linear = interpolate(0, 100, 0.5, 'linear');
    const eased = interpolate(0, 100, 0.5, 'easeOut');
    expect(eased).toBeGreaterThan(linear);
  });
});

describe('Animation Timeline', () => {
  it('should get value at time from keyframes', () => {
    const keyframes = [
      { time: 0, value: 0 },
      { time: 1000, value: 100 },
      { time: 2000, value: 50 },
    ];

    const interpolateFn = (from: number, to: number, progress: number) =>
      from + (to - from) * progress;

    expect(getAnimationValueAtTime(keyframes, 0, interpolateFn)).toBe(0);
    expect(getAnimationValueAtTime(keyframes, 500, interpolateFn)).toBe(50);
    expect(getAnimationValueAtTime(keyframes, 1000, interpolateFn)).toBe(100);
    expect(getAnimationValueAtTime(keyframes, 1500, interpolateFn)).toBe(75);
    expect(getAnimationValueAtTime(keyframes, 2000, interpolateFn)).toBe(50);
  });

  it('should handle single keyframe', () => {
    const keyframes = [{ time: 0, value: 42 }];
    const interpolateFn = (from: number, to: number, progress: number) =>
      from + (to - from) * progress;

    expect(getAnimationValueAtTime(keyframes, 0, interpolateFn)).toBe(42);
    expect(getAnimationValueAtTime(keyframes, 1000, interpolateFn)).toBe(42);
  });

  it('should clamp before first keyframe', () => {
    const keyframes = [
      { time: 1000, value: 100 },
      { time: 2000, value: 200 },
    ];
    const interpolateFn = (from: number, to: number, progress: number) =>
      from + (to - from) * progress;

    expect(getAnimationValueAtTime(keyframes, 0, interpolateFn)).toBe(100);
    expect(getAnimationValueAtTime(keyframes, 500, interpolateFn)).toBe(100);
  });

  it('should clamp after last keyframe', () => {
    const keyframes = [
      { time: 0, value: 0 },
      { time: 1000, value: 100 },
    ];
    const interpolateFn = (from: number, to: number, progress: number) =>
      from + (to - from) * progress;

    expect(getAnimationValueAtTime(keyframes, 1500, interpolateFn)).toBe(100);
    expect(getAnimationValueAtTime(keyframes, 2000, interpolateFn)).toBe(100);
  });
});
