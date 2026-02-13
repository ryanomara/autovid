export type SemanticMetricKind =
  | 'currency'
  | 'percentage'
  | 'ratio'
  | 'count'
  | 'price'
  | 'multiple'
  | 'durationMs'
  | 'record';

export interface CanonicalMetricDefinition<TMetricKey extends string> {
  key: TMetricKey;
  label: string;
  kind: SemanticMetricKind;
  decimals?: number;
}

export interface ValidationIssue {
  key: string;
  reason: 'missing' | 'not_numeric' | 'invalid_value';
  details?: string;
}

export interface RenderMetric<TMetricKey extends string> {
  key: TMetricKey;
  label: string;
  kind: SemanticMetricKind;
  value: number | string;
  formatted: string;
}
