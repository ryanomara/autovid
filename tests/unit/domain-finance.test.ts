import { describe, it, expect } from '../setup.js';
import {
  FINANCE_CANONICAL_METRICS,
  financeSampleDatasets,
  toFinanceSeries,
  validateFinanceStats,
} from '../../src/domain/finance/index.js';

describe('Finance domain pack', () => {
  it('defines at least 10 canonical metrics', () => {
    expect(FINANCE_CANONICAL_METRICS.length).toBeGreaterThanOrEqual(10);
  });

  it('validates malformed metric payloads', () => {
    const result = validateFinanceStats({
      revenue: 100,
      operatingIncome: 'bad',
    });

    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some((issue) => issue.key === 'operatingIncome')).toBe(true);
  });

  it('flags ambiguous alias metrics', () => {
    const result = validateFinanceStats({
      revenue: 100,
      operatingIncome: 10,
      netIncome: 8,
      eps: 0.2,
      freeCashFlow: 5,
      grossMarginPct: 40,
      operatingMarginPct: 20,
      peRatio: 15,
      debtToEquity: 0.5,
      marketCap: 1000,
      sales: 101,
    });

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.details?.includes('ambiguous aliases'))).toBe(true);
  });

  it('transforms sample dataset into render-ready formatted metrics', () => {
    const series = toFinanceSeries(financeSampleDatasets['large-cap-tech']);

    expect(series.metrics.length).toBe(FINANCE_CANONICAL_METRICS.length);
    expect(series.metrics.every((metric) => typeof metric.formatted === 'string')).toBe(true);
  });
});
