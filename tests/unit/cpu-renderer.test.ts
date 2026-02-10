import { describe, it, expect } from '../setup.js';
import { CPURenderer } from '../../src/core/3d/cpu-renderer.js';
import { createThreeScene } from '../../src/core/3d/scene.js';

describe('CPU Renderer', () => {
  it('renders a buffer with correct size', () => {
    const renderer = new CPURenderer({ width: 8, height: 8 });
    const bundle = createThreeScene({ width: 8, height: 8 });
    const output = renderer.render(bundle);
    expect(output).toHaveLength(8 * 8 * 4);
  });
});
