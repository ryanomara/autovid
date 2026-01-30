import type { EasingType } from '../../types/index.js';

/**
 * Easing function type
 */
export type EasingFunction = (t: number) => number;

/**
 * Library of easing functions
 * Input: t (0-1), Output: eased value (0-1)
 */
export const easingFunctions: Record<EasingType, EasingFunction> = {
  linear: (t) => t,

  // Quadratic
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Cubic
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Quartic
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - --t * t * t * t,
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),

  // Elastic
  easeInElastic: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
  easeOutElastic: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
  easeInOutElastic: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    t *= 2;
    if (t < 1) {
      return -0.5 * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
    }
    return 0.5 * Math.pow(2, -10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI) + 1;
  },

  // Bounce
  easeInBounce: (t) => 1 - easingFunctions.easeOutBounce(1 - t),
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeInOutBounce: (t) =>
    t < 0.5
      ? easingFunctions.easeInBounce(t * 2) * 0.5
      : easingFunctions.easeOutBounce(t * 2 - 1) * 0.5 + 0.5,
};

/**
 * Get easing function by name
 */
export function getEasingFunction(type: EasingType = 'linear'): EasingFunction {
  return easingFunctions[type] || easingFunctions.linear;
}

/**
 * Interpolate between two values with easing
 */
export function interpolate(
  from: number,
  to: number,
  progress: number,
  easing: EasingType = 'linear'
): number {
  const easingFn = getEasingFunction(easing);
  const t = Math.max(0, Math.min(1, progress));
  return from + (to - from) * easingFn(t);
}

/**
 * Interpolate color values
 */
export function interpolateColor(
  from: { r: number; g: number; b: number; a: number },
  to: { r: number; g: number; b: number; a: number },
  progress: number,
  easing: EasingType = 'linear'
): { r: number; g: number; b: number; a: number } {
  return {
    r: Math.round(interpolate(from.r, to.r, progress, easing)),
    g: Math.round(interpolate(from.g, to.g, progress, easing)),
    b: Math.round(interpolate(from.b, to.b, progress, easing)),
    a: interpolate(from.a, to.a, progress, easing),
  };
}

/**
 * Interpolate position values
 */
export function interpolatePosition(
  from: { x: number; y: number },
  to: { x: number; y: number },
  progress: number,
  easing: EasingType = 'linear'
): { x: number; y: number } {
  return {
    x: interpolate(from.x, to.x, progress, easing),
    y: interpolate(from.y, to.y, progress, easing),
  };
}

/**
 * Calculate animation value at specific time
 */
export function getAnimationValueAtTime<T>(
  keyframes: Array<{ time: number; value: T; easing?: EasingType }>,
  currentTime: number,
  interpolateFn: (from: T, to: T, progress: number, easing: EasingType) => T
): T {
  if (keyframes.length === 0) {
    throw new Error('No keyframes provided');
  }

  if (keyframes.length === 1 || currentTime <= keyframes[0].time) {
    return keyframes[0].value;
  }

  if (currentTime >= keyframes[keyframes.length - 1].time) {
    return keyframes[keyframes.length - 1].value;
  }

  // Find surrounding keyframes
  let fromIndex = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (currentTime >= keyframes[i].time && currentTime <= keyframes[i + 1].time) {
      fromIndex = i;
      break;
    }
  }

  const fromFrame = keyframes[fromIndex];
  const toFrame = keyframes[fromIndex + 1];

  const duration = toFrame.time - fromFrame.time;
  const elapsed = currentTime - fromFrame.time;
  const progress = duration > 0 ? elapsed / duration : 1;

  return interpolateFn(
    fromFrame.value,
    toFrame.value,
    progress,
    fromFrame.easing || 'linear'
  );
}
