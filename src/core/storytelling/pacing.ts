/**
 * Pacing System - Scene pacing presets and timing for video content
 * M2: Pacing and Readability System
 */

/**
 * Pacing preset types
 */
export type PacingPreset = 'broadcast' | 'social' | 'explainer' | 'custom';

/**
 * Pacing preset configuration
 */
export interface PacingPresetConfig {
  /** Preset name */
  name: PacingPreset;
  /** Total video duration target in ms */
  targetDuration: number;
  /** Minimum scene duration in ms */
  minSceneDuration: number;
  /** Maximum scene duration in ms */
  maxSceneDuration: number;
  /** Transition duration in ms */
  transitionDuration: number;
  /** Chart stabilization delay - time before showing callouts (ms) */
  chartStabilizationDelay: number;
  /** Allow callouts during chart animation */
  allowAnimatedCallouts: boolean;
  /** Label density multiplier */
  labelDensityMultiplier: number;
  /** Recommended max labels per chart */
  maxLabels: number;
  /** Content pace (words/second for narration) */
  narrationPace: number;
}

/**
 * Built-in pacing presets
 */
export const pacingPresets: Record<PacingPreset, PacingPresetConfig> = {
  /** Broadcast TV - fast-paced, minimal text, quick cuts */
  broadcast: {
    name: 'broadcast',
    targetDuration: 30000,
    minSceneDuration: 3000,
    maxSceneDuration: 8000,
    transitionDuration: 650,
    chartStabilizationDelay: 1500,
    allowAnimatedCallouts: true,
    labelDensityMultiplier: 0.6,
    maxLabels: 4,
    narrationPace: 2.5,
  },
  /** Social media - medium pace, eye-catching, scroll-stopping */
  social: {
    name: 'social',
    targetDuration: 45000,
    minSceneDuration: 5000,
    maxSceneDuration: 12000,
    transitionDuration: 750,
    chartStabilizationDelay: 2500,
    allowAnimatedCallouts: true,
    labelDensityMultiplier: 0.8,
    maxLabels: 5,
    narrationPace: 2.0,
  },
  /** Explainer video - slower, educational, detailed */
  explainer: {
    name: 'explainer',
    targetDuration: 90000,
    minSceneDuration: 10000,
    maxSceneDuration: 25000,
    transitionDuration: 900,
    chartStabilizationDelay: 4000,
    allowAnimatedCallouts: true,
    labelDensityMultiplier: 1.0,
    maxLabels: 8,
    narrationPace: 1.5,
  },
  /** Custom - user-defined parameters */
  custom: {
    name: 'custom',
    targetDuration: 60000,
    minSceneDuration: 5000,
    maxSceneDuration: 15000,
    transitionDuration: 700,
    chartStabilizationDelay: 2000,
    allowAnimatedCallouts: true,
    labelDensityMultiplier: 1.0,
    maxLabels: 6,
    narrationPace: 2.0,
  },
};

/**
 * Get pacing preset configuration
 */
export function getPacingPreset(preset: PacingPreset | string): PacingPresetConfig {
  const normalized = preset.toLowerCase() as PacingPreset;
  return pacingPresets[normalized] || pacingPresets.explainer;
}

/**
 * Calculate recommended scene duration based on content complexity
 */
export function calculateSceneDuration(
  contentComplexity: 'simple' | 'moderate' | 'complex',
  pacingPreset: PacingPresetConfig
): number {
  const complexityMultipliers = {
    simple: 0.7,
    moderate: 1.0,
    complex: 1.4,
  };

  const baseDuration = (pacingPreset.minSceneDuration + pacingPreset.maxSceneDuration) / 2;
  return Math.round(baseDuration * complexityMultipliers[contentComplexity]);
}

/**
 * Calculate chart callout timing
 * Returns when callouts should appear after chart animation starts
 */
export function calculateCalloutTiming(
  sceneDuration: number,
  pacingPreset: PacingPresetConfig,
  hasChart: boolean = true
): {
  /** When to show initial callouts (ms from scene start) */
  initialCalloutTime: number;
  /** When to show final callouts (ms from scene start) */
  finalCalloutTime: number;
  /** Whether callouts should wait for chart stabilization */
  waitForStabilization: boolean;
} {
  if (!hasChart) {
    // No chart - show callouts earlier
    return {
      initialCalloutTime: Math.round(sceneDuration * 0.15),
      finalCalloutTime: Math.round(sceneDuration * 0.85),
      waitForStabilization: false,
    };
  }

  const stabilizationDelay = pacingPreset.chartStabilizationDelay;
  const sceneProgress = sceneDuration / pacingPreset.targetDuration;

  // For longer scenes, add more delay for comprehension
  const additionalDelay = sceneProgress > 0.5 ? stabilizationDelay * 0.5 : 0;

  return {
    initialCalloutTime: stabilizationDelay + additionalDelay,
    finalCalloutTime: Math.round(sceneDuration * 0.9),
    waitForStabilization: !pacingPreset.allowAnimatedCallouts,
  };
}

/**
 * Calculate label density based on scene parameters
 */
export function calculateLabelDensity(
  dataPointCount: number,
  sceneDuration: number,
  pacingPreset: PacingPresetConfig
): {
  /** Recommended number of labels to display */
  recommendedLabels: number;
  /** Whether to show all labels */
  showAll: boolean;
  /** Label stride (show every Nth label) */
  stride: number;
} {
  if (dataPointCount <= 10) {
    return {
      recommendedLabels: dataPointCount,
      showAll: true,
      stride: 1,
    };
  }

  // Base recommended labels from preset
  const baseLabels = Math.min(pacingPreset.maxLabels, dataPointCount);

  // Adjust for scene duration
  const durationFactor = sceneDuration / pacingPreset.targetDuration;

  // Longer scenes can show more labels
  let adjustedLabels = Math.round(
    baseLabels * pacingPreset.labelDensityMultiplier * (0.8 + durationFactor * 0.4)
  );
  adjustedLabels = Math.max(2, Math.min(adjustedLabels, dataPointCount));

  // Calculate stride
  const stride =
    dataPointCount > adjustedLabels ? Math.max(1, Math.round(dataPointCount / adjustedLabels)) : 1;

  return {
    recommendedLabels: adjustedLabels,
    showAll: dataPointCount <= adjustedLabels,
    stride,
  };
}

/**
 * Validate transition duration for pacing consistency
 */
export function validateTransitionDuration(
  duration: number,
  pacingPreset: PacingPresetConfig
): {
  /** Whether duration is valid */
  valid: boolean;
  /** Recommended duration */
  recommended: number;
  /** Severity of issue */
  severity: 'error' | 'warning' | 'info';
  /** Message */
  message: string;
} {
  const tolerance = 0.2; // 20% tolerance
  const minValid = pacingPreset.transitionDuration * (1 - tolerance);
  const maxValid = pacingPreset.transitionDuration * (1 + tolerance);

  if (duration < minValid) {
    return {
      valid: false,
      recommended: pacingPreset.transitionDuration,
      severity: duration < minValid * 0.5 ? 'error' : 'warning',
      message: `Transition too fast (${duration}ms). Recommended: ${pacingPreset.transitionDuration}ms for ${pacingPreset.name} pacing.`,
    };
  }

  if (duration > maxValid) {
    return {
      valid: false,
      recommended: pacingPreset.transitionDuration,
      severity: duration > maxValid * 1.5 ? 'error' : 'warning',
      message: `Transition too slow (${duration}ms). Recommended: ${pacingPreset.transitionDuration}ms for ${pacingPreset.name} pacing.`,
    };
  }

  return {
    valid: true,
    recommended: pacingPreset.transitionDuration,
    severity: 'info',
    message: `Transition duration (${duration}ms) is optimal for ${pacingPreset.name} pacing.`,
  };
}

/**
 * Calculate overall pacing score for a scene
 */
export function calculatePacingScore(
  sceneDuration: number,
  transitionDuration: number,
  dataPointCount: number,
  labelCount: number,
  pacingPreset: PacingPresetConfig
): {
  /** Overall score 0-100 */
  score: number;
  /** Breakdown of scoring */
  breakdown: {
    durationScore: number;
    transitionScore: number;
    labelScore: number;
  };
  /** Recommendations */
  recommendations: string[];
} {
  const recommendations: string[] = [];

  // Duration score
  let durationScore = 100;
  if (sceneDuration < pacingPreset.minSceneDuration) {
    durationScore = Math.max(0, (sceneDuration / pacingPreset.minSceneDuration) * 100);
    recommendations.push(
      `Scene too short (${sceneDuration}ms). Minimum: ${pacingPreset.minSceneDuration}ms`
    );
  } else if (sceneDuration > pacingPreset.maxSceneDuration) {
    durationScore = Math.max(
      0,
      100 - ((sceneDuration - pacingPreset.maxSceneDuration) / pacingPreset.maxSceneDuration) * 50
    );
    recommendations.push(
      `Scene too long (${sceneDuration}ms). Maximum: ${pacingPreset.maxSceneDuration}ms`
    );
  }

  // Transition score
  const transitionValidation = validateTransitionDuration(transitionDuration, pacingPreset);
  let transitionScore = transitionValidation.valid ? 100 : 70;
  if (!transitionValidation.valid) {
    recommendations.push(transitionValidation.message);
  }

  // Label density score
  const labelDensity = calculateLabelDensity(dataPointCount, sceneDuration, pacingPreset);
  let labelScore = 100;
  if (labelCount > labelDensity.recommendedLabels * 1.5) {
    labelScore = Math.max(
      0,
      100 - ((labelCount - labelDensity.recommendedLabels) / dataPointCount) * 100
    );
    recommendations.push(
      `Too many labels (${labelCount}). Recommended: ${labelDensity.recommendedLabels} for readability`
    );
  } else if (labelCount < labelDensity.recommendedLabels * 0.5 && dataPointCount > 4) {
    labelScore = 70;
    recommendations.push(`Consider showing more labels for data completeness`);
  }

  const score = Math.round((durationScore + transitionScore + labelScore) / 3);

  return {
    score,
    breakdown: {
      durationScore,
      transitionScore,
      labelScore,
    },
    recommendations,
  };
}

/**
 * Apply pacing preset to a scene configuration
 */
export function applyPacingPreset(
  preset: PacingPreset,
  sceneCount: number,
  customConfig?: Partial<PacingPresetConfig>
): {
  basePreset: PacingPresetConfig;
  sceneDuration: number;
  totalTransitionTime: number;
  availableTime: number;
  warnings: string[];
} {
  const basePreset = { ...pacingPresets[preset], ...customConfig };
  const warnings: string[] = [];

  // Calculate timing
  const totalTransitionTime = (sceneCount - 1) * basePreset.transitionDuration;
  const availableTime = basePreset.targetDuration - totalTransitionTime;

  if (availableTime <= 0) {
    warnings.push(
      `Not enough time for ${sceneCount} scenes with ${basePreset.transitionDuration}ms transitions`
    );
  }

  const sceneDuration = Math.round(availableTime / sceneCount);

  // Validate scene duration
  if (sceneDuration < basePreset.minSceneDuration) {
    warnings.push(
      `Scene duration (${sceneDuration}ms) below minimum (${basePreset.minSceneDuration}ms)`
    );
  }
  if (sceneDuration > basePreset.maxSceneDuration) {
    warnings.push(
      `Scene duration (${sceneDuration}ms) above maximum (${basePreset.maxSceneDuration}ms)`
    );
  }

  return {
    basePreset,
    sceneDuration,
    totalTransitionTime,
    availableTime,
    warnings,
  };
}
