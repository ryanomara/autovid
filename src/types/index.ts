// Core type definitions for AutoVid

/**
 * Represents a point in time (in milliseconds from start)
 */
export type Timestamp = number;

/**
 * RGBA color representation
 */
export interface Color {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

/**
 * 2D position
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 2D dimensions
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Rectangle bounds
 */
export interface Rect extends Position, Dimensions {}

/**
 * Video project configuration
 */
export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  duration: number; // milliseconds
  backgroundColor?: Color;
  outputFormat: 'mp4' | 'webm' | 'gif' | 'frames';
  quality?: 'low' | 'medium' | 'high' | 'ultra';
}

/**
 * Easing function types
 */
export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInQuart'
  | 'easeOutQuart'
  | 'easeInOutQuart'
  | 'easeInElastic'
  | 'easeOutElastic'
  | 'easeInOutElastic'
  | 'easeInBounce'
  | 'easeOutBounce'
  | 'easeInOutBounce';

/**
 * Animation keyframe
 */
export interface Keyframe<T = any> {
  time: Timestamp;
  value: T;
  easing?: EasingType;
}

/**
 * Animation definition
 */
export interface Animation<T = any> {
  property: string;
  keyframes: Keyframe<T>[];
  spring?: SpringConfig;
  path?: {
    points: Position[];
    type: PathType;
    closed?: boolean;
  };
}

/**
 * Path animation types
 */
export type PathType = 'linear' | 'bezier' | 'catmull-rom';

/**
 * Camera configuration and animations
 */
export type CameraKeyframes<T> = Array<{ time: Timestamp; value: T }>;

export interface CameraConfig {
  position?: Position;
  zoom?: number;
  rotation?: number;
  animations?: {
    position?: CameraKeyframes<Position>;
    zoom?: CameraKeyframes<number>;
    rotation?: CameraKeyframes<number>;
  };
}

/**
 * Spring animation configuration
 */
export interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: number;
}

/**
 * Layer types
 */
export type LayerType = 'text' | 'image' | 'video' | 'shape' | 'chart' | 'effect' | 'group' | '3d';

/**
 * Base layer properties
 */
export interface BaseLayer {
  id: string;
  type: LayerType;
  name?: string;
  startTime: Timestamp;
  endTime: Timestamp;
  position: Position;
  scale: { x: number; y: number };
  rotation: number;
  opacity: number;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'erase';
  animations?: Animation[];
  visible?: boolean;
}

/**
 * Text layer
 */
export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  color: Color;
  fontWeight?:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  maxWidth?: number;
  textShadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: Color;
  };
  textStroke?: {
    color: Color;
    width: number;
  };
  textMask?: {
    mode: 'cutout' | 'inverse';
  };
}

/**
 * Image layer
 */
export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string; // Local path or URL
  fit?: 'cover' | 'contain' | 'fill' | 'none';
}

/**
 * Video layer
 */
export interface VideoLayer extends BaseLayer {
  type: 'video';
  src: string;
  playbackRate?: number;
  volume?: number;
  width?: number;
  height?: number;
}

/**
 * Shape layer
 */
export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'ellipse' | 'polygon' | 'path';
  dimensions: Dimensions;
  fill?: Color;
  stroke?: {
    color: Color;
    width: number;
  };
  cornerRadius?: number;
}

export interface ChartLayer extends BaseLayer {
  type: 'chart';
  dimensions: Dimensions;
  chartType: 'line' | 'bar';
  data: {
    labels: string[];
    values: number[];
  };
  title?: string;
  yAxis?: {
    min?: number;
    max?: number;
    ticks?: number;
  };
  style?: {
    axisColor?: Color;
    gridColor?: Color;
    labelColor?: Color;
    valueColor?: Color;
    lineColor?: Color;
    barColor?: Color;
    lineWidth?: number;
    pointRadius?: number;
    showGrid?: boolean;
    showPoints?: boolean;
    showValues?: boolean;
    maxLabels?: number;
    valueDecimals?: number;
  };
}

/**
 * Effect layer
 */
export interface EffectLayer extends BaseLayer {
  type: 'effect';
  effectType: 'blur' | 'glow' | 'shadow' | 'particles' | 'custom';
  params: Record<string, any>;
}

/**
 * Layer union type
 */
export interface Layer3D extends BaseLayer {
  type: '3d';
  scene: string;
}

export type Layer =
  | TextLayer
  | ImageLayer
  | VideoLayer
  | ShapeLayer
  | ChartLayer
  | EffectLayer
  | Layer3D;

/**
 * Scene definition
 */
export interface Scene {
  id: string;
  name?: string;
  startTime: Timestamp;
  endTime: Timestamp;
  layers: Layer[];
  narration?: {
    text: string;
    voice?: string;
    rate?: number;
    pitch?: number;
  };
  camera?: CameraConfig;
  transition?: {
    type:
      | 'fade'
      | 'slide'
      | 'zoom'
      | 'dissolve'
      | 'wipe'
      | 'iris'
      | 'clockWipe'
      | 'blinds'
      | 'flip'
      | 'morph'
      | 'glitch'
      | 'pixelate'
      | 'radialWipe'
      | 'doorway'
      | 'cube';
    duration: number;
    easing?: EasingType;
  };
  backgroundColor?: Color;
}

/**
 * Audio track
 */
export interface AudioTrack {
  id: string;
  type: 'music' | 'voice' | 'sfx';
  src?: string; // File path or URL
  startTime: Timestamp;
  endTime: Timestamp;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
  tts?: {
    text: string;
    voice: string;
    rate?: number;
    pitch?: number;
  };
}

/**
 * Theme definition for corporate branding
 */
export interface Theme {
  name: string;
  colors: {
    primary: Color;
    secondary: Color;
    accent: Color;
    background: Color;
    text: Color;
  };
  fonts: {
    heading: string;
    body: string;
    mono?: string;
  };
  logo?: {
    src: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    scale: number;
  };
  spacing: {
    padding: number;
    margin: number;
  };
}

/**
 * Story structure for narrative
 */
export interface StoryStructure {
  type: 'hero-journey' | 'problem-solution' | 'before-after' | 'feature-benefit' | 'custom';
  acts: {
    name: string;
    duration: number; // percentage of total duration
    focus: 'setup' | 'conflict' | 'resolution' | 'cta';
  }[];
}

/**
 * Complete video project
 */
export interface VideoProject {
  id: string;
  name: string;
  config: VideoConfig;
  scenes: Scene[];
  audio: AudioTrack[];
  theme?: Theme;
  story?: StoryStructure;
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    tags?: string[];
  };
}

/**
 * Render progress callback
 */
export interface RenderProgress {
  frame: number;
  totalFrames: number;
  percentage: number;
  estimatedTimeRemaining?: number; // milliseconds
  currentScene?: string;
}

/**
 * Render options
 */
export interface RenderOptions {
  outputPath: string;
  onProgress?: (progress: RenderProgress) => void;
  cache?: boolean;
  parallel?: boolean;
  maxThreads?: number;
  resume?: boolean; // Resume from saved state
  renderWithoutTts?: boolean;
  ttsMaxRetries?: number;
}

/**
 * Template definition
 */
export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'corporate' | 'social' | 'presentation' | 'ad' | 'educational' | 'custom';
  thumbnail?: string;
  defaultConfig: Partial<VideoConfig>;
  scenes: Omit<Scene, 'id' | 'startTime' | 'endTime'>[];
  requiredInputs: {
    name: string;
    type: 'text' | 'image' | 'video' | 'color' | 'number';
    description: string;
    required: boolean;
  }[];
}

/**
 * Agent skill input for LLM agents
 */
export interface AgentVideoRequest {
  prompt: string; // Natural language description
  duration?: number;
  theme?: string | Theme;
  template?: string;
  assets?: {
    images?: string[];
    videos?: string[];
    logo?: string;
  };
  voice?: {
    enabled: boolean;
    text?: string;
    voice?: string;
  };
  music?: {
    enabled: boolean;
    mood?: 'upbeat' | 'calm' | 'dramatic' | 'corporate' | 'energetic';
  };
  style?: {
    animations: 'minimal' | 'moderate' | 'dynamic';
    effects: 'subtle' | 'moderate' | 'bold';
  };
}

/**
 * Memory state for resumable operations
 */
export interface MemoryState {
  projectId: string;
  timestamp: number;
  renderedFrames: number[];
  renderedScenes: string[];
  assetCache: Record<string, string>;
  progress: RenderProgress;
  config: VideoConfig;
}
