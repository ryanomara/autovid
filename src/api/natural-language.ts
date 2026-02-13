import type { VideoProject, Scene, TextLayer } from '../types/index.js';

export interface NaturalLanguageOptions {
  width?: number;
  height?: number;
  durationMs?: number;
  fps?: number;
}

export const parseNaturalLanguage = (
  description: string,
  options: NaturalLanguageOptions = {}
): VideoProject => {
  const width = options.width ?? 1920;
  const height = options.height ?? 1080;
  const duration = options.durationMs ?? 5000;
  const fps = options.fps ?? 30;

  const scene: Scene = {
    id: 'scene-1',
    name: 'Auto Scene',
    startTime: 0,
    endTime: duration,
    layers: [],
  };

  const textLayer: TextLayer = {
    id: 'nl-text-1',
    type: 'text',
    text: description,
    fontFamily: 'Arial',
    fontSize: 64,
    color: { r: 255, g: 255, b: 255, a: 1 },
    position: { x: width / 2, y: height / 2 },
    scale: { x: 1, y: 1 },
    rotation: 0,
    opacity: 1,
    zIndex: 900,
    overlapMode: 'avoid-text',
    startTime: 0,
    endTime: duration,
    textAlign: 'center',
  };

  scene.layers.push(textLayer);

  return {
    id: `project-${Date.now()}`,
    name: 'Natural Language Project',
    config: {
      width,
      height,
      fps,
      duration,
      outputFormat: 'mp4',
      quality: 'high',
    },
    scenes: [scene],
    audio: [],
  };
};
