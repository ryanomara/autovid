import { describe, it, expect } from '../setup.js';
import { loadGLTF } from '../../src/core/3d/gltf-loader.js';

describe('GLTF Loader', () => {
  it('throws on missing path', async () => {
    await expect(loadGLTF('/tmp/does-not-exist.glb')).rejects.toBeDefined();
  });
});
