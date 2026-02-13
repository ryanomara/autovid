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
  ChartLayer,
  VideoLayer,
  Color,
  RenderOptions,
  RenderProgress,
  Timestamp,
  AudioTrack,
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
import { renderText, measureText } from './text-renderer.js';
import { loadImageToBuffer, loadImageFromURL } from './image-loader.js';
import { Compositor, createPositionedLayer, BlendMode } from './compositor.js';
import { Timeline, AnimatedProperties } from './timeline.js';
import { FFmpegEncoder } from './ffmpeg.js';
import { AudioMixer } from '../audio/mixer.js';
import { TTSService } from '../audio/tts.js';
import { HuggingFaceTTSProvider } from '../audio/providers/huggingface.js';
import { applyBlur, applyGlow, applyTint } from '../effects/visual.js';
import { generateParticles } from '../effects/particles.js';
import { loadLottie } from '../effects/lottie.js';
import { CPURenderer } from '../3d/cpu-renderer.js';
import { GPURenderer } from '../3d/gpu-renderer.js';
import { createThreeScene } from '../3d/scene.js';
import { loadGLTF } from '../3d/gltf-loader.js';
import type { EffectLayer, Layer3D } from '../../types/index.js';
import { getCameraStateAtTime } from '../animation/camera.js';
import { extractVideoFrame } from '../layers/video.js';
import { renderChartLayer } from './chart-renderer.js';

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

interface TextBounds {
  x: number;
  y: number;
  width: number;
  height: number;
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

  async render(project: VideoProject, options: RenderOptions): Promise<string> {
    const { outputPath, onProgress } = options;
    const renderWithoutTts = options.renderWithoutTts ?? false;
    const ttsMaxRetries = options.ttsMaxRetries ?? 2;

    logger.info({ projectId: project.id, name: project.name }, 'Starting render');

    await this.ensureOutputDir(this.config.outputDir);

    const narrationTracks = await this.prepareNarrationTracks(
      project,
      renderWithoutTts,
      ttsMaxRetries
    );

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
        const frameBuffer = await this.renderFrame(project, time, timeline, compositor);

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
            percentage: ((frame + 1) / totalFrames) * 100,
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

    const audioTracks = [...(project.audio || []), ...narrationTracks];

    if (audioTracks.length > 0) {
      logger.info({ trackCount: audioTracks.length }, 'Mixing audio tracks');
      const audioMixer = new AudioMixer(join(this.config.outputDir, 'audio'));
      try {
        audioPath = await audioMixer.mix({
          outputPath: join(this.config.outputDir, 'audio', 'mixed.mp3'),
          config: project.config,
          tracks: audioTracks,
        });
      } catch (error) {
        logger.error({ error }, 'Audio mixing failed, continuing without audio');
      }
    }

    if (project.config.outputFormat === 'frames') {
      logger.info(
        { outputDir: this.config.outputDir },
        'Output format is frames, skipping encoding'
      );
      return this.config.outputDir;
    }

    const encoder = new FFmpegEncoder();
    const framePattern = join(this.config.outputDir, `${this.config.framePrefix}%06d.raw`);

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
    const cameraState = getCameraStateAtTime(
      activeScene.camera,
      time,
      project.config.width,
      project.config.height
    );
    const mainTextLayout = this.getMainTextLayout(
      activeLayers,
      timeline,
      time,
      cameraState,
      project
    );
    const textMargin = this.getSceneTextMargin(activeScene, cameraState.zoom);
    const compositorLayers = [];
    const occupiedTextBounds: TextBounds[] = [];

    for (let i = 0; i < activeLayers.length; i++) {
      const layer = activeLayers[i];
      const props = timeline.getAnimatedPropertiesAtTime(layer, time);

      try {
        const layerBuffer = await this.renderLayer(layer, props, project.config, time);

        if (layerBuffer) {
          const transformed = compositor.applyTransform(
            layerBuffer,
            { x: props.scale.x * cameraState.zoom, y: props.scale.y * cameraState.zoom },
            props.rotation + cameraState.rotation
          );

          let x = Math.round(props.position.x - cameraState.position.x + project.config.width / 2);
          let y = Math.round(props.position.y - cameraState.position.y + project.config.height / 2);

          if (layer.type === 'text') {
            const layerAlign = (layer as TextLayer).textAlign || 'left';
            const isPositionAnimated = this.isPositionAnimated(layer);
            const hasExplicitAlign = (layer as TextLayer).textAlign !== undefined;
            const effectiveAlign =
              !hasExplicitAlign && !isPositionAnimated && mainTextLayout
                ? mainTextLayout.align
                : layerAlign;

            if (!hasExplicitAlign && !isPositionAnimated && mainTextLayout) {
              x = this.getAlignedAnchorX(mainTextLayout, effectiveAlign);
            }

            if (effectiveAlign === 'center') {
              x -= Math.round(transformed.width / 2);
            } else if (effectiveAlign === 'right') {
              x -= transformed.width;
            }

            if (!isPositionAnimated) {
              x = this.clampPosition(
                x,
                textMargin,
                project.config.width - textMargin - transformed.width
              );
              y = this.clampPosition(
                y,
                textMargin,
                project.config.height - textMargin - transformed.height
              );

              y = this.resolveTextCollision(
                x,
                y,
                transformed.width,
                transformed.height,
                occupiedTextBounds,
                textMargin,
                project.config.height
              );
            }

            occupiedTextBounds.push({ x, y, width: transformed.width, height: transformed.height });
          }

          const blendMode = this.getEffectiveBlendMode(layer);

          compositorLayers.push(
            createPositionedLayer(transformed, x, y, i, blendMode, props.opacity)
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
      case 'chart':
        return this.renderChartLayer(layer as ChartLayer, props);
      case 'video':
        return await this.renderVideoLayer(layer as VideoLayer, props, time);
      case 'effect':
        return await this.renderEffectLayer(layer as EffectLayer, props, config);
      case '3d':
        return await this.render3DLayer(layer as Layer3D, props, config);
      default: {
        const unknownLayer = layer as { type?: string };
        logger.warn({ layerType: unknownLayer.type }, 'Unknown layer type');
        return null;
      }
    }
  }

  private async renderEffectLayer(
    layer: EffectLayer,
    _props: AnimatedProperties,
    config: VideoConfig
  ): Promise<PixelBuffer | null> {
    const base = createBuffer(config.width, config.height);
    fillBuffer(base, { r: 0, g: 0, b: 0, a: 0 });

    switch (layer.effectType) {
      case 'blur':
        return await applyBlur(base, layer.params || {});
      case 'glow':
        return await applyGlow(base, layer.params || {});
      case 'shadow':
        return await applyBlur(base, layer.params || {});
      case 'particles':
        return generateParticles(base, {
          preset: layer.params?.preset || 'confetti',
          count: layer.params?.count || 250,
        });
      case 'custom':
        if (layer.params?.tint) {
          return await applyTint(base, layer.params.tint);
        }
        if (layer.params?.lottiePath) {
          try {
            await loadLottie(layer.params.lottiePath);
          } catch (error) {
            logger.warn({ path: layer.params.lottiePath, error }, 'Failed to load Lottie');
          }
        }
        return base;
      default:
        return base;
    }
  }

  private async render3DLayer(
    layer: Layer3D,
    _props: AnimatedProperties,
    config: VideoConfig
  ): Promise<PixelBuffer | null> {
    const bundle = createThreeScene({
      width: config.width,
      height: config.height,
      background: config.backgroundColor
        ? (config.backgroundColor.r << 16) +
          (config.backgroundColor.g << 8) +
          config.backgroundColor.b
        : undefined,
    });

    if (layer.scene) {
      try {
        const model = await loadGLTF(layer.scene);
        bundle.scene.add(model);
      } catch (error) {
        logger.warn({ scene: layer.scene, error }, 'Failed to load GLTF scene');
      }
    }

    let pixelData: Uint8Array;
    try {
      const gpu = new GPURenderer({ width: config.width, height: config.height });
      pixelData = gpu.render(bundle);
    } catch {
      const cpu = new CPURenderer({ width: config.width, height: config.height });
      pixelData = cpu.render(bundle);
    }

    return {
      data: new Uint8ClampedArray(pixelData),
      width: config.width,
      height: config.height,
    };
  }

  private renderTextLayer(layer: TextLayer, props: AnimatedProperties): PixelBuffer {
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
      textStroke: layer.textStroke,
      textMask: layer.textMask,
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

  private renderShapeLayer(layer: ShapeLayer, props: AnimatedProperties): PixelBuffer {
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

  private renderChartLayer(layer: ChartLayer, _props: AnimatedProperties): PixelBuffer {
    const progressCandidate = (_props as unknown as { chartProgress?: number }).chartProgress;
    return renderChartLayer(layer, {
      progress: typeof progressCandidate === 'number' ? progressCandidate : 1,
    });
  }

  private async renderVideoLayer(
    layer: VideoLayer,
    props: AnimatedProperties,
    time: Timestamp
  ): Promise<PixelBuffer | null> {
    if (!layer.src) {
      return null;
    }

    const layerTime = time - layer.startTime;
    const playbackRate = layer.playbackRate || 1;
    const videoTime = layerTime * playbackRate;

    logger.debug({ videoTime, src: layer.src }, 'Video layer rendering');

    const size = props.size as { width: number; height: number } | undefined;
    const width = size?.width ?? 320;
    const height = size?.height ?? 240;

    return await extractVideoFrame({
      src: layer.src,
      time: videoTime,
      width,
      height,
    });
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

  private getEffectiveBlendMode(layer: Layer): BlendMode {
    if (layer.type === 'text' && (layer as TextLayer).textMask?.mode) {
      return 'erase';
    }

    return ((layer.blendMode as BlendMode) || 'normal') as BlendMode;
  }

  private resolveTextCollision(
    x: number,
    y: number,
    width: number,
    height: number,
    occupied: TextBounds[],
    margin: number,
    canvasHeight: number
  ): number {
    let resolvedY = y;
    const spacing = Math.max(12, Math.round(height * 0.15));

    const collides = (candidateY: number): boolean => {
      const a: TextBounds = { x, y: candidateY, width, height };
      return occupied.some((b) => this.rectanglesOverlap(a, b));
    };

    let safety = 0;
    while (collides(resolvedY) && safety < 24) {
      const down = resolvedY + spacing;
      const up = resolvedY - spacing;
      const canMoveDown = down + height <= canvasHeight - margin;
      const canMoveUp = up >= margin;

      if (canMoveDown) {
        resolvedY = down;
      } else if (canMoveUp) {
        resolvedY = up;
      } else {
        break;
      }

      safety += 1;
    }

    return resolvedY;
  }

  private rectanglesOverlap(a: TextBounds, b: TextBounds): boolean {
    return !(
      a.x + a.width <= b.x ||
      b.x + b.width <= a.x ||
      a.y + a.height <= b.y ||
      b.y + b.height <= a.y
    );
  }

  private getMainTextLayout(
    layers: Layer[],
    timeline: Timeline,
    time: Timestamp,
    cameraState: ReturnType<typeof getCameraStateAtTime>,
    project: VideoProject
  ): { align: 'left' | 'center' | 'right'; left: number; center: number; right: number } | null {
    const textLayers = layers.filter((layer) => layer.type === 'text') as TextLayer[];
    if (textLayers.length === 0) {
      return null;
    }

    const mainText = textLayers.reduce((largest, current) =>
      current.fontSize > largest.fontSize ? current : largest
    );
    const props = timeline.getAnimatedPropertiesAtTime(mainText, time);
    const align = mainText.textAlign || 'left';

    const metrics = measureText({
      text: mainText.text,
      fontSize: mainText.fontSize,
      fontFamily: mainText.fontFamily,
      fontWeight: mainText.fontWeight,
      fontStyle: mainText.fontStyle,
      color: { r: 0, g: 0, b: 0, a: 1 },
      maxWidth: mainText.maxWidth,
    });

    const scaledWidth = Math.round(metrics.width * props.scale.x * cameraState.zoom);
    const anchorX = Math.round(
      props.position.x - cameraState.position.x + project.config.width / 2
    );

    if (align === 'center') {
      return {
        align,
        left: anchorX - Math.round(scaledWidth / 2),
        center: anchorX,
        right: anchorX + Math.round(scaledWidth / 2),
      };
    }

    if (align === 'right') {
      return {
        align,
        left: anchorX - scaledWidth,
        center: anchorX - Math.round(scaledWidth / 2),
        right: anchorX,
      };
    }

    return {
      align,
      left: anchorX,
      center: anchorX + Math.round(scaledWidth / 2),
      right: anchorX + scaledWidth,
    };
  }

  private getSceneTextMargin(scene: Scene, zoom: number): number {
    const textLayers = scene.layers.filter((layer) => layer.type === 'text') as TextLayer[];
    if (textLayers.length === 0) {
      return 0;
    }

    const mainText = textLayers.reduce((largest, current) =>
      current.fontSize > largest.fontSize ? current : largest
    );

    const metrics = measureText({
      text: 'M',
      fontSize: mainText.fontSize,
      fontFamily: mainText.fontFamily,
      fontWeight: mainText.fontWeight,
      fontStyle: mainText.fontStyle,
      color: { r: 0, g: 0, b: 0, a: 1 },
    });

    return Math.ceil(metrics.width * zoom);
  }

  private clampPosition(value: number, min: number, max: number): number {
    if (max < min) {
      return min;
    }
    return Math.min(Math.max(value, min), max);
  }

  private isPositionAnimated(layer: Layer): boolean {
    if (!layer.animations || layer.animations.length === 0) {
      return false;
    }
    return layer.animations.some(
      (animation) => animation.property === 'position' || Boolean(animation.path)
    );
  }

  private getAlignedAnchorX(
    main: { align: 'left' | 'center' | 'right'; left: number; center: number; right: number },
    align: 'left' | 'center' | 'right'
  ): number {
    if (align === 'center') {
      return main.center;
    }
    if (align === 'right') {
      return main.right;
    }
    return main.left;
  }

  private async prepareNarrationTracks(
    project: VideoProject,
    renderWithoutTts: boolean,
    ttsMaxRetries: number
  ): Promise<AudioTrack[]> {
    const scenesWithNarration = project.scenes.filter((scene) => scene.narration?.text);
    if (scenesWithNarration.length === 0) {
      return [];
    }

    const audioDir = join(this.config.outputDir, 'audio');
    await this.ensureOutputDir(audioDir);

    const ttsService = new TTSService({
      providers: [
        new HuggingFaceTTSProvider({
          token: process.env.HF_TOKEN,
          timeoutMs: 120000,
        }),
      ],
      fallbackOrder: ['huggingface'],
    });

    const tracks: AudioTrack[] = [];

    for (const scene of scenesWithNarration) {
      const narration = scene.narration;
      if (!narration) {
        continue;
      }

      const outputPath = join(audioDir, `narration_${scene.id}.wav`);
      const track: AudioTrack = {
        id: `narration-${scene.id}`,
        type: 'voice',
        startTime: scene.startTime,
        endTime: scene.endTime,
        volume: 1,
        src: outputPath,
        tts: {
          text: narration.text,
          voice: narration.voice ?? 'default',
          rate: narration.rate,
          pitch: narration.pitch,
        },
      };

      logger.info(
        { sceneId: scene.id, outputPath, textLength: narration.text.length },
        'Generating narration'
      );

      const shouldSkip = await this.ensureNarrationSnippet(
        ttsService,
        track,
        outputPath,
        ttsMaxRetries,
        renderWithoutTts
      );

      if (!shouldSkip) {
        const { tts, ...trackWithoutTts } = track;
        tracks.push(trackWithoutTts);
        logger.info({ sceneId: scene.id, outputPath }, 'Narration ready');
      }
    }

    return tracks;
  }

  private async ensureNarrationSnippet(
    ttsService: TTSService,
    track: AudioTrack,
    outputPath: string,
    ttsMaxRetries: number,
    renderWithoutTts: boolean
  ): Promise<boolean> {
    if (existsSync(outputPath)) {
      return false;
    }

    let attempt = 0;
    while (attempt <= ttsMaxRetries) {
      try {
        await ttsService.synthesize(track, outputPath);
        return false;
      } catch (error) {
        attempt += 1;
        logger.warn({ trackId: track.id, attempt, error }, 'Narration TTS failed');
        if (attempt > ttsMaxRetries) {
          if (renderWithoutTts) {
            logger.warn({ trackId: track.id }, 'Skipping narration after TTS failures');
            return true;
          }
          throw new Error(
            `Narration TTS failed for ${track.id}. Use --render-without-tts to continue.`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }

    return false;
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
