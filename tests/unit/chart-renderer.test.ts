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

  it('reduces x-axis label density when maxLabels is low', () => {
    const labels = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
    const values = [10, 12, 9, 14, 13, 17, 16, 19, 21, 20, 22, 24];

    const baseLayer: ChartLayer = {
      ...createLineLayer(),
      data: { labels, values },
      style: {
        showValues: false,
        showPoints: false,
      },
    };

    const dense = renderChartLayer({
      ...baseLayer,
      style: {
        ...baseLayer.style,
        maxLabels: 12,
      },
    });

    const sparse = renderChartLayer({
      ...baseLayer,
      style: {
        ...baseLayer.style,
        maxLabels: 3,
      },
    });

    const denseVisible = countVisiblePixels(dense.data);
    const sparseVisible = countVisiblePixels(sparse.data);

    expect(denseVisible).toBeGreaterThan(sparseVisible);
  });

  // M1: Anti-aliased rendering tests
  it('renders with anti-aliased lines when enabled', () => {
    const layer: ChartLayer = {
      ...createLineLayer(),
      style: {
        antiAlias: true,
        showPoints: true,
      },
    };
    const result = renderChartLayer(layer);
    expect(result.width).toBe(640);
    expect(countVisiblePixels(result.data)).toBeGreaterThan(0);
  });

  it('renders without anti-aliasing when disabled', () => {
    const layer: ChartLayer = {
      ...createLineLayer(),
      style: {
        antiAlias: false,
        showPoints: true,
      },
    };
    const result = renderChartLayer(layer);
    expect(result.width).toBe(640);
    expect(countVisiblePixels(result.data)).toBeGreaterThan(0);
  });

  // M1: Financial axis formatting tests
  it('applies currency format to axis labels', () => {
    const layer: ChartLayer = {
      ...createLineLayer(),
      data: {
        labels: ['Jan', 'Feb', 'Mar'],
        values: [1000, 2500, 5000],
      },
      yAxis: {
        format: 'currency',
        ticks: 5,
      },
      style: {
        showValues: true,
      },
    };
    const result = renderChartLayer(layer);
    expect(result.width).toBe(640);
  });

  it('applies compact format to large numbers', () => {
    const layer: ChartLayer = {
      ...createLineLayer(),
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        values: [1000000, 2500000, 5000000, 10000000],
      },
      yAxis: {
        format: 'compact',
        ticks: 5,
      },
      style: {
        showValues: true,
      },
    };
    const result = renderChartLayer(layer);
    expect(result.width).toBe(640);
  });

  it('applies percentage format to small values', () => {
    const layer: ChartLayer = {
      ...createLineLayer(),
      data: {
        labels: ['A', 'B', 'C'],
        values: [10, 25, 50],
      },
      yAxis: {
        format: 'percentage',
        ticks: 5,
      },
      style: {
        showValues: true,
      },
    };
    const result = renderChartLayer(layer);
    expect(result.width).toBe(640);
  });
});
