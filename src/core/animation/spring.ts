import type { SpringConfig } from '../../types/index.js';

export interface SpringOptions {
  frame: number;
  fps: number;
  config?: SpringConfig;
  from?: number;
  to?: number;
}

interface SpringState {
  stiffness: number;
  damping: number;
  mass: number;
  velocity: number;
}

const DEFAULT_SPRING: SpringState = {
  stiffness: 100,
  damping: 10,
  mass: 1,
  velocity: 0,
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const resolveSpringConfig = (config?: SpringConfig): SpringState => ({
  stiffness: config?.stiffness ?? DEFAULT_SPRING.stiffness,
  damping: config?.damping ?? DEFAULT_SPRING.damping,
  mass: config?.mass ?? DEFAULT_SPRING.mass,
  velocity: config?.velocity ?? DEFAULT_SPRING.velocity,
});

const calculateSpringProgress = (timeSeconds: number, config: SpringState): number => {
  const { stiffness, damping, mass, velocity } = config;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const c1 = -1;
    const c2 = (velocity + zeta * w0) / wd;
    const envelope = Math.exp(-zeta * w0 * timeSeconds);
    const oscillation = c1 * Math.cos(wd * timeSeconds) + c2 * Math.sin(wd * timeSeconds);
    return clamp01(1 + envelope * oscillation);
  }

  if (zeta === 1) {
    const envelope = Math.exp(-w0 * timeSeconds);
    const c1 = -1;
    const c2 = velocity + w0;
    return clamp01(1 + envelope * (c1 + c2 * timeSeconds));
  }

  const sqrtTerm = Math.sqrt(zeta * zeta - 1);
  const r1 = -w0 * (zeta - sqrtTerm);
  const r2 = -w0 * (zeta + sqrtTerm);
  const c2 = (velocity - r1) / (r2 - r1);
  const c1 = -1 - c2;
  return clamp01(1 + c1 * Math.exp(r1 * timeSeconds) + c2 * Math.exp(r2 * timeSeconds));
};

export const spring = ({ frame, fps, config, from = 0, to = 1 }: SpringOptions): number => {
  if (fps <= 0) {
    throw new Error('FPS must be greater than 0');
  }

  if (frame <= 0) {
    return from;
  }

  const normalizedFrame = frame / fps;
  const springConfig = resolveSpringConfig(config);
  const progress = calculateSpringProgress(normalizedFrame, springConfig);
  return from + (to - from) * progress;
};
