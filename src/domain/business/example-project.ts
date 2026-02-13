import type { VideoProject } from '../../types/index.js';
import { toBusinessSeries } from './index.js';
import type { BusinessDataset } from './sample-datasets.js';

export function createBusinessDomainExampleProject(dataset: BusinessDataset): VideoProject {
  const series = toBusinessSeries(dataset);

  return {
    id: 'business-domain-example',
    name: 'Business Domain Example',
    config: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 9000,
      backgroundColor: { r: 12, g: 20, b: 30, a: 1 },
      outputFormat: 'mp4',
      quality: 'high',
    },
    scenes: [
      {
        id: 'business-domain-kpis',
        startTime: 0,
        endTime: 9000,
        layers: series.metrics.slice(0, 4).map((metric, index) => ({
          id: `business-domain-metric-${metric.key}`,
          type: 'text',
          text: `${metric.label}: ${metric.formatted}`,
          fontFamily: 'Arial',
          fontSize: index === 0 ? 54 : 40,
          typographyPreset: index === 0 ? 'callout' : 'body',
          color: index === 0 ? { r: 164, g: 240, b: 195, a: 1 } : { r: 215, g: 225, b: 245, a: 1 },
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
