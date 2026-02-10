import { describe, it, expect } from '../setup.js';
import { createPath } from '../../src/core/animation/path.js';

describe('Path Animation', () => {
  it('throws when fewer than two points provided', () => {
    expect(() => createPath({ points: [{ x: 0, y: 0 }] })).toThrow(
      'Path requires at least 2 points'
    );
  });

  it('returns correct linear midpoint', () => {
    const path = createPath({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      type: 'linear',
    });

    expect(path.getPointAt(0.5)).toEqual({ x: 50, y: 50 });
  });

  it('supports closed linear paths', () => {
    const path = createPath({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      type: 'linear',
      closed: true,
    });

    const point = path.getPointAt(0.9);
    expect(point.x).toBeLessThanOrEqual(100);
    expect(point.y).toBeLessThanOrEqual(100);
  });

  it('supports bezier paths', () => {
    const path = createPath({
      points: [
        { x: 0, y: 0 },
        { x: 50, y: 100 },
        { x: 100, y: 0 },
      ],
      type: 'bezier',
    });

    const point = path.getPointAt(0.5);
    expect(point.x).toBeGreaterThan(0);
    expect(point.x).toBeLessThan(100);
    expect(point.y).toBeGreaterThan(0);
  });

  it('supports catmull-rom paths', () => {
    const path = createPath({
      points: [
        { x: 0, y: 0 },
        { x: 50, y: 100 },
        { x: 100, y: 0 },
        { x: 150, y: 100 },
      ],
      type: 'catmull-rom',
    });

    const point = path.getPointAt(0.5);
    expect(point.x).toBeGreaterThan(0);
    expect(point.x).toBeLessThan(150);
  });
});
