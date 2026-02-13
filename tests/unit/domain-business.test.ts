import { describe, it, expect } from '../setup.js';
import {
  BUSINESS_CANONICAL_METRICS,
  businessSampleDatasets,
  toBusinessSeries,
  validateBusinessStats,
} from '../../src/domain/business/index.js';

describe('Business domain pack', () => {
  it('defines at least 10 canonical metrics', () => {
    expect(BUSINESS_CANONICAL_METRICS.length).toBeGreaterThanOrEqual(10);
  });

  it('validates malformed metric payloads', () => {
    const result = validateBusinessStats({
      arr: 1,
      mrrGrowthPct: 'invalid',
    });

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.key === 'mrrGrowthPct')).toBe(true);
  });

  it('flags ambiguous alias metrics', () => {
    const result = validateBusinessStats({
      arr: 1,
      annualRecurringRevenue: 2,
      mrrGrowthPct: 1,
      churnPct: 2,
      cac: 3,
      ltv: 4,
      ltvCacRatio: 5,
      grossRetentionPct: 6,
      netRetentionPct: 7,
      pipelineCoverageRatio: 8,
      winRatePct: 9,
    });

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.details?.includes('ambiguous aliases'))).toBe(true);
  });

  it('transforms sample dataset into render-ready formatted metrics', () => {
    const series = toBusinessSeries(businessSampleDatasets['saas-scale-up']);

    expect(series.metrics.length).toBe(BUSINESS_CANONICAL_METRICS.length);
    expect(series.metrics.every((metric) => typeof metric.formatted === 'string')).toBe(true);
  });
});
