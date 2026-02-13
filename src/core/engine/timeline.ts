import type {
  Animation,
  Keyframe,
  EasingType,
  Color,
  Position,
  Layer,
  BaseLayer,
  Timestamp,
} from '../../types/index.js';
import {
  interpolate,
  interpolateColor,
  interpolatePosition,
  getAnimationValueAtTime,
} from '../animation/easing.js';

export interface AnimatedProperties {
  position: Position;
  scale: { x: number; y: number };
  rotation: number;
  opacity: number;
  [key: string]: unknown;
}

export interface TimelineConfig {
  fps: number;
  duration: Timestamp;
}

export class Timeline {
  private fps: number;
  private duration: Timestamp;
  private totalFrames: number;

  constructor(config: TimelineConfig) {
    this.fps = config.fps;
    this.duration = config.duration;
    this.totalFrames = Math.ceil((config.duration / 1000) * config.fps);
  }

  frameToTime(frame: number): Timestamp {
    return (frame / this.fps) * 1000;
  }

  timeToFrame(time: Timestamp): number {
    return Math.floor((time / 1000) * this.fps);
  }

  getTotalFrames(): number {
    return this.totalFrames;
  }

  getDuration(): Timestamp {
    return this.duration;
  }

  getFPS(): number {
    return this.fps;
  }

  isLayerActiveAtTime(layer: BaseLayer, time: Timestamp): boolean {
    return time >= layer.startTime && time < layer.endTime;
  }

  isLayerActiveAtFrame(layer: BaseLayer, frame: number): boolean {
    const time = this.frameToTime(frame);
    return this.isLayerActiveAtTime(layer, time);
  }

  getAnimatedPropertiesAtTime(layer: Layer, time: Timestamp): AnimatedProperties {
    const baseProps: AnimatedProperties = {
      position: layer.position ? { ...layer.position } : { x: 0, y: 0 },
      scale: layer.scale ? { ...layer.scale } : { x: 1, y: 1 },
      rotation: layer.rotation ?? 0,
      opacity: layer.opacity ?? 1,
    };

    if (!layer.animations || layer.animations.length === 0) {
      return baseProps;
    }

    for (const animation of layer.animations) {
      const value = this.getPropertyValueAtTime(animation, time, baseProps);
      if (value !== undefined) {
        this.setNestedProperty(baseProps, animation.property, value);
      }
    }

    return baseProps;
  }

  getAnimatedPropertiesAtFrame(layer: Layer, frame: number): AnimatedProperties {
    return this.getAnimatedPropertiesAtTime(layer, this.frameToTime(frame));
  }

  private getPropertyValueAtTime<T>(
    animation: Animation<T>,
    time: Timestamp,
    baseProps: AnimatedProperties
  ): T | undefined {
    if (!animation.keyframes || animation.keyframes.length === 0) {
      return undefined;
    }

    const keyframes = animation.keyframes;

    if (time <= keyframes[0].time) {
      return keyframes[0].value;
    }

    if (time >= keyframes[keyframes.length - 1].time) {
      return keyframes[keyframes.length - 1].value;
    }

    let fromIndex = 0;
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        fromIndex = i;
        break;
      }
    }

    const fromFrame = keyframes[fromIndex];
    const toFrame = keyframes[fromIndex + 1];
    const duration = toFrame.time - fromFrame.time;
    const elapsed = time - fromFrame.time;
    const progress = duration > 0 ? elapsed / duration : 1;

    return this.interpolateValue(
      fromFrame.value,
      toFrame.value,
      progress,
      fromFrame.easing || 'linear'
    );
  }

  private interpolateValue<T>(from: T, to: T, progress: number, easing: EasingType): T {
    if (typeof from === 'number' && typeof to === 'number') {
      return interpolate(from, to, progress, easing) as T;
    }

    if (this.isColor(from) && this.isColor(to)) {
      return interpolateColor(from, to, progress, easing) as T;
    }

    if (this.isPosition(from) && this.isPosition(to)) {
      return interpolatePosition(from, to, progress, easing) as T;
    }

    if (this.isScale(from) && this.isScale(to)) {
      return {
        x: interpolate(from.x, to.x, progress, easing),
        y: interpolate(from.y, to.y, progress, easing),
      } as T;
    }

    return progress < 0.5 ? from : to;
  }

  private isColor(value: unknown): value is Color {
    return (
      typeof value === 'object' &&
      value !== null &&
      'r' in value &&
      'g' in value &&
      'b' in value &&
      'a' in value
    );
  }

  private isPosition(value: unknown): value is Position {
    return (
      typeof value === 'object' && value !== null && 'x' in value && 'y' in value && !('r' in value)
    );
  }

  private isScale(value: unknown): value is { x: number; y: number } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'x' in value &&
      'y' in value &&
      typeof (value as { x: number }).x === 'number' &&
      typeof (value as { y: number }).y === 'number'
    );
  }

  private setNestedProperty(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
  }

  getActiveLayersAtTime<T extends BaseLayer>(layers: T[], time: Timestamp): T[] {
    return layers.filter((layer) => this.isLayerActiveAtTime(layer, time));
  }

  getActiveLayersAtFrame<T extends BaseLayer>(layers: T[], frame: number): T[] {
    return this.getActiveLayersAtTime(layers, this.frameToTime(frame));
  }

  getFrameRange(
    startTime: Timestamp,
    endTime: Timestamp
  ): { startFrame: number; endFrame: number } {
    return {
      startFrame: this.timeToFrame(startTime),
      endFrame: this.timeToFrame(endTime),
    };
  }

  *iterateFrames(): Generator<{
    frame: number;
    time: Timestamp;
    progress: number;
  }> {
    for (let frame = 0; frame < this.totalFrames; frame++) {
      yield {
        frame,
        time: this.frameToTime(frame),
        progress: frame / (this.totalFrames - 1 || 1),
      };
    }
  }

  calculateTransitionProgress(
    time: Timestamp,
    transitionStart: Timestamp,
    transitionDuration: number,
    easing: EasingType = 'linear'
  ): number {
    if (time < transitionStart) return 0;
    if (time >= transitionStart + transitionDuration) return 1;

    const progress = (time - transitionStart) / transitionDuration;
    return interpolate(0, 1, progress, easing);
  }
}

export function createTimeline(fps: number, duration: Timestamp): Timeline {
  return new Timeline({ fps, duration });
}

export function calculateKeyframeValue<T>(
  keyframes: Keyframe<T>[],
  time: Timestamp,
  interpolateFn: (from: T, to: T, progress: number, easing: EasingType) => T
): T {
  return getAnimationValueAtTime(keyframes, time, interpolateFn);
}
