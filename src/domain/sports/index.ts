import { formatMetricValue } from '../common/format.js';
import type { CanonicalMetricDefinition, RenderMetric, ValidationIssue } from '../common/types.js';
import { validateAmbiguousAliases, validateNumericMetrics } from '../common/validation.js';

export type SportsMetricKey =
  | 'pointsPerGame'
  | 'assistsPerGame'
  | 'reboundsPerGame'
  | 'fieldGoalPct'
  | 'threePointPct'
  | 'turnoversPerGame'
  | 'offensiveRating'
  | 'defensiveRating'
  | 'winPct'
  | 'pace';

export const SPORTS_CANONICAL_METRICS: CanonicalMetricDefinition<SportsMetricKey>[] = [
  { key: 'pointsPerGame', label: 'Points / Game', kind: 'count', decimals: 1 },
  { key: 'assistsPerGame', label: 'Assists / Game', kind: 'count', decimals: 1 },
  { key: 'reboundsPerGame', label: 'Rebounds / Game', kind: 'count', decimals: 1 },
  { key: 'fieldGoalPct', label: 'Field Goal %', kind: 'percentage', decimals: 1 },
  { key: 'threePointPct', label: 'Three Point %', kind: 'percentage', decimals: 1 },
  { key: 'turnoversPerGame', label: 'Turnovers / Game', kind: 'count', decimals: 1 },
  { key: 'offensiveRating', label: 'Offensive Rating', kind: 'count', decimals: 1 },
  { key: 'defensiveRating', label: 'Defensive Rating', kind: 'count', decimals: 1 },
  { key: 'winPct', label: 'Win %', kind: 'percentage', decimals: 1 },
  { key: 'pace', label: 'Pace', kind: 'count', decimals: 1 },
];

const sportsMetricKeys: SportsMetricKey[] = SPORTS_CANONICAL_METRICS.map((metric) => metric.key);

export interface SportsValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface SportsSeriesResult {
  metrics: RenderMetric<SportsMetricKey>[];
}

export { sportsSampleDatasets } from './sample-datasets.js';
export { createSportsDomainExampleProject } from './example-project.js';

export function validateSportsStats(input: Record<string, unknown>): SportsValidationResult {
  const numericIssues = validateNumericMetrics(input, sportsMetricKeys);
  const ambiguousIssues = validateAmbiguousAliases(input, [
    ['winPct', 'winRate'],
    ['fieldGoalPct', 'fgPct'],
    ['threePointPct', 'threePtPct'],
  ]);
  const issues = [...numericIssues, ...ambiguousIssues];

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function toSportsSeries(input: Record<SportsMetricKey, number>): SportsSeriesResult {
  const metrics = SPORTS_CANONICAL_METRICS.map((metric) => {
    const value = input[metric.key];
    return {
      key: metric.key,
      label: metric.label,
      kind: metric.kind,
      value,
      formatted: formatMetricValue(metric.kind, value, metric.decimals),
    };
  });

  return { metrics };
}
