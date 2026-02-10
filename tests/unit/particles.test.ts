import { describe, it, expect } from '../setup.js';
import { createBuffer } from '../../src/core/engine/canvas.js';
import { generateParticles } from '../../src/core/effects/particles.js';

describe('Particles', () => {
  it('generates particles on buffer', () => {
    const buffer = createBuffer(4, 4);
    const result = generateParticles(buffer, { preset: 'confetti', count: 4 });
    expect(result.data.length).toBe(buffer.data.length);
  });
});
