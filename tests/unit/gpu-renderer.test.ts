import { describe, it, expect } from '../setup.js';
import { GPURenderer } from '../../src/core/3d/gpu-renderer.js';

describe('GPU Renderer', () => {
  it('reports availability without crashing', () => {
    expect(typeof GPURenderer.isAvailable()).toBe('boolean');
  });
});
