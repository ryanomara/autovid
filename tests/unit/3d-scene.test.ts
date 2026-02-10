import { describe, it, expect } from '../setup.js';
import { createThreeScene } from '../../src/core/3d/scene.js';

describe('Three.js Scene', () => {
  it('creates scene and camera', () => {
    const { scene, camera } = createThreeScene({ width: 1280, height: 720 });
    expect(scene).toBeDefined();
    expect(camera).toBeDefined();
  });
});
