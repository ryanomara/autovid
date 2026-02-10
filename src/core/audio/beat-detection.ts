import type { AudioTrack } from '../../types/index.js';

export interface BeatMarker {
  time: number;
  strength: number;
}

export interface BeatDetectionConfig {
  intervalMs: number;
}

const defaultConfig: BeatDetectionConfig = {
  intervalMs: 500,
};

export const detectBeats = (
  audio: AudioTrack,
  durationMs: number,
  config: BeatDetectionConfig = defaultConfig
): BeatMarker[] => {
  const markers: BeatMarker[] = [];
  for (let time = 0; time <= durationMs; time += config.intervalMs) {
    markers.push({ time, strength: Math.abs(Math.sin((time / durationMs) * Math.PI * 2)) });
  }
  return markers;
};
