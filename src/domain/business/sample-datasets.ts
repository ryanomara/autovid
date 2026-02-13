import type { BusinessMetricKey } from './index.js';

export type BusinessScenarioId = 'saas-scale-up' | 'enterprise-platform';

export type BusinessDataset = Record<BusinessMetricKey, number>;

export const businessSampleDatasets: Record<BusinessScenarioId, BusinessDataset> = {
  'saas-scale-up': {
    arr: 128_000_000,
    mrrGrowthPct: 6.1,
    churnPct: 2.9,
    cac: 4_800,
    ltv: 54_600,
    ltvCacRatio: 11.38,
    grossRetentionPct: 91.4,
    netRetentionPct: 118.2,
    pipelineCoverageRatio: 3.4,
    winRatePct: 27.8,
  },
  'enterprise-platform': {
    arr: 420_000_000,
    mrrGrowthPct: 3.2,
    churnPct: 1.4,
    cac: 12_600,
    ltv: 138_000,
    ltvCacRatio: 10.95,
    grossRetentionPct: 95.1,
    netRetentionPct: 124.6,
    pipelineCoverageRatio: 2.8,
    winRatePct: 31.4,
  },
};
