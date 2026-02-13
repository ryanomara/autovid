import type { FinanceMetricKey } from './index.js';

export type FinanceScenarioId = 'large-cap-tech' | 'value-industrial';

export type FinanceDataset = Record<FinanceMetricKey, number>;

export const financeSampleDatasets: Record<FinanceScenarioId, FinanceDataset> = {
  'large-cap-tech': {
    revenue: 307_400_000_000,
    operatingIncome: 84_300_000_000,
    netIncome: 73_800_000_000,
    eps: 5.8,
    freeCashFlow: 69_900_000_000,
    grossMarginPct: 56.4,
    operatingMarginPct: 27.4,
    peRatio: 28.3,
    debtToEquity: 0.31,
    marketCap: 2_120_000_000_000,
  },
  'value-industrial': {
    revenue: 82_600_000_000,
    operatingIncome: 10_200_000_000,
    netIncome: 7_900_000_000,
    eps: 9.4,
    freeCashFlow: 6_800_000_000,
    grossMarginPct: 30.2,
    operatingMarginPct: 12.4,
    peRatio: 14.8,
    debtToEquity: 1.22,
    marketCap: 94_000_000_000,
  },
};
