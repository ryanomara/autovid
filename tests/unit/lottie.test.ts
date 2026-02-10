import { describe, it, expect } from '../setup.js';
import { loadLottie } from '../../src/core/effects/lottie.js';
import { writeFile } from 'fs/promises';

describe('Lottie', () => {
  it('loads a lottie JSON file', async () => {
    const tempPath = '/tmp/test-lottie.json';
    await writeFile(tempPath, JSON.stringify({ v: '5.0' }));
    const asset = await loadLottie(tempPath);
    expect(asset.data.v).toBe('5.0');
  });
});
