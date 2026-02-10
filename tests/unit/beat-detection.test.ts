import { describe, it, expect } from '../setup.js';
import { detectBeats } from '../../src/core/audio/beat-detection.js';

describe('Beat Detection', () => {
  it('returns beat markers for duration', () => {
    const track: any = { id: '1' };
    const beats = detectBeats(track, 2000, { intervalMs: 500 });
    expect(beats.length).toBeGreaterThan(0);
    expect(beats[0]).toHaveProperty('time');
    expect(beats[0]).toHaveProperty('strength');
  });
});
