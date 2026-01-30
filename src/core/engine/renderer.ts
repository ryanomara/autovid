import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { createLogger } from '../../utils/logger.js';
import type {
  VideoProject,
  VideoConfig,
  Scene,
  Layer,
  TextLayer,
  ImageLayer,
  ShapeLayer,
  VideoLayer,
  Color,
  RenderOptions,
  RenderProgress,
  Timestamp,
} from '../../types/index.js';
import {
  PixelBuffer,
  createBuffer,
  fillBuffer,
  drawRect,
  drawRoundedRect,
  drawCircle,
  drawEllipse,
  drawText,
  drawRectStroke,
  toRGB,
} from './canvas.js';
import { renderText } from './text-renderer.js';
import { loadImageToBuffer, loadImageFromURL } from './image-loader.js';
import { Compositor, createPositionedLayer, BlendMode } from './compositor.js';
import { Timeline, AnimatedProperties } from './timeline.js';
import { FFmpegEncoder } from './ffmpeg.js';
import { AudioMixer } from '../audio/mixer.js';

const logger = createLogger('renderer');

export interface RendererConfig {
  outputDir: string;
  framePrefix?: string;
  cacheEnabled?: boolean;
}

interface RenderState {
  currentFrame: number;
  startTime: number;
  renderedFrames: number[];
}

export class Renderer {
  private config: RendererConfig;
  private imageCache: Map<string, PixelBuffer> = new Map();
  private videoFrameCache: Map<string, Map<number, PixelBuffer>> = new Map();

  constructor(config: RendererConfig) {
    this.config = {
      framePrefix: 'frame_',
      cacheEnabled: true,
      ...config,
    };
  }

  async render(
    project: VideoProject,
    options: RenderOptions
  ): Promise<string> {
    const { outputPath, onProgress } = options;

    logger.info({ projectId: project.id, name: project.name }, 'Starting render');

    await this.ensureOutputDir(this.config.outputDir);

    const timeline = new Timeline({
      fps: project.config.fps,
      duration: project.config.duration,
    });

    const compositor = new Compositor(
      project.config.width,
      project.config.height,
      project.config.backgroundColor
    );

    const totalFrames = timeline.getTotalFrames();
    const state: RenderState = {
      currentFrame: 0,
      startTime: Date.now(),
      renderedFrames: [],
    };

    logger.info({ totalFrames, fps: project.config.fps }, 'Rendering frames');

    for (let frame = 0; frame < totalFrames; frame++) {
      const time = timeline.frameToTime(frame);
      try {
        const frameBuffer = await this.renderFrame(
          project,
          time,
          timeline,
          compositor
        );

        const framePath = await this.writeFrame(frameBuffer, frame);
        state.renderedFrames.push(frame);
        state.currentFrame = frame;

        if (onProgress) {
          const elapsed = Date.now() - state.startTime;
          const avgTimePerFrame = elapsed / (frame + 1);
          const remainingFrames = totalFrames - frame - 1;

          onProgress({
            frame,
            totalFrames,
            percentage: (frame + 1) / totalFrames * 100,
            estimatedTimeRemaining: avgTimePerFrame * remainingFrames,
            currentScene: this.getCurrentSceneName(project.scenes, time),
          });
        }
      } catch (error) {
        logger.error({ frame, error }, 'Failed to render frame');
        throw new Error(`Failed to render frame ${frame}: ${error}`);
      }
    }

    logger.info('Frame rendering complete, encoding video');

    let audioPath: string | undefined;

    if (project.audio && project.audio.length > 0) {
      logger.info({ trackCount: project.audio.length }, 'Mixing audio tracks');
      const audioMixer = new AudioMixer(join(this.config.outputDir, 'audio'));
      try {
        audioPath = await audioMixer.mix({
          outputPath: join(this.config.outputDir, 'audio', 'mixed.mp3'),
          config: project.config,
          tracks: project.audio,
        });
      } catch (error) {
        logger.error({ error }, 'Audio mixing failed, continuing without audio');
      }
    }

    if (project.config.outputFormat === 'frames') {
      logger.info({ outputDir: this.config.outputDir }, 'Output format is frames, skipping encoding');
      return this.config.outputDir;
    }

    const encoder = new FFmpegEncoder();
    const framePattern = join(
      this.config.outputDir,
      `${this.config.framePrefix}%06d.raw`
    );

    try {
      await encoder.encode({
        inputPattern: framePattern,
        outputPath,
        config: project.config,
        audioPath,
        onProgress,
      });

      logger.info({ outputPath }, 'Video encoding complete');
      return outputPath;
    } catch (error) {
      logger.error({ error }, 'Video encoding failed');
      throw error;
    }
  }

  async renderFrame(
    project: VideoProject,
    time: Timestamp,
    timeline: Timeline,
    compositor: Compositor
  ): Promise<PixelBuffer> {
    const activeScene = this.getActiveScene(project.scenes, time);

    if (!activeScene) {
      const emptyBuffer = createBuffer(project.config.width, project.config.height);
      fillBuffer(emptyBuffer, project.config.backgroundColor || { r: 0, g: 0, b: 0, a: 1 });
      return emptyBuffer;
    }

    if (activeScene.backgroundColor) {
      compositor.setBackgroundColor(activeScene.backgroundColor);
    } else if (project.config.backgroundColor) {
      compositor.setBackgroundColor(project.config.backgroundColor);
    }

    const activeLayers = timeline.getActiveLayersAtTime(activeScene.layers, time);
    const compositorLayers = [];

    for (let i = 0; i < activeLayers.length; i++) {
      const layer = activeLayers[i];
      const props = timeline.getAnimatedPropertiesAtTime(layer, time);

      try {
        const layerBuffer = await this.renderLayer(
          layer,
          props,
          project.config,
          time
        );

        if (layerBuffer) {
          const transformed = compositor.applyTransform(
            layerBuffer,
            props.scale,
            props.rotation
          );

          compositorLayers.push(
            createPositionedLayer(
              transformed,
              Math.round(props.position.x),
              Math.round(props.position.y),
              i,
              (layer.blendMode as BlendMode) || 'normal',
              props.opacity
            )
          );
        }
      } catch (error) {
        logger.warn({ layerId: layer.id, error }, 'Failed to render layer');
      }
    }

    return compositor.compositeWithPosition(compositorLayers);
  }

  private async renderLayer(
    layer: Layer,
    props: AnimatedProperties,
    config: VideoConfig,
    time: Timestamp
  ): Promise<PixelBuffer | null> {
    if (layer.visible === false) return null;

    switch (layer.type) {
      case 'text':
        return this.renderTextLayer(layer as TextLayer, props);
      case 'image':
        return await this.renderImageLayer(layer as ImageLayer, props);
      case 'shape':
        return this.renderShapeLayer(layer as ShapeLayer, props);
      case 'video':
        return await this.renderVideoLayer(layer as VideoLayer, props, time);
      default:
        logger.warn({ layerType: layer.type }, 'Unknown layer type');
        return null;
    }
  }

  private renderTextLayer(
    layer: TextLayer,
    props: AnimatedProperties
  ): PixelBuffer {
    const color = (props as unknown as { color?: Color }).color || layer.color;

    return renderText({
      text: layer.text,
      fontSize: layer.fontSize,
      fontFamily: layer.fontFamily,
      fontWeight: layer.fontWeight,
      fontStyle: layer.fontStyle,
      color: color,
      textAlign: layer.textAlign,
      maxWidth: layer.maxWidth,
      letterSpacing: layer.letterSpacing,
      textShadow: layer.textShadow,
    });
  }

  private async renderImageLayer(
    layer: ImageLayer,
    props: AnimatedProperties
  ): Promise<PixelBuffer | null> {
    if (this.config.cacheEnabled && this.imageCache.has(layer.src)) {
      return this.imageCache.get(layer.src)!;
    }

    try {
      const buffer = await this.loadImage(layer.src);

      if (this.config.cacheEnabled && buffer) {
        this.imageCache.set(layer.src, buffer);
      }

      return buffer;
    } catch (error) {
      logger.warn({ src: layer.src, error }, 'Failed to load image');
      return null;
    }
  }

  private renderShapeLayer(
    layer: ShapeLayer,
    props: AnimatedProperties
  ): PixelBuffer {
    const { width, height } = layer.dimensions;
    const buffer = createBuffer(Math.ceil(width), Math.ceil(height));

    const fill = (props as unknown as { fill?: Color }).fill || layer.fill;
    const stroke = layer.stroke;

    switch (layer.shapeType) {
      case 'rectangle':
        if (fill) {
          if (layer.cornerRadius && layer.cornerRadius > 0) {
            drawRoundedRect(buffer, { x: 0, y: 0, width, height }, fill, layer.cornerRadius);
          } else {
            drawRect(buffer, { x: 0, y: 0, width, height }, fill);
          }
        }
        if (stroke) {
          drawRectStroke(buffer, { x: 0, y: 0, width, height }, stroke.color, stroke.width);
        }
        break;

      case 'circle':
        const radius = Math.min(width, height) / 2;
        if (fill) {
          drawCircle(buffer, { x: width / 2, y: height / 2 }, radius, fill);
        }
        break;

      case 'ellipse':
        if (fill) {
          drawEllipse(buffer, { x: width / 2, y: height / 2 }, width / 2, height / 2, fill);
        }
        break;

      default:
        if (fill) {
          drawRect(buffer, { x: 0, y: 0, width, height }, fill);
        }
    }

    return buffer;
  }

  private async renderVideoLayer(
    layer: VideoLayer,
    props: AnimatedProperties,
    time: Timestamp
  ): Promise<PixelBuffer | null> {
    const layerTime = time - layer.startTime;
    const playbackRate = layer.playbackRate || 1;
    const videoTime = layerTime * playbackRate;

    logger.debug({ videoTime, src: layer.src }, 'Video layer rendering placeholder');

    const buffer = createBuffer(320, 240);
    fillBuffer(buffer, { r: 50, g: 50, b: 50, a: 1 });
    drawText(buffer, 'VIDEO', { x: 120, y: 100 }, { r: 255, g: 255, b: 255, a: 1 }, 24);

    return buffer;
  }

  private async loadImage(src: string): Promise<PixelBuffer | null> {
    try {
      if (src.startsWith('http://') || src.startsWith('https://')) {
        return await loadImageFromURL(src);
      } else {
        return await loadImageToBuffer(src);
      }
    } catch (error) {
      logger.warn({ src, error }, 'Image load failed');
      return null;
    }
  }

  private async writeFrame(buffer: PixelBuffer, frameNumber: number): Promise<string> {
    const filename = `${this.config.framePrefix}${String(frameNumber).padStart(6, '0')}.raw`;
    const filepath = join(this.config.outputDir, filename);

    const rgbData = toRGB(buffer);

    await writeFile(filepath, rgbData);

    return filepath;
  }

  private async ensureOutputDir(dir: string): Promise<void> {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  private getActiveScene(scenes: Scene[], time: Timestamp): Scene | null {
    for (const scene of scenes) {
      if (time >= scene.startTime && time < scene.endTime) {
        return scene;
      }
    }
    return null;
  }

  private getCurrentSceneName(scenes: Scene[], time: Timestamp): string | undefined {
    const scene = this.getActiveScene(scenes, time);
    return scene?.name || scene?.id;
  }

  clearCache(): void {
    this.imageCache.clear();
    this.videoFrameCache.clear();
    logger.info('Cache cleared');
  }

  getStats(): { imageCacheSize: number; videoCacheSize: number } {
    return {
      imageCacheSize: this.imageCache.size,
      videoCacheSize: this.videoFrameCache.size,
    };
  }
}

export async function renderProject(
  project: VideoProject,
  options: RenderOptions & { outputDir?: string }
): Promise<string> {
  const renderer = new Renderer({
    outputDir: options.outputDir || join(dirname(options.outputPath), 'frames'),
  });

  return renderer.render(project, options);
}

export function createRenderer(config: RendererConfig): Renderer {
  return new Renderer(config);
}
