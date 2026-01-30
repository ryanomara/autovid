import { describe, it, expect } from '../setup.js';
import { MemoryManager } from '../../src/utils/memory.js';
import type { RenderProgress } from '../../src/types/index.js';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';

const TEST_PROJECT_ID = 'test-project-' + Date.now();
const TEST_WORK_DIR = './.autovid-test';

describe('MemoryManager', () => {
  let memory: MemoryManager;

  beforeEach(() => {
    memory = new MemoryManager({
      projectId: TEST_PROJECT_ID,
      workDir: TEST_WORK_DIR,
    });
  });

  afterEach(async () => {
    if (existsSync(TEST_WORK_DIR)) {
      await rm(TEST_WORK_DIR, { recursive: true, force: true });
    }
  });

  it('should initialize memory directory', async () => {
    await memory.init();
    expect(existsSync(memory.getMemoryDir())).toBe(true);
  });

  it('should save and load state', async () => {
    const progress: RenderProgress = {
      frame: 50,
      totalFrames: 100,
      percentage: 50,
    };

    await memory.saveProgress(progress);

    const state = await memory.loadState();
    expect(state.progress.frame).toBe(50);
    expect(state.progress.percentage).toBe(50);
  });

  it('should check if state exists', async () => {
    expect(await memory.hasState()).toBe(false);

    await memory.saveState({ renderedFrames: [1, 2, 3] });

    expect(await memory.hasState()).toBe(true);
  });

  it('should save rendered frames', async () => {
    const frames = [0, 1, 2, 3, 4];
    await memory.saveRenderedFrames(frames);

    const state = await memory.loadState();
    expect(state.renderedFrames).toEqual(frames);
  });

  it('should save asset cache', async () => {
    const cache = {
      'image1.png': '/tmp/cached/image1.png',
      'video1.mp4': '/tmp/cached/video1.mp4',
    };

    await memory.saveAssetCache(cache);

    const state = await memory.loadState();
    expect(state.assetCache).toEqual(cache);
  });

  it('should clear memory', async () => {
    await memory.saveState({ renderedFrames: [1, 2, 3] });
    expect(await memory.hasState()).toBe(true);

    await memory.clear();
    expect(await memory.hasState()).toBe(false);
  });

  it('should update existing state', async () => {
    await memory.saveRenderedFrames([1, 2, 3]);
    await memory.saveRenderedScenes(['scene-1']);

    const state = await memory.loadState();
    expect(state.renderedFrames).toEqual([1, 2, 3]);
    expect(state.renderedScenes).toEqual(['scene-1']);
  });
});
