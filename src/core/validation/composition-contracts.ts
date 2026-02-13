import type { Layer, Scene, TextLayer, VideoProject } from '../../types/index.js';

export type ValidationMode = 'strict' | 'permissive';
type SceneContractType = 'intro' | 'kpi' | 'line-chart' | 'bar-chart' | 'outro' | 'unknown';

interface SceneContractSchema {
  minDurationMs: number;
  maxDurationMs?: number;
  requiresTitle: boolean;
  minTextLayers?: number;
  requiredChartType?: 'line' | 'bar';
}

const CONTRACT_SCHEMAS: Record<Exclude<SceneContractType, 'unknown'>, SceneContractSchema> = {
  intro: { minDurationMs: 1200, maxDurationMs: 6000, requiresTitle: true, minTextLayers: 1 },
  kpi: { minDurationMs: 1200, requiresTitle: false, minTextLayers: 2 },
  'line-chart': { minDurationMs: 1600, requiresTitle: false, requiredChartType: 'line' },
  'bar-chart': { minDurationMs: 1600, requiresTitle: false, requiredChartType: 'bar' },
  outro: { minDurationMs: 1000, maxDurationMs: 6000, requiresTitle: true, minTextLayers: 1 },
};

export interface CompositionIssue {
  level: 'error' | 'warning';
  code: string;
  path: string;
  message: string;
  suggestion: string;
}

export interface CompositionValidationReport {
  mode: ValidationMode;
  valid: boolean;
  errors: number;
  warnings: number;
  sceneContracts: Array<{ sceneId: string; contract: SceneContractType }>;
  issues: CompositionIssue[];
}

function isTitleLikeText(layer: TextLayer): boolean {
  const id = String(layer.id ?? '');
  const name = String(layer.name ?? '');
  const text = String(layer.text ?? '');
  return (
    layer.fontSize >= 56 ||
    /(title|headline|intro|outro|summary|closing)/i.test(`${id} ${name} ${text}`)
  );
}

function classifyScene(scene: Scene, sceneIndex: number, totalScenes: number): SceneContractType {
  const chartLayers = scene.layers.filter((layer) => layer.type === 'chart') as Array<
    Layer & { chartType?: string }
  >;
  if (chartLayers.some((layer) => layer.chartType === 'line')) return 'line-chart';
  if (chartLayers.some((layer) => layer.chartType === 'bar')) return 'bar-chart';

  const textLayers = scene.layers.filter((layer) => layer.type === 'text') as TextLayer[];
  const hasTitle = textLayers.some((layer) => isTitleLikeText(layer));

  if (sceneIndex === 0 && hasTitle) return 'intro';
  if (sceneIndex === totalScenes - 1 && hasTitle) return 'outro';
  if (textLayers.length >= 2) return 'kpi';
  return 'unknown';
}

function addIssue(
  issues: CompositionIssue[],
  mode: ValidationMode,
  issue: Omit<CompositionIssue, 'level'>,
  strictAsError: boolean
): void {
  issues.push({
    ...issue,
    level: mode === 'strict' || strictAsError ? 'error' : 'warning',
  });
}

function validateTextLayerPolicies(
  scene: Scene,
  sceneIndex: number,
  mode: ValidationMode,
  issues: CompositionIssue[]
): void {
  const textLayers = scene.layers.filter((layer) => layer.type === 'text') as TextLayer[];
  for (let textIndex = 0; textIndex < textLayers.length; textIndex += 1) {
    const layer = textLayers[textIndex];
    const pathBase = `scenes[${sceneIndex}].layers[text:${layer.id ?? textIndex}]`;

    if (isTitleLikeText(layer) && (typeof layer.zIndex !== 'number' || layer.zIndex < 900)) {
      addIssue(
        issues,
        mode,
        {
          code: 'title-zindex-too-low',
          path: `${pathBase}.zIndex`,
          message: 'Title-like text must be in top layer band (>= 900).',
          suggestion: 'Set zIndex to 900 or higher for title/closing text layers.',
        },
        true
      );
    }

    if (!layer.overlapMode) {
      addIssue(
        issues,
        mode,
        {
          code: 'text-overlap-mode-missing',
          path: `${pathBase}.overlapMode`,
          message: 'Text layer is missing overlapMode policy.',
          suggestion:
            'Set overlapMode to "avoid-text" (default) or "avoid-all"/"label"/"effect" intentionally.',
        },
        false
      );
    }
  }
}

function validateTransitionPolicy(
  scene: Scene,
  sceneIndex: number,
  mode: ValidationMode,
  issues: CompositionIssue[]
): void {
  if (!scene.transition || typeof scene.transition.duration !== 'number') {
    addIssue(
      issues,
      mode,
      {
        code: 'transition-missing',
        path: `scenes[${sceneIndex}].transition`,
        message: 'Scene transition is missing or incomplete.',
        suggestion: 'Set scene.transition with type and duration (recommended 650-900ms).',
      },
      false
    );
    return;
  }

  const duration = scene.transition.duration;
  if (duration < 650 || duration > 900) {
    addIssue(
      issues,
      mode,
      {
        code: 'transition-duration-out-of-range',
        path: `scenes[${sceneIndex}].transition.duration`,
        message: `Transition duration ${duration}ms is outside preferred range (650-900ms).`,
        suggestion: 'Use a transition duration between 650ms and 900ms for agent-safe pacing.',
      },
      false
    );
  }
}

function validateChartLayerData(
  scene: Scene,
  sceneIndex: number,
  mode: ValidationMode,
  issues: CompositionIssue[]
): void {
  const chartLayers = scene.layers.filter((layer) => layer.type === 'chart') as Array<
    Layer & {
      data?: { labels?: unknown[]; values?: unknown[] };
      chartType?: string;
      style?: { maxLabels?: number; showValues?: boolean };
    }
  >;

  for (let chartIndex = 0; chartIndex < chartLayers.length; chartIndex += 1) {
    const chart = chartLayers[chartIndex];
    const pathBase = `scenes[${sceneIndex}].layers[chart:${chart.id ?? chartIndex}]`;
    const labels = Array.isArray(chart.data?.labels) ? chart.data.labels : [];
    const values = Array.isArray(chart.data?.values) ? chart.data.values : [];

    if (labels.length < 2 || values.length < 2) {
      addIssue(
        issues,
        mode,
        {
          code: 'chart-data-too-short',
          path: `${pathBase}.data`,
          message: 'Chart data requires at least two labels and two values.',
          suggestion:
            'Provide at least two points so the contract can render meaningful chart geometry.',
        },
        true
      );
    }

    if (labels.length !== values.length) {
      addIssue(
        issues,
        mode,
        {
          code: 'chart-data-mismatch',
          path: `${pathBase}.data`,
          message: `Chart labels (${labels.length}) and values (${values.length}) lengths do not match.`,
          suggestion: 'Ensure labels and values arrays are the same length.',
        },
        true
      );
    }

    if (chart.chartType === 'line' && chart.style?.showValues === true && labels.length > 8) {
      addIssue(
        issues,
        mode,
        {
          code: 'line-chart-label-density-risk',
          path: `${pathBase}.style`,
          message: 'Line chart shows values with >8 labels; likely visual crowding risk.',
          suggestion: 'Lower maxLabels or disable showValues for dense line charts.',
        },
        false
      );
    }
  }
}

function validateContract(
  scene: Scene,
  sceneIndex: number,
  contract: SceneContractType,
  mode: ValidationMode,
  issues: CompositionIssue[]
): void {
  const pathBase = `scenes[${sceneIndex}]`;
  const textLayers = scene.layers.filter((layer) => layer.type === 'text') as TextLayer[];
  const chartLayers = scene.layers.filter((layer) => layer.type === 'chart') as Array<
    Layer & { chartType?: string }
  >;

  if (contract === 'unknown') {
    addIssue(
      issues,
      mode,
      {
        code: 'scene-contract-unknown',
        path: pathBase,
        message:
          'Scene does not match a known composition contract (intro/kpi/line-chart/bar-chart/outro).',
        suggestion:
          'Add contract-defining layers (title text, KPI text group, or chart layer) so agent validation can classify this scene.',
      },
      false
    );
    return;
  }

  const schema = CONTRACT_SCHEMAS[contract];
  const sceneDuration = scene.endTime - scene.startTime;

  if (sceneDuration < schema.minDurationMs) {
    addIssue(
      issues,
      mode,
      {
        code: 'scene-duration-too-short',
        path: `${pathBase}.endTime`,
        message: `${contract} scene duration (${sceneDuration}ms) is shorter than required minimum (${schema.minDurationMs}ms).`,
        suggestion: `Increase scene duration to at least ${schema.minDurationMs}ms.`,
      },
      true
    );
  }

  if (typeof schema.maxDurationMs === 'number' && sceneDuration > schema.maxDurationMs) {
    addIssue(
      issues,
      mode,
      {
        code: 'scene-duration-too-long',
        path: `${pathBase}.endTime`,
        message: `${contract} scene duration (${sceneDuration}ms) exceeds recommended maximum (${schema.maxDurationMs}ms).`,
        suggestion: 'Shorten scene or split content across multiple scenes.',
      },
      false
    );
  }

  if (schema.requiresTitle && !textLayers.some((layer) => isTitleLikeText(layer))) {
    addIssue(
      issues,
      mode,
      {
        code: 'title-missing',
        path: `${pathBase}.layers`,
        message: `${contract} scene is missing a title-like text layer.`,
        suggestion:
          'Add a text layer with fontSize >= 56 (or explicit title naming) and zIndex >= 900.',
      },
      true
    );
  }

  if (typeof schema.minTextLayers === 'number' && textLayers.length < schema.minTextLayers) {
    addIssue(
      issues,
      mode,
      {
        code: 'insufficient-text-layers',
        path: `${pathBase}.layers`,
        message: `${contract} scene requires at least ${schema.minTextLayers} text layer(s).`,
        suggestion: `Add ${schema.minTextLayers - textLayers.length} more text layer(s) or change scene contract.`,
      },
      true
    );
  }

  if (
    schema.requiredChartType &&
    !chartLayers.some((layer) => layer.chartType === schema.requiredChartType)
  ) {
    addIssue(
      issues,
      mode,
      {
        code: 'required-chart-type-missing',
        path: `${pathBase}.layers`,
        message: `${contract} requires a ${schema.requiredChartType} chart layer.`,
        suggestion: `Add a chart layer with chartType: "${schema.requiredChartType}".`,
      },
      true
    );
  }
}

export function validateCompositionContracts(
  project: VideoProject,
  mode: ValidationMode
): CompositionValidationReport {
  const issues: CompositionIssue[] = [];
  const sceneContracts: Array<{ sceneId: string; contract: SceneContractType }> = [];

  for (let sceneIndex = 0; sceneIndex < project.scenes.length; sceneIndex += 1) {
    const scene = project.scenes[sceneIndex];
    const contract = classifyScene(scene, sceneIndex, project.scenes.length);
    sceneContracts.push({ sceneId: scene.id, contract });

    validateContract(scene, sceneIndex, contract, mode, issues);
    validateTextLayerPolicies(scene, sceneIndex, mode, issues);
    validateTransitionPolicy(scene, sceneIndex, mode, issues);
    validateChartLayerData(scene, sceneIndex, mode, issues);
  }

  const errors = issues.filter((issue) => issue.level === 'error').length;
  const warnings = issues.filter((issue) => issue.level === 'warning').length;

  return {
    mode,
    valid: errors === 0,
    errors,
    warnings,
    sceneContracts,
    issues,
  };
}
