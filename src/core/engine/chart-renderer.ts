import type { ChartLayer, Color } from '../../types/index.js';
import {
  createBuffer,
  drawRect,
  drawLine,
  drawCircle,
  blitBuffer,
  type PixelBuffer,
} from './canvas.js';
import { renderText } from './text-renderer.js';

interface ChartRenderOptions {
  progress?: number;
}

interface ChartPalette {
  axis: Color;
  grid: Color;
  label: Color;
  value: Color;
  line: Color;
  bar: Color;
}

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function makeRect(x: number, y: number, width: number, height: number): Rect {
  return {
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
  };
}

function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function intersectsAny(target: Rect, blockers: Rect[]): boolean {
  return blockers.some((blocker) => rectsIntersect(target, blocker));
}

const defaults: ChartPalette = {
  axis: { r: 98, g: 108, b: 142, a: 1 },
  grid: { r: 58, g: 68, b: 98, a: 0.7 },
  label: { r: 210, g: 220, b: 240, a: 1 },
  value: { r: 255, g: 255, b: 255, a: 1 },
  line: { r: 120, g: 196, b: 255, a: 1 },
  bar: { r: 120, g: 196, b: 255, a: 1 },
};

export function renderChartLayer(layer: ChartLayer, options: ChartRenderOptions = {}): PixelBuffer {
  const width = Math.max(1, Math.round(layer.dimensions?.width ?? 1280));
  const height = Math.max(1, Math.round(layer.dimensions?.height ?? 720));
  const buffer = createBuffer(width, height);

  const palette: ChartPalette = {
    axis: layer.style?.axisColor ?? defaults.axis,
    grid: layer.style?.gridColor ?? defaults.grid,
    label: layer.style?.labelColor ?? defaults.label,
    value: layer.style?.valueColor ?? defaults.value,
    line: layer.style?.lineColor ?? defaults.line,
    bar: layer.style?.barColor ?? defaults.bar,
  };

  const margin = { top: 84, right: 52, bottom: 92, left: 92 };
  const plot = {
    x: margin.left,
    y: margin.top,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const values = layer.data.values;
  const labels = layer.data.labels;
  if (values.length === 0 || labels.length === 0 || values.length !== labels.length) {
    return buffer;
  }

  const computedMin = Math.min(...values, 0);
  const computedMax = Math.max(...values, 1);
  const min = layer.yAxis?.min ?? computedMin;
  const max = layer.yAxis?.max ?? computedMax;
  const safeRange = max - min === 0 ? 1 : max - min;

  const ticks = Math.max(2, layer.yAxis?.ticks ?? 5);
  const showGrid = layer.style?.showGrid ?? true;
  const showPoints = layer.style?.showPoints ?? true;
  const showValues = layer.style?.showValues ?? true;
  const labelLimit = Math.max(2, layer.style?.maxLabels ?? 6);
  const valueDecimals = Math.max(0, layer.style?.valueDecimals ?? 2);
  const progress = Math.max(0, Math.min(1, options.progress ?? 1));

  for (let i = 0; i < ticks; i++) {
    const t = i / (ticks - 1);
    const y = Math.round(plot.y + t * plot.height);
    if (showGrid) {
      drawRect(buffer, { x: plot.x, y, width: plot.width, height: 1 }, palette.grid);
    }

    const value = max - t * safeRange;
    const labelBuffer = renderText({
      text: Number.isInteger(value) ? String(value) : value.toFixed(2),
      fontSize: 20,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      color: palette.label,
      textAlign: 'right',
    });
    blitBuffer(buffer, labelBuffer, { x: plot.x - labelBuffer.width - 10, y: y - 12 });
  }

  drawRect(buffer, { x: plot.x, y: plot.y, width: 2, height: plot.height }, palette.axis);
  drawRect(
    buffer,
    { x: plot.x, y: plot.y + plot.height, width: plot.width, height: 2 },
    palette.axis
  );

  if (layer.title) {
    const titleBuffer = renderText({
      text: layer.title,
      fontSize: 36,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      color: palette.value,
      textAlign: 'left',
    });
    blitBuffer(buffer, titleBuffer, { x: plot.x, y: 18 });
  }

  if (layer.chartType === 'line') {
    const lineWidth = Math.max(2, layer.style?.lineWidth ?? 4);
    const pointRadius = Math.max(2, layer.style?.pointRadius ?? 5);

    const points = values.map((value, i) => {
      const x =
        plot.x +
        (values.length === 1
          ? plot.width / 2
          : (i / (values.length - 1)) * Math.max(1, plot.width));
      const norm = (value - min) / safeRange;
      const y = plot.y + (1 - norm) * plot.height;
      return { x, y, value, label: labels[i] };
    });

    const segmentCount = Math.max(1, points.length - 1);
    const animatedSegments = progress * segmentCount;
    const fullSegments = Math.floor(animatedSegments);
    const partialProgress = animatedSegments - fullSegments;

    for (let i = 0; i < fullSegments; i++) {
      drawLine(buffer, points[i], points[i + 1], palette.line, lineWidth);
    }

    if (fullSegments < segmentCount && partialProgress > 0) {
      const start = points[fullSegments];
      const end = points[fullSegments + 1];
      const partialPoint = {
        x: start.x + (end.x - start.x) * partialProgress,
        y: start.y + (end.y - start.y) * partialProgress,
      };
      drawLine(buffer, start, partialPoint, palette.line, lineWidth);
    }

    const visiblePointCount = Math.max(1, Math.ceil(progress * points.length));
    const visiblePoints = points.slice(0, visiblePointCount);
    const labelStride = Math.max(1, Math.ceil(points.length / labelLimit));
    const occupiedRects: Rect[] = [];

    for (const point of visiblePoints) {
      occupiedRects.push(
        makeRect(
          Math.round(point.x - pointRadius - 2),
          Math.round(point.y - pointRadius - 2),
          pointRadius * 2 + 4,
          pointRadius * 2 + 4
        )
      );
    }

    for (let index = 0; index < visiblePoints.length; index++) {
      const point = visiblePoints[index];
      if (showPoints) {
        drawCircle(buffer, point, pointRadius, palette.line);
      }

      const shouldDrawLabel =
        index === 0 || index === visiblePoints.length - 1 || index % labelStride === 0;

      if (shouldDrawLabel) {
        const labelBuffer = renderText({
          text: point.label,
          fontSize: 20,
          fontFamily: 'Arial',
          color: palette.label,
          textAlign: 'center',
        });

        const labelX = Math.round(point.x - labelBuffer.width / 2);
        const labelY = plot.y + plot.height + 20;
        const labelRect = makeRect(labelX, labelY, labelBuffer.width, labelBuffer.height);
        if (!intersectsAny(labelRect, occupiedRects)) {
          blitBuffer(buffer, labelBuffer, { x: labelX, y: labelY });
          occupiedRects.push(labelRect);
        }
      }

      if (showValues) {
        const valueBuffer = renderText({
          text: Number.isInteger(point.value)
            ? String(point.value)
            : point.value.toFixed(valueDecimals),
          fontSize: 18,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          color: palette.value,
          textAlign: 'center',
        });

        const valueX = Math.round(point.x - valueBuffer.width / 2);
        const preferredValueY = Math.round(point.y - valueBuffer.height - 10);
        const fallbackValueY = Math.round(point.y + pointRadius + 8);

        const preferredRect = makeRect(
          valueX,
          preferredValueY,
          valueBuffer.width,
          valueBuffer.height
        );
        const fallbackRect = makeRect(
          valueX,
          fallbackValueY,
          valueBuffer.width,
          valueBuffer.height
        );

        if (!intersectsAny(preferredRect, occupiedRects)) {
          blitBuffer(buffer, valueBuffer, { x: valueX, y: preferredValueY });
          occupiedRects.push(preferredRect);
        } else if (!intersectsAny(fallbackRect, occupiedRects)) {
          blitBuffer(buffer, valueBuffer, { x: valueX, y: fallbackValueY });
          occupiedRects.push(fallbackRect);
        }
      }
    }
  } else {
    const barCount = values.length;
    const slot = plot.width / Math.max(1, barCount);
    const barWidth = Math.max(24, Math.round(slot * 0.62));

    for (let i = 0; i < barCount; i++) {
      const value = values[i];
      const norm = (value - min) / safeRange;
      const perBarProgress = Math.max(0, Math.min(1, progress * barCount - i));
      const h = Math.max(2, Math.round(norm * plot.height * perBarProgress));
      const x = Math.round(plot.x + i * slot + (slot - barWidth) / 2);
      const y = Math.round(plot.y + plot.height - h);

      drawRect(buffer, { x, y, width: barWidth, height: h }, palette.bar);

      const labelBuffer = renderText({
        text: labels[i],
        fontSize: 20,
        fontFamily: 'Arial',
        color: palette.label,
        textAlign: 'center',
      });
      blitBuffer(buffer, labelBuffer, {
        x: Math.round(x + barWidth / 2 - labelBuffer.width / 2),
        y: plot.y + plot.height + 20,
      });

      if (showValues && perBarProgress > 0.55) {
        const valueBuffer = renderText({
          text: Number.isInteger(value) ? String(value) : value.toFixed(valueDecimals),
          fontSize: 18,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          color: palette.value,
          textAlign: 'center',
        });
        blitBuffer(buffer, valueBuffer, {
          x: Math.round(x + barWidth / 2 - valueBuffer.width / 2),
          y: y - valueBuffer.height - 8,
        });
      }
    }
  }

  return buffer;
}
