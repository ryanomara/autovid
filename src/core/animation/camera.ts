import type { CameraConfig, CameraKeyframes, Position, Timestamp } from '../../types/index.js';
import { getAnimationValueAtTime, interpolate, interpolatePosition } from './easing.js';

export interface CameraState {
  position: Position;
  zoom: number;
  rotation: number;
}

const defaultCameraState = (width: number, height: number): CameraState => ({
  position: { x: width / 2, y: height / 2 },
  zoom: 1,
  rotation: 0,
});

const resolveValue = <T>(
  keyframes: CameraKeyframes<T> | undefined,
  time: Timestamp,
  fallback: T,
  interpolateFn: (from: T, to: T, progress: number) => T
): T => {
  if (!keyframes || keyframes.length === 0) {
    return fallback;
  }

  return getAnimationValueAtTime(keyframes, time, (from, to, progress) =>
    interpolateFn(from, to, progress)
  );
};

export const getCameraStateAtTime = (
  camera: CameraConfig | undefined,
  time: Timestamp,
  width: number,
  height: number
): CameraState => {
  const base = defaultCameraState(width, height);

  if (!camera) {
    return base;
  }

  const position = resolveValue(
    camera.animations?.position,
    time,
    camera.position ?? base.position,
    (from, to, progress) => interpolatePosition(from, to, progress)
  );

  const zoom = resolveValue(
    camera.animations?.zoom,
    time,
    camera.zoom ?? base.zoom,
    (from, to, progress) => interpolate(from, to, progress)
  );

  const rotation = resolveValue(
    camera.animations?.rotation,
    time,
    camera.rotation ?? base.rotation,
    (from, to, progress) => interpolate(from, to, progress)
  );

  return { position, zoom, rotation };
};
