import { describe, it, expect } from '../setup.js';
import {
  SPORTS_CANONICAL_METRICS,
  sportsSampleDatasets,
  toSportsSeries,
  validateSportsStats,
} from '../../src/domain/sports/index.js';

describe('Sports domain pack', () => {
  it('defines at least 10 canonical metrics', () => {
    expect(SPORTS_CANONICAL_METRICS.length).toBeGreaterThanOrEqual(10);
  });

  it('validates malformed metric payloads', () => {
    const result = validateSportsStats({
      pointsPerGame: 1,
      assistsPerGame: 'invalid',
    });

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.key === 'assistsPerGame')).toBe(true);
  });

  it('flags ambiguous alias metrics', () => {
    const result = validateSportsStats({
      pointsPerGame: 1,
      assistsPerGame: 2,
      reboundsPerGame: 3,
      fieldGoalPct: 4,
      fgPct: 5,
      threePointPct: 6,
      turnoversPerGame: 7,
      offensiveRating: 8,
      defensiveRating: 9,
      winPct: 10,
      pace: 11,
    });

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.details?.includes('ambiguous aliases'))).toBe(true);
  });

  it('transforms sample dataset into render-ready formatted metrics', () => {
    const series = toSportsSeries(sportsSampleDatasets['contender-team']);

    expect(series.metrics.length).toBe(SPORTS_CANONICAL_METRICS.length);
    expect(series.metrics.every((metric) => typeof metric.formatted === 'string')).toBe(true);
  });
});
