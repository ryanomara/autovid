import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  stylePath: string;
  templatePath: string;
  promptStylePath: string;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'cyberpunk-finance',
    name: 'Cyberpunk Finance',
    description: 'Bleed-driven cyberpunk finance style with aspect-first generation rules.',
    stylePath: 'styles/cyberpunk-finance-style.json',
    templatePath: 'styles/cyberpunk-finance-template.json',
    promptStylePath: 'skills/style/cyberpunk-finance-scenes.md',
  },
];

export function listStylePresets(): StylePreset[] {
  return STYLE_PRESETS;
}

export function getStylePreset(styleId: string): StylePreset {
  const preset = STYLE_PRESETS.find((candidate) => candidate.id === styleId);
  if (!preset) {
    throw new Error(`Unknown style preset: ${styleId}`);
  }
  return preset;
}

function applyStringVariables(value: string, variables: Record<string, string>): string {
  let next = value;
  for (const [key, replacement] of Object.entries(variables)) {
    const token = `{${key}}`;
    next = next.split(token).join(replacement);
  }
  return next;
}

function applyVariablesRecursively(value: unknown, variables: Record<string, string>): unknown {
  if (typeof value === 'string') {
    return applyStringVariables(value, variables);
  }
  if (Array.isArray(value)) {
    return value.map((item) => applyVariablesRecursively(item, variables));
  }
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      output[key] = applyVariablesRecursively(nested, variables);
    }
    return output;
  }
  return value;
}

export async function loadStyleProfile(styleId: string): Promise<Record<string, unknown>> {
  const preset = getStylePreset(styleId);
  const stylePath = resolve(preset.stylePath);
  if (!existsSync(stylePath)) {
    throw new Error(`Style profile not found: ${stylePath}`);
  }

  return JSON.parse(await readFile(stylePath, 'utf-8')) as Record<string, unknown>;
}

export async function initStyleProject(
  styleId: string,
  outputPath: string,
  variables: Record<string, string> = {}
): Promise<{ projectPath: string; preset: StylePreset }> {
  const preset = getStylePreset(styleId);
  const templatePath = resolve(preset.templatePath);

  if (!existsSync(templatePath)) {
    throw new Error(`Style template not found: ${templatePath}`);
  }

  const rawTemplate = JSON.parse(await readFile(templatePath, 'utf-8')) as Record<string, unknown>;
  const hydratedTemplate = applyVariablesRecursively(rawTemplate, variables);
  const fullOutputPath = resolve(outputPath);
  await mkdir(dirname(fullOutputPath), { recursive: true });

  await writeFile(fullOutputPath, `${JSON.stringify(hydratedTemplate, null, 2)}\n`, 'utf-8');

  return {
    projectPath: fullOutputPath,
    preset,
  };
}
