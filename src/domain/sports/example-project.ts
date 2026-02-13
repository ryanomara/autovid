import type { VideoProject } from '../../types/index.js';
import { toSportsSeries } from './index.js';
import type { SportsDataset } from './sample-datasets.js';

export function createSportsDomainExampleProject(dataset: SportsDataset): VideoProject {
  const series = toSportsSeries(dataset);

  return {
    id: 'sports-domain-example',
    name: 'Sports Domain Example',
    config: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 9000,
      backgroundColor: { r: 16, g: 22, b: 28, a: 1 },
      outputFormat: 'mp4',
      quality: 'high',
    },
    scenes: [
      {
        id: 'sports-domain-kpis',
        startTime: 0,
        endTime: 9000,
        layers: series.metrics.slice(0, 4).map((metric, index) => ({
          id: `sports-domain-metric-${metric.key}`,
          type: 'text',
          text: `${metric.label}: ${metric.formatted}`,
          fontFamily: 'Arial',
          fontSize: index === 0 ? 54 : 40,
          typographyPreset: index === 0 ? 'callout' : 'body',
          color: index === 0 ? { r: 146, g: 255, b: 191, a: 1 } : { r: 215, g: 225, b: 245, a: 1 },
          textAlign: 'left',
          startTime: 0,
          endTime: 9000,
          position: { x: 160, y: 220 + index * 130 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          opacity: 1,
        })),
        transition: { type: 'fade', duration: 700 },
      },
    ],
    audio: [],
  };
}
