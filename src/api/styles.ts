import type { StylePreset } from '../core/styles/index.js';
import { initStyleProject, listStylePresets, loadStyleProfile } from '../core/styles/index.js';

export interface InitStyleProjectRequest {
  styleId: string;
  outputPath: string;
  variables?: Record<string, string>;
}

export function getAvailableStyles(): StylePreset[] {
  return listStylePresets();
}

export async function getStyleProfile(styleId: string): Promise<Record<string, unknown>> {
  return loadStyleProfile(styleId);
}

export async function createStyleProject(request: InitStyleProjectRequest): Promise<{
  projectPath: string;
  preset: StylePreset;
}> {
  return initStyleProject(request.styleId, request.outputPath, request.variables ?? {});
}
