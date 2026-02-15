import { createHash } from 'crypto';
import type { VideoProject } from '../types/index.js';

export interface SceneFingerprint {
  id: string;
  hash: string;
}

export interface PreviewCacheRecord {
  projectHash: string;
  sceneFingerprints: SceneFingerprint[];
  generatedAt: string;
  outputPath: string;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(',')}}`;
}

function hashValue(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

export function computeProjectHash(project: VideoProject): string {
  return hashValue({
    id: project.id,
    name: project.name,
    config: project.config,
    scenes: project.scenes,
    audio: project.audio,
    metadata: project.metadata,
  });
}

export function computeSceneFingerprints(project: VideoProject): SceneFingerprint[] {
  return project.scenes.map((scene) => ({
    id: scene.id,
    hash: hashValue({
      scene,
      width: project.config.width,
      height: project.config.height,
      fps: project.config.fps,
      backgroundColor: project.config.backgroundColor,
    }),
  }));
}

export function diffChangedScenes(
  previous: SceneFingerprint[],
  current: SceneFingerprint[]
): string[] {
  const previousById = new Map(previous.map((entry) => [entry.id, entry.hash]));

  return current
    .filter((entry) => previousById.get(entry.id) !== entry.hash)
    .map((entry) => entry.id);
}
