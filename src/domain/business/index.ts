import { formatMetricValue } from '../common/format.js';
import type { CanonicalMetricDefinition, RenderMetric, ValidationIssue } from '../common/types.js';
import { validateAmbiguousAliases, validateNumericMetrics } from '../common/validation.js';

export type BusinessMetricKey =
  | 'arr'
  | 'mrrGrowthPct'
  | 'churnPct'
  | 'cac'
  | 'ltv'
  | 'ltvCacRatio'
  | 'grossRetentionPct'
  | 'netRetentionPct'
  | 'pipelineCoverageRatio'
  | 'winRatePct';

export const BUSINESS_CANONICAL_METRICS: CanonicalMetricDefinition<BusinessMetricKey>[] = [
  { key: 'arr', label: 'ARR', kind: 'currency', decimals: 0 },
  { key: 'mrrGrowthPct', label: 'MRR Growth', kind: 'percentage', decimals: 1 },
  { key: 'churnPct', label: 'Churn', kind: 'percentage', decimals: 1 },
  { key: 'cac', label: 'CAC', kind: 'currency', decimals: 0 },
  { key: 'ltv', label: 'LTV', kind: 'currency', decimals: 0 },
  { key: 'ltvCacRatio', label: 'LTV/CAC', kind: 'ratio', decimals: 2 },
  { key: 'grossRetentionPct', label: 'Gross Retention', kind: 'percentage', decimals: 1 },
  { key: 'netRetentionPct', label: 'Net Retention', kind: 'percentage', decimals: 1 },
  { key: 'pipelineCoverageRatio', label: 'Pipeline Coverage', kind: 'ratio', decimals: 2 },
  { key: 'winRatePct', label: 'Win Rate', kind: 'percentage', decimals: 1 },
];

const businessMetricKeys: BusinessMetricKey[] = BUSINESS_CANONICAL_METRICS.map(
  (metric) => metric.key
);

export interface BusinessValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface BusinessSeriesResult {
  metrics: RenderMetric<BusinessMetricKey>[];
}

export { businessSampleDatasets } from './sample-datasets.js';
export { createBusinessDomainExampleProject } from './example-project.js';

export function validateBusinessStats(input: Record<string, unknown>): BusinessValidationResult {
  const numericIssues = validateNumericMetrics(input, businessMetricKeys);
  const ambiguousIssues = validateAmbiguousAliases(input, [
    ['arr', 'annualRecurringRevenue'],
    ['churnPct', 'churnRate'],
    ['winRatePct', 'closeRate'],
  ]);
  const issues = [...numericIssues, ...ambiguousIssues];

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function toBusinessSeries(input: Record<BusinessMetricKey, number>): BusinessSeriesResult {
  const metrics = BUSINESS_CANONICAL_METRICS.map((metric) => {
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
