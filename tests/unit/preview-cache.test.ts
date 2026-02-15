import { describe, it, expect } from '../setup.js';
import {
  computeProjectHash,
  computeSceneFingerprints,
  diffChangedScenes,
} from '../../src/cli/preview-cache.js';
import type { VideoProject } from '../../src/types/index.js';

function makeProject(): VideoProject {
  return {
    id: 'preview-project',
    name: 'Preview Project',
    config: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 4000,
      outputFormat: 'mp4',
      quality: 'high',
      backgroundColor: { r: 0, g: 0, b: 0, a: 1 },
    },
    scenes: [
      {
        id: 'scene-a',
        startTime: 0,
        endTime: 2000,
        layers: [],
      },
      {
        id: 'scene-b',
        startTime: 2000,
        endTime: 4000,
        layers: [],
      },
    ],
    audio: [],
  };
}

describe('Preview cache fingerprints', () => {
  it('produces stable project hash for same input', () => {
    const project = makeProject();
    expect(computeProjectHash(project)).toBe(computeProjectHash(project));
  });

  it('detects changed scenes by fingerprint', () => {
    const before = makeProject();
    const after = makeProject();
    after.scenes[1].endTime = 4500;

    const changed = diffChangedScenes(
      computeSceneFingerprints(before),
      computeSceneFingerprints(after)
    );
    expect(changed).toContain('scene-b');
    expect(changed).not.toContain('scene-a');
  });
});
