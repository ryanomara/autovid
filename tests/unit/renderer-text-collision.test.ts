import { describe, it, expect } from '../setup.js';
import { Renderer } from '../../src/core/engine/renderer.js';

describe('Renderer text lane collision', () => {
  it('moves animated text in the same lane horizontally to avoid overlap', () => {
    const renderer = new Renderer({ outputDir: 'output' }) as any;

    const occupied = [{ x: 120, y: 200, width: 220, height: 56 }];
    const resolvedX = renderer.resolveTextLaneCollision(130, 200, 220, 56, occupied, 40, 1280);

    expect(resolvedX).toBeGreaterThanOrEqual(340);
  });

  it('maps named and numeric text lanes inside visible bounds', () => {
    const renderer = new Renderer({ outputDir: 'output' }) as any;

    const top = renderer.getTextLaneY('top', 1080, 40, 60);
    const middle = renderer.getTextLaneY('middle', 1080, 40, 60);
    const numeric = renderer.getTextLaneY(5, 1080, 40, 60);

    expect(top).toBeGreaterThan(0);
    expect(middle).toBeGreaterThan(top);
    expect(numeric).toBeGreaterThan(middle);
    expect(numeric).toBeLessThan(1080);
  });
});
