import { describe, it, expect } from '../setup.js';
import { renderChartLayer } from '../../src/core/engine/chart-renderer.js';
import type { ChartLayer } from '../../src/types/index.js';

function countVisiblePixels(data: Uint8ClampedArray): number {
  let count = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) {
      count += 1;
    }
  }
  return count;
}

function createLineLayer(): ChartLayer {
  return {
    id: 'chart-1',
    type: 'chart',
    startTime: 0,
    endTime: 3000,
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    rotation: 0,
    opacity: 1,
    dimensions: { width: 640, height: 360 },
    chartType: 'line',
    data: {
      labels: ['A', 'B', 'C', 'D'],
      values: [10, 20, 15, 28],
    },
    title: 'Test',
  };
}

describe('Chart Renderer', () => {
  it('renders line chart with valid buffer size', () => {
    const layer = createLineLayer();
    const result = renderChartLayer(layer);

    expect(result.width).toBe(640);
    expect(result.height).toBe(360);
    expect(result.data.length).toBe(640 * 360 * 4);
  });

  it('progressive line rendering increases visible pixels', () => {
    const layer = createLineLayer();
    const early = renderChartLayer(layer, { progress: 0.2 });
    const full = renderChartLayer(layer, { progress: 1 });

    const earlyVisible = countVisiblePixels(early.data);
    const fullVisible = countVisiblePixels(full.data);

    expect(fullVisible).toBeGreaterThan(earlyVisible);
  });
});
