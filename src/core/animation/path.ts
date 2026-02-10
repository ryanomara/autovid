import type { Position, PathType } from '../../types/index.js';

export interface PathDefinition {
  points: Position[];
  type?: PathType;
  closed?: boolean;
}

export interface Path {
  getPointAt: (t: number) => Position;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

const lerpPosition = (from: Position, to: Position, t: number): Position => ({
  x: lerp(from.x, to.x, t),
  y: lerp(from.y, to.y, t),
});

const deCasteljau = (points: Position[], t: number): Position => {
  if (points.length === 1) {
    return points[0];
  }

  const nextPoints: Position[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    nextPoints.push(lerpPosition(points[i], points[i + 1], t));
  }
  return deCasteljau(nextPoints, t);
};

const catmullRomPoint = (
  p0: Position,
  p1: Position,
  p2: Position,
  p3: Position,
  t: number
): Position => {
  const t2 = t * t;
  const t3 = t2 * t;

  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

  return { x, y };
};

const getLinearPoint = (points: Position[], t: number, closed: boolean): Position => {
  const totalSegments = closed ? points.length : points.length - 1;
  const scaled = clamp01(t) * totalSegments;
  const segmentIndex = Math.min(Math.floor(scaled), totalSegments - 1);
  const localT = scaled - segmentIndex;
  const start = points[segmentIndex];
  const end = closed && segmentIndex === points.length - 1 ? points[0] : points[segmentIndex + 1];
  return lerpPosition(start, end, localT);
};

const getBezierPoint = (points: Position[], t: number): Position => {
  return deCasteljau(points, clamp01(t));
};

const getCatmullRomPoint = (points: Position[], t: number, closed: boolean): Position => {
  const count = points.length;
  const totalSegments = closed ? count : count - 1;
  const scaled = clamp01(t) * totalSegments;
  const segmentIndex = Math.min(Math.floor(scaled), totalSegments - 1);
  const localT = scaled - segmentIndex;

  const getPoint = (index: number): Position => {
    const normalized = (index + count) % count;
    return points[normalized];
  };

  const p1 = getPoint(segmentIndex);
  const p2 = getPoint(segmentIndex + 1);
  const p0 = closed ? getPoint(segmentIndex - 1) : points[Math.max(segmentIndex - 1, 0)];
  const p3 = closed ? getPoint(segmentIndex + 2) : points[Math.min(segmentIndex + 2, count - 1)];

  return catmullRomPoint(p0, p1, p2, p3, localT);
};

export const createPath = ({ points, type = 'linear', closed = false }: PathDefinition): Path => {
  if (points.length < 2) {
    throw new Error('Path requires at least 2 points');
  }

  return {
    getPointAt: (t: number) => {
      if (type === 'bezier') {
        return getBezierPoint(points, t);
      }

      if (type === 'catmull-rom') {
        return getCatmullRomPoint(points, t, closed);
      }

      return getLinearPoint(points, t, closed);
    },
  };
};
