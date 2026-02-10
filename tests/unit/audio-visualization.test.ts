import { describe, it, expect } from '../setup.js';
import { generateWaveform, generateFrequencyBars } from '../../src/core/audio/visualization.js';

describe('Audio Visualization', () => {
  it('generates waveform samples', () => {
    const track: any = { id: '1' };
    const waveform = generateWaveform(track, 1000, { samples: 10 });
    expect(waveform).toHaveLength(10);
    expect(waveform[0]).toHaveProperty('time');
    expect(waveform[0]).toHaveProperty('amplitude');
  });

  it('generates frequency bins', () => {
    const track: any = { id: '1' };
    const bins = generateFrequencyBars(track, { samples: 8 });
    expect(bins).toHaveLength(8);
    expect(bins[0]).toHaveProperty('frequency');
    expect(bins[0]).toHaveProperty('magnitude');
  });
});
