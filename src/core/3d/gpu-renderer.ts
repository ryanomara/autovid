import * as THREE from 'three';
import type { ThreeSceneBundle } from './scene.js';

export interface GPURendererOptions {
  width: number;
  height: number;
}

export class GPURenderer {
  private renderer: THREE.WebGLRenderer;
  private glContext: any;

  constructor(options: GPURendererOptions) {
    const glContext = this.createContext(options.width, options.height);

    if (!glContext) {
      throw new Error('GPU context unavailable');
    }

    this.glContext = glContext;
    this.renderer = new THREE.WebGLRenderer({
      context: glContext,
      antialias: true,
    });
    this.renderer.setSize(options.width, options.height, false);
  }

  static isAvailable(): boolean {
    try {
      const glContext = GPURenderer.createContextStatic(1, 1);
      return Boolean(glContext);
    } catch {
      return false;
    }
  }

  render(bundle: ThreeSceneBundle): Uint8Array {
    this.renderer.render(bundle.scene, bundle.camera);
    const { width, height } = this.renderer.getSize(new THREE.Vector2());
    const pixelData = new Uint8Array(width * height * 4);
    this.glContext?.readPixels(
      0,
      0,
      width,
      height,
      this.glContext.RGBA,
      this.glContext.UNSIGNED_BYTE,
      pixelData
    );
    return pixelData;
  }

  private createContext(width: number, height: number): any {
    return GPURenderer.createContextStatic(width, height);
  }

  private static createContextStatic(width: number, height: number): any {
    const module = require('gl');
    const createGL = module.default ?? module;
    return createGL(width, height, { preserveDrawingBuffer: true });
  }
}
