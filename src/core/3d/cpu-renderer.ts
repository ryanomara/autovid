import type { ThreeSceneBundle } from './scene.js';

export interface CPURendererOptions {
  width: number;
  height: number;
}

export class CPURenderer {
  private width: number;
  private height: number;

  constructor(options: CPURendererOptions) {
    this.width = options.width;
    this.height = options.height;
  }

  render(_bundle: ThreeSceneBundle): Uint8Array {
    return new Uint8Array(this.width * this.height * 4);
  }
}
