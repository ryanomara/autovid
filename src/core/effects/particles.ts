import type { PixelBuffer } from '../engine/canvas.js';

export type ParticlePreset = 'snow' | 'confetti' | 'fire' | 'smoke' | 'sparks';

export interface ParticleSystemConfig {
  preset: ParticlePreset;
  count: number;
  timeMs?: number;
  seed?: number;
  speed?: number;
  size?: number;
  wind?: number;
  opacity?: number;
  emitter?: ParticleEmitter;
  edgeFallbackRatio?: number;
  birthRate?: number;
  lifetime?: number;
  velocity?: number;
  drag?: number;
  turbulence?: number;
  spread?: number;
  inheritVelocity?: number;
  gravityX?: number;
  gravityY?: number;
  curlScale?: number;
  curlStrength?: number;
  simulationSteps?: number;
  colorOverLife?: {
    start: { r: number; g: number; b: number };
    end: { r: number; g: number; b: number };
  };
  sizeOverLife?: { start: number; end: number };
  alphaOverLife?: { start: number; end: number };
}

export interface ParticleEmitter {
  x: number;
  y: number;
  width: number;
  height: number;
  edgePoints?: Array<{ x: number; y: number }>;
  flow?: 'edge' | 'trail';
  directionX?: number;
  directionY?: number;
  trailLength?: number;
  trailSpread?: number;
}

export const generateParticles = (
  buffer: PixelBuffer,
  config: ParticleSystemConfig
): PixelBuffer => {
  const result: PixelBuffer = {
    width: buffer.width,
    height: buffer.height,
    data: new Uint8ClampedArray(buffer.data),
  };

  if ((config.timeMs ?? 0) <= 0) {
    return result;
  }

  const count = Math.max(0, Math.min(config.count, 4000));
  const timeMs = config.timeMs ?? 0;
  const timeS = timeMs / 1000;
  const speed = Math.max(0.05, config.speed ?? 1);
  const wind = config.wind ?? 0;
  const sizeMul = Math.max(0.2, config.size ?? 1);
  const opacity = Math.max(0, Math.min(1, config.opacity ?? 1));
  const seed = (config.seed ?? 1337) >>> 0;
  const emitter = normalizeEmitter(config.emitter, result.width, result.height);
  const edgeFallbackRatio = Math.max(0, Math.min(1, config.edgeFallbackRatio ?? 0));
  const birthRate = Math.max(1, config.birthRate ?? count);
  const lifetime = Math.max(0.12, config.lifetime ?? 1.35);
  const velocity = Math.max(10, config.velocity ?? 220);
  const drag = Math.max(0, config.drag ?? 1.1);
  const turbulence = Math.max(0, config.turbulence ?? 26);
  const spread = Math.max(0, config.spread ?? 95);
  const inheritVelocity = Math.max(0, Math.min(1, config.inheritVelocity ?? 0.22));
  const gravityX = config.gravityX ?? 0;
  const gravityY = config.gravityY ?? 35;
  const curlScale = Math.max(0.0001, config.curlScale ?? 0.01);
  const curlStrength = Math.max(0, config.curlStrength ?? 0);
  const simulationSteps = Math.max(2, Math.min(28, Math.round(config.simulationSteps ?? 10)));

  for (let i = 0; i < count; i += 1) {
    const rng = createRng(seed ^ ((i + 1) * 2654435761));
    const life = lifetime * (0.65 + rng() * 0.9);
    const phaseOffset = emitter ? rng() * Math.min(life, 0.45) : rng() * life;
    const normalizedIndex = count > 1 ? i / (count - 1) : 0;
    const spawnOffset = normalizedIndex * (count / birthRate);
    const phase = ((timeS * speed - spawnOffset + phaseOffset + life * 16) % life) / life;
    const origin = pickEmitterPoint(emitter, rng, result.width, result.height, edgeFallbackRatio);
    if (!origin) {
      continue;
    }
    const baseX = origin.x;
    const baseY = origin.y;
    const sway = Math.sin((phase + rng()) * Math.PI * 2);

    const sample = samplePreset(config.preset, {
      width: result.width,
      height: result.height,
      emitter,
      phase,
      baseX,
      baseY,
      sway,
      rng,
      timeS,
      wind,
      sizeMul,
      opacity,
      velocity,
      drag,
      turbulence,
      spread,
      inheritVelocity,
      gravityX,
      gravityY,
      curlScale,
      curlStrength,
      simulationSteps,
      colorOverLife: config.colorOverLife,
      sizeOverLife: config.sizeOverLife,
      alphaOverLife: config.alphaOverLife,
      lifeSec: life,
      particleIndex: i,
    });

    const tuned = applyLifeRamps(sample, phase, config);
    drawParticle(result, tuned.x, tuned.y, tuned.radius, tuned.color, tuned.alpha);
  }

  return result;
};

interface ParticleSampleContext {
  width: number;
  height: number;
  emitter: ParticleEmitter | null;
  phase: number;
  baseX: number;
  baseY: number;
  sway: number;
  rng: () => number;
  timeS: number;
  wind: number;
  sizeMul: number;
  opacity: number;
  velocity: number;
  drag: number;
  turbulence: number;
  spread: number;
  inheritVelocity: number;
  gravityX: number;
  gravityY: number;
  curlScale: number;
  curlStrength: number;
  simulationSteps: number;
  colorOverLife?: {
    start: { r: number; g: number; b: number };
    end: { r: number; g: number; b: number };
  };
  sizeOverLife?: { start: number; end: number };
  alphaOverLife?: { start: number; end: number };
  lifeSec: number;
  particleIndex: number;
}

interface ParticleSample {
  x: number;
  y: number;
  radius: number;
  color: { r: number; g: number; b: number };
  alpha: number;
}

function samplePreset(preset: ParticlePreset, ctx: ParticleSampleContext): ParticleSample {
  if (
    ctx.emitter?.flow === 'trail' &&
    typeof ctx.emitter.directionX === 'number' &&
    typeof ctx.emitter.directionY === 'number'
  ) {
    const pathPoints = ctx.emitter.edgePoints;
    if (pathPoints && pathPoints.length > 1) {
      const tipBias = 1 - Math.pow(ctx.rng(), 2.6);
      const index = Math.max(
        0,
        Math.min(pathPoints.length - 1, Math.floor(tipBias * pathPoints.length))
      );
      const anchor = pathPoints[index] ?? pathPoints[pathPoints.length - 1];
      const prev = pathPoints[Math.max(0, index - 1)] ?? anchor;
      const next = pathPoints[Math.min(pathPoints.length - 1, index + 1)] ?? anchor;
      const tangentX = next.x - prev.x;
      const tangentY = next.y - prev.y;
      const tangentLength = Math.hypot(tangentX, tangentY) || 1;
      return simulateTrailParticle(
        anchor,
        { x: tangentX / tangentLength, y: tangentY / tangentLength },
        ctx,
        index / pathPoints.length
      );
    }

    const directionLength = Math.hypot(ctx.emitter.directionX, ctx.emitter.directionY) || 1;
    return simulateTrailParticle(
      { x: ctx.baseX, y: ctx.baseY },
      { x: ctx.emitter.directionX / directionLength, y: ctx.emitter.directionY / directionLength },
      ctx,
      0
    );
  }

  const xProject = (value: number): number => {
    if (ctx.emitter) {
      return clamp(value, 0, ctx.width - 1);
    }
    return wrap(value, ctx.width);
  };

  if (preset === 'snow') {
    const fallRange = ctx.emitter
      ? Math.max(40, Math.min(ctx.height - ctx.emitter.y, ctx.emitter.height * 4 + 140))
      : ctx.height + 24;
    const drift = ctx.sway * (5 + ctx.rng() * 7);
    return {
      x: xProject(ctx.baseX + drift + ctx.wind * 18 * ctx.timeS),
      y: clamp(ctx.baseY + ctx.phase * fallRange - 12, -12, ctx.height + 12),
      radius: Math.max(1, Math.round((1 + ctx.rng() * 2.2) * ctx.sizeMul)),
      color: { r: 236, g: 245, b: 255 },
      alpha: Math.round((120 + ctx.rng() * 110) * ctx.opacity),
    };
  }

  if (preset === 'fire') {
    const originY = ctx.baseY;
    const riseRange = ctx.emitter
      ? Math.max(28, Math.min(ctx.height, ctx.emitter.height * 3 + 120))
      : ctx.height * (0.7 + ctx.rng() * 0.25);
    const y = originY - ctx.phase * riseRange;
    const heat = 1 - ctx.phase;
    return {
      x: xProject(ctx.baseX + ctx.sway * 10 + ctx.wind * 12 * ctx.timeS),
      y,
      radius: Math.max(1, Math.round((1 + heat * 3) * ctx.sizeMul)),
      color: {
        r: 255,
        g: Math.round(120 + 110 * heat),
        b: Math.round(20 + 30 * (1 - heat)),
      },
      alpha: Math.round((80 + 150 * heat) * ctx.opacity),
    };
  }

  if (preset === 'smoke') {
    const originY = ctx.baseY;
    const lift =
      ctx.phase *
      (ctx.emitter
        ? Math.max(30, Math.min(ctx.height, ctx.emitter.height * 4 + 120))
        : ctx.height * 0.65);
    const gray = Math.round(110 + ctx.rng() * 80);
    return {
      x: xProject(ctx.baseX + ctx.sway * 14 + ctx.wind * 16 * ctx.timeS),
      y: originY - lift,
      radius: Math.max(1, Math.round((2 + ctx.rng() * 4) * ctx.sizeMul)),
      color: { r: gray, g: gray, b: gray },
      alpha: Math.round((35 + 90 * (1 - ctx.phase)) * ctx.opacity),
    };
  }

  if (preset === 'sparks') {
    const originY = ctx.baseY;
    const rise =
      ctx.phase *
      (ctx.emitter
        ? Math.max(24, Math.min(ctx.height, ctx.emitter.height * 4 + 140))
        : ctx.height * 0.85);
    return {
      x: xProject(ctx.baseX + ctx.sway * 20 + ctx.wind * 24 * ctx.timeS),
      y: originY - rise,
      radius: Math.max(1, Math.round((0.8 + ctx.rng() * 1.6) * ctx.sizeMul)),
      color: { r: 255, g: Math.round(170 + ctx.rng() * 70), b: 40 },
      alpha: Math.round((90 + 140 * (1 - ctx.phase)) * ctx.opacity),
    };
  }

  const palette = [
    { r: 255, g: 89, b: 94 },
    { r: 255, g: 202, b: 58 },
    { r: 138, g: 201, b: 38 },
    { r: 25, g: 130, b: 196 },
    { r: 106, g: 76, b: 147 },
  ];
  const color = palette[Math.floor(ctx.rng() * palette.length)] ?? palette[0];
  const fallRange = ctx.emitter
    ? Math.max(38, Math.min(ctx.height - ctx.emitter.y, ctx.emitter.height * 4 + 150))
    : ctx.height + 18;
  return {
    x: xProject(ctx.baseX + ctx.sway * 28 + ctx.wind * 22 * ctx.timeS),
    y: clamp(ctx.baseY + ctx.phase * fallRange - 9, -9, ctx.height + 9),
    radius: Math.max(1, Math.round((1.4 + ctx.rng() * 2.4) * ctx.sizeMul)),
    color,
    alpha: Math.round((110 + ctx.rng() * 130) * ctx.opacity),
  };
}

function normalizeEmitter(
  emitter: ParticleEmitter | undefined,
  width: number,
  height: number
): ParticleEmitter | null {
  if (!emitter) {
    return null;
  }

  const x = clamp(emitter.x, 0, Math.max(0, width - 1));
  const y = clamp(emitter.y, 0, Math.max(0, height - 1));
  const maxW = Math.max(1, width - x);
  const maxH = Math.max(1, height - y);
  const safeW = clamp(emitter.width, 1, maxW);
  const safeH = clamp(emitter.height, 1, maxH);

  const edgePoints = Array.isArray(emitter.edgePoints)
    ? emitter.edgePoints
        .map((point) => ({
          x: clamp(point.x, x, x + safeW - 1),
          y: clamp(point.y, y, y + safeH - 1),
        }))
        .slice(0, 5000)
    : undefined;

  return {
    x,
    y,
    width: safeW,
    height: safeH,
    edgePoints,
    flow: emitter.flow,
    directionX: emitter.directionX,
    directionY: emitter.directionY,
    trailLength: emitter.trailLength,
    trailSpread: emitter.trailSpread,
  };
}

function pickEmitterPoint(
  emitter: ParticleEmitter | null,
  rng: () => number,
  width: number,
  height: number,
  edgeFallbackRatio: number
): { x: number; y: number } | null {
  if (!emitter) {
    return { x: rng() * width, y: rng() * height };
  }

  const edgePoints = emitter.edgePoints;
  if (edgePoints && edgePoints.length > 0 && rng() >= edgeFallbackRatio) {
    const point = edgePoints[Math.floor(rng() * edgePoints.length)] ?? edgePoints[0];
    const jitter = edgeFallbackRatio === 0 ? 0 : 3;
    return {
      x: clamp(point.x + (rng() - 0.5) * jitter, emitter.x, emitter.x + emitter.width - 1),
      y: clamp(point.y + (rng() - 0.5) * jitter, emitter.y, emitter.y + emitter.height - 1),
    };
  }

  if (edgePoints && edgePoints.length === 0) {
    return null;
  }

  return {
    x: emitter.x + rng() * emitter.width,
    y: emitter.y + rng() * emitter.height,
  };
}

function simulateTrailParticle(
  anchor: { x: number; y: number },
  direction: { x: number; y: number },
  ctx: ParticleSampleContext,
  phaseBias: number
): ParticleSample {
  const t = ctx.phase;
  const age = t * ctx.lifeSec;
  const steps = Math.max(2, Math.min(ctx.simulationSteps, Math.ceil(4 + age * 10)));
  const dt = age > 0 ? age / steps : 0;
  const normal = { x: -direction.y, y: direction.x };

  const spreadJitter = (ctx.rng() - 0.5) * ctx.spread;
  let vx =
    -direction.x * ctx.velocity * (1 - ctx.inheritVelocity) +
    direction.x * ctx.velocity * ctx.inheritVelocity * 0.2 +
    normal.x * spreadJitter;
  let vy =
    -direction.y * ctx.velocity * (1 - ctx.inheritVelocity) +
    direction.y * ctx.velocity * ctx.inheritVelocity * 0.2 +
    normal.y * spreadJitter;

  let px = anchor.x;
  let py = anchor.y;

  for (let step = 0; step < steps; step += 1) {
    const sampleTime = ctx.timeS - age + dt * step;
    const curl = sampleCurlNoise(
      px * ctx.curlScale + phaseBias * 3.17,
      py * ctx.curlScale + phaseBias * 1.29,
      sampleTime,
      ctx.particleIndex
    );

    const ax = ctx.gravityX + ctx.wind * 18 + curl.x * ctx.curlStrength;
    const ay = ctx.gravityY + curl.y * ctx.curlStrength;
    vx += ax * dt;
    vy += ay * dt;

    const damping = Math.exp(-ctx.drag * dt);
    vx *= damping;
    vy *= damping;

    px += vx * dt;
    py += vy * dt;
  }

  return {
    x: clamp(px, 0, ctx.width - 1),
    y: clamp(py, 0, ctx.height - 1),
    radius: Math.max(1, Math.round((0.7 + Math.pow(1 - t, 0.65) * 1.7) * ctx.sizeMul)),
    color: { r: 255, g: Math.round(165 + (1 - t) * 70), b: 58 },
    alpha: Math.round((28 + 220 * Math.pow(1 - t, 1.25)) * ctx.opacity),
  };
}

function sampleCurlNoise(x: number, y: number, t: number, seed: number): { x: number; y: number } {
  const eps = 0.07;
  const dnDy = sampleNoise(x, y + eps, t, seed) - sampleNoise(x, y - eps, t, seed);
  const dnDx = sampleNoise(x + eps, y, t, seed) - sampleNoise(x - eps, y, t, seed);
  return {
    x: dnDy / (2 * eps),
    y: -dnDx / (2 * eps),
  };
}

function sampleNoise(x: number, y: number, t: number, seed: number): number {
  const s1 = Math.sin((x + seed * 0.017) * 2.13 + t * 1.17);
  const s2 = Math.sin((y + seed * 0.031) * 1.73 - t * 0.91);
  const s3 = Math.sin((x * 0.37 + y * 0.41 + seed * 0.013) * 3.11 + t * 0.57);
  return (s1 + s2 + s3) / 3;
}

function applyLifeRamps(
  sample: ParticleSample,
  t: number,
  config: ParticleSystemConfig
): ParticleSample {
  const colorRamp = config.colorOverLife;
  const sizeRamp = config.sizeOverLife;
  const alphaRamp = config.alphaOverLife;

  const color = colorRamp
    ? {
        r: Math.round(lerp(colorRamp.start.r, colorRamp.end.r, t)),
        g: Math.round(lerp(colorRamp.start.g, colorRamp.end.g, t)),
        b: Math.round(lerp(colorRamp.start.b, colorRamp.end.b, t)),
      }
    : sample.color;

  const radiusMultiplier = sizeRamp ? lerp(sizeRamp.start, sizeRamp.end, t) : 1;
  const alphaMultiplier = alphaRamp ? lerp(alphaRamp.start, alphaRamp.end, t) : 1;

  return {
    x: sample.x,
    y: sample.y,
    radius: Math.max(1, Math.round(sample.radius * Math.max(0, radiusMultiplier))),
    color,
    alpha: Math.max(0, Math.min(255, Math.round(sample.alpha * Math.max(0, alphaMultiplier)))),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function drawParticle(
  buffer: PixelBuffer,
  x: number,
  y: number,
  radius: number,
  color: { r: number; g: number; b: number },
  alpha: number
): void {
  const r = Math.max(1, radius);
  const minX = Math.max(0, Math.floor(x - r));
  const maxX = Math.min(buffer.width - 1, Math.ceil(x + r));
  const minY = Math.max(0, Math.floor(y - r));
  const maxY = Math.min(buffer.height - 1, Math.ceil(y + r));

  for (let py = minY; py <= maxY; py += 1) {
    for (let px = minX; px <= maxX; px += 1) {
      const dx = px + 0.5 - x;
      const dy = py + 0.5 - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > r) {
        continue;
      }

      const falloff = 1 - dist / r;
      const localAlpha = Math.round(alpha * (0.35 + falloff * 0.65));
      blendPixel(buffer, px, py, color, localAlpha);
    }
  }
}

function blendPixel(
  buffer: PixelBuffer,
  x: number,
  y: number,
  color: { r: number; g: number; b: number },
  alpha: number
): void {
  if (alpha <= 0) {
    return;
  }

  const idx = (y * buffer.width + x) * 4;
  const srcA = Math.max(0, Math.min(1, alpha / 255));
  const dstA = buffer.data[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) {
    return;
  }

  const dstR = buffer.data[idx] / 255;
  const dstG = buffer.data[idx + 1] / 255;
  const dstB = buffer.data[idx + 2] / 255;
  const srcR = color.r / 255;
  const srcG = color.g / 255;
  const srcB = color.b / 255;

  const outR = (srcR * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (srcG * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (srcB * srcA + dstB * dstA * (1 - srcA)) / outA;

  buffer.data[idx] = Math.round(outR * 255);
  buffer.data[idx + 1] = Math.round(outG * 255);
  buffer.data[idx + 2] = Math.round(outB * 255);
  buffer.data[idx + 3] = Math.round(outA * 255);
}

function wrap(value: number, max: number): number {
  if (max <= 0) {
    return 0;
  }
  const wrapped = value % max;
  return wrapped < 0 ? wrapped + max : wrapped;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
