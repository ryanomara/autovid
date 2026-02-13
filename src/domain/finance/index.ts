import { formatMetricValue } from '../common/format.js';
import type { CanonicalMetricDefinition, RenderMetric, ValidationIssue } from '../common/types.js';
import { validateAmbiguousAliases, validateNumericMetrics } from '../common/validation.js';

export type FinanceMetricKey =
  | 'revenue'
  | 'operatingIncome'
  | 'netIncome'
  | 'eps'
  | 'freeCashFlow'
  | 'grossMarginPct'
  | 'operatingMarginPct'
  | 'peRatio'
  | 'debtToEquity'
  | 'marketCap';

export const FINANCE_CANONICAL_METRICS: CanonicalMetricDefinition<FinanceMetricKey>[] = [
  { key: 'revenue', label: 'Revenue', kind: 'currency', decimals: 0 },
  { key: 'operatingIncome', label: 'Operating Income', kind: 'currency', decimals: 0 },
  { key: 'netIncome', label: 'Net Income', kind: 'currency', decimals: 0 },
  { key: 'eps', label: 'EPS', kind: 'currency', decimals: 2 },
  { key: 'freeCashFlow', label: 'Free Cash Flow', kind: 'currency', decimals: 0 },
  { key: 'grossMarginPct', label: 'Gross Margin', kind: 'percentage', decimals: 1 },
  { key: 'operatingMarginPct', label: 'Operating Margin', kind: 'percentage', decimals: 1 },
  { key: 'peRatio', label: 'P/E Ratio', kind: 'ratio', decimals: 2 },
  { key: 'debtToEquity', label: 'Debt / Equity', kind: 'ratio', decimals: 2 },
  { key: 'marketCap', label: 'Market Cap', kind: 'currency', decimals: 0 },
];

const financeMetricKeys: FinanceMetricKey[] = FINANCE_CANONICAL_METRICS.map((metric) => metric.key);

export interface FinanceValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface FinanceSeriesResult {
  metrics: RenderMetric<FinanceMetricKey>[];
}

export { financeSampleDatasets } from './sample-datasets.js';
export { createFinanceDomainExampleProject } from './example-project.js';

export function validateFinanceStats(input: Record<string, unknown>): FinanceValidationResult {
  const numericIssues = validateNumericMetrics(input, financeMetricKeys);
  const ambiguousIssues = validateAmbiguousAliases(input, [
    ['revenue', 'sales', 'totalRevenue'],
    ['marketCap', 'marketCapitalization'],
  ]);
  const issues = [...numericIssues, ...ambiguousIssues];

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function toFinanceSeries(input: Record<FinanceMetricKey, number>): FinanceSeriesResult {
  const metrics = FINANCE_CANONICAL_METRICS.map((metric) => {
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
