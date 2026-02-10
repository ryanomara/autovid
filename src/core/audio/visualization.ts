import type { AudioTrack } from '../../types/index.js';

export interface WaveformPoint {
  time: number;
  amplitude: number;
}

export interface FrequencyBin {
  frequency: number;
  magnitude: number;
}

export interface VisualizationConfig {
  samples: number;
}

const defaultConfig: VisualizationConfig = {
  samples: 64,
};

export const generateWaveform = (
  audio: AudioTrack,
  durationMs: number,
  config: VisualizationConfig = defaultConfig
): WaveformPoint[] => {
  const points: WaveformPoint[] = [];
  const step = durationMs / config.samples;

  for (let i = 0; i < config.samples; i++) {
    const time = i * step;
    const amplitude = Math.abs(Math.sin((i / config.samples) * Math.PI * 2));
    points.push({ time, amplitude });
  }

  return points;
};

export const generateFrequencyBars = (
  audio: AudioTrack,
  config: VisualizationConfig = defaultConfig
): FrequencyBin[] => {
  const bins: FrequencyBin[] = [];
  const maxFrequency = 20000;
  const step = maxFrequency / config.samples;

  for (let i = 0; i < config.samples; i++) {
    const frequency = i * step;
    const magnitude = Math.abs(Math.sin((i / config.samples) * Math.PI));
    bins.push({ frequency, magnitude });
  }

  return bins;
};
