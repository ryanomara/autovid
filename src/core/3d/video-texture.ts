import * as THREE from 'three';
import type { PixelBuffer } from '../engine/canvas.js';

export const createVideoTexture = (buffer: PixelBuffer): THREE.DataTexture => {
  const texture = new THREE.DataTexture(buffer.data, buffer.width, buffer.height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
};
