import { describe, it, expect } from '../setup.js';
import { validateCompositionContracts } from '../../src/core/validation/composition-contracts.js';
import type { VideoProject } from '../../src/types/index.js';

function makeProject(): VideoProject {
  return {
    id: 'test-project',
    name: 'Test Project',
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
        id: 'scene-1',
        name: 'Intro',
        startTime: 0,
        endTime: 4000,
        transition: { type: 'fade', duration: 700 },
        layers: [
          {
            id: 'title-1',
            type: 'text',
            text: 'HELLO WORLD',
            fontFamily: 'Arial',
            fontSize: 72,
            color: { r: 255, g: 255, b: 255, a: 1 },
            textAlign: 'center',
            zIndex: 900,
            overlapMode: 'avoid-text',
            startTime: 0,
            endTime: 4000,
            position: { x: 960, y: 520 },
            scale: { x: 1, y: 1 },
            rotation: 0,
            opacity: 1,
          },
        ],
      },
    ],
    audio: [],
  };
}

describe('Composition contracts', () => {
  it('passes strict mode for compliant title scene', () => {
    const report = validateCompositionContracts(makeProject(), 'strict');
    expect(report.valid).toBe(true);
    expect(report.errors).toBe(0);
  });

  it('fails strict mode when title zIndex is too low', () => {
    const project = makeProject();
    const title = project.scenes[0].layers[0] as any;
    title.zIndex = 100;

    const report = validateCompositionContracts(project, 'strict');
    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.code === 'title-zindex-too-low')).toBe(true);
  });

  it('includes path and suggestion for actionable fixes', () => {
    const project = makeProject();
    const title = project.scenes[0].layers[0] as any;
    delete title.overlapMode;

    const report = validateCompositionContracts(project, 'strict');
    const issue = report.issues.find((entry) => entry.code === 'text-overlap-mode-missing');

    expect(issue).toBeDefined();
    expect(typeof issue?.path).toBe('string');
    expect(issue?.path.length).toBeGreaterThan(0);
    expect(typeof issue?.suggestion).toBe('string');
    expect(issue?.suggestion.length).toBeGreaterThan(0);
  });

  it('downgrades overlap policy missing to warning in permissive mode', () => {
    const project = makeProject();
    const title = project.scenes[0].layers[0] as any;
    delete title.overlapMode;

    const report = validateCompositionContracts(project, 'permissive');
    expect(report.valid).toBe(true);
    expect(report.warnings).toBeGreaterThan(0);
    expect(report.issues.some((issue) => issue.code === 'text-overlap-mode-missing')).toBe(true);
  });
});
