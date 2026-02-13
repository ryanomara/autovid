import type { SportsMetricKey } from './index.js';

export type SportsScenarioId = 'contender-team' | 'balanced-team';

export type SportsDataset = Record<SportsMetricKey, number>;

export const sportsSampleDatasets: Record<SportsScenarioId, SportsDataset> = {
  'contender-team': {
    pointsPerGame: 118.4,
    assistsPerGame: 29.2,
    reboundsPerGame: 46.1,
    fieldGoalPct: 51.2,
    threePointPct: 39.4,
    turnoversPerGame: 12.1,
    offensiveRating: 121.3,
    defensiveRating: 109.6,
    winPct: 71.5,
    pace: 99.7,
  },
  'balanced-team': {
    pointsPerGame: 111.2,
    assistsPerGame: 25.1,
    reboundsPerGame: 43.4,
    fieldGoalPct: 47.8,
    threePointPct: 35.9,
    turnoversPerGame: 13.4,
    offensiveRating: 114.1,
    defensiveRating: 112.7,
    winPct: 54.9,
    pace: 97.3,
  },
};
