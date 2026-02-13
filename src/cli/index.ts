#!/usr/bin/env node

import { Command } from 'commander';
import { config as loadEnv } from 'dotenv';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, dirname, basename, extname, join } from 'path';
import { createLogger } from '../utils/logger.js';
import { Renderer, renderProject } from '../core/engine/renderer.js';
import type { VideoProject, VideoConfig, RenderProgress, Template } from '../types/index.js';
import { HuggingFaceAssetService } from '../core/assets/huggingface.js';
import {
  validateCompositionContracts,
  type ValidationMode,
} from '../core/validation/composition-contracts.js';

const logger = createLogger('cli');
const VERSION = '0.1.0';

loadEnv();

let tempDir: string | null = null;
let isCleaningUp = false;

interface ProgressState {
  spinner: NodeJS.Timeout | null;
  spinnerChars: string[];
  spinnerIndex: number;
  lastLine: string;
}

const progressState: ProgressState = {
  spinner: null,
  spinnerChars: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  spinnerIndex: 0,
  lastLine: '',
};

function clearLine(): void {
  if (process.stdout.isTTY) {
    process.stdout.write('\r\x1b[K');
  }
}

function startSpinner(message: string): void {
  if (!process.stdout.isTTY) {
    logger.info(message);
    return;
  }

  progressState.spinnerIndex = 0;
  progressState.spinner = setInterval(() => {
    const char = progressState.spinnerChars[progressState.spinnerIndex];
    progressState.spinnerIndex =
      (progressState.spinnerIndex + 1) % progressState.spinnerChars.length;
    clearLine();
    process.stdout.write(`${char} ${message}`);
  }, 80);
}

function stopSpinner(finalMessage?: string): void {
  if (progressState.spinner) {
    clearInterval(progressState.spinner);
    progressState.spinner = null;
  }
  clearLine();
  if (finalMessage) {
    logger.info(finalMessage);
  }
}

function showProgress(progress: RenderProgress): void {
  const { frame, totalFrames, percentage, estimatedTimeRemaining, currentScene } = progress;

  const barWidth = 30;
  const filled = Math.round((percentage / 100) * barWidth);
  const empty = barWidth - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  let eta = '';
  if (estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0) {
    const seconds = Math.floor(estimatedTimeRemaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    eta = ` ETA: ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  const sceneInfo = currentScene ? ` [${currentScene}]` : '';
  const line = `[${bar}] ${percentage.toFixed(1)}% (${frame}/${totalFrames})${eta}${sceneInfo}`;

  if (process.stdout.isTTY) {
    clearLine();
    process.stdout.write(line);
    progressState.lastLine = line;
  } else if (Math.floor(percentage) % 10 === 0 && percentage !== 0) {
    logger.info({ frame, totalFrames, percentage: Math.floor(percentage) }, 'Rendering progress');
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateVideoProject(project: unknown): ValidationResult {
  const errors: string[] = [];

  if (!project || typeof project !== 'object') {
    return { valid: false, errors: ['Project must be an object'] };
  }

  const p = project as Record<string, unknown>;

  if (!p.id || typeof p.id !== 'string') {
    errors.push('Project must have a string "id" field');
  }

  if (!p.name || typeof p.name !== 'string') {
    errors.push('Project must have a string "name" field');
  }

  if (!p.config || typeof p.config !== 'object') {
    errors.push('Project must have a "config" object');
  } else {
    const config = p.config as Record<string, unknown>;

    if (typeof config.width !== 'number' || config.width <= 0) {
      errors.push('Config must have a positive "width"');
    }

    if (typeof config.height !== 'number' || config.height <= 0) {
      errors.push('Config must have a positive "height"');
    }

    if (typeof config.fps !== 'number' || config.fps <= 0 || config.fps > 120) {
      errors.push('Config must have "fps" between 1 and 120');
    }

    if (typeof config.duration !== 'number' || config.duration <= 0) {
      errors.push('Config must have a positive "duration" (in milliseconds)');
    }

    const validFormats = ['mp4', 'webm', 'gif', 'frames'];
    if (!validFormats.includes(config.outputFormat as string)) {
      errors.push(`Config "outputFormat" must be one of: ${validFormats.join(', ')}`);
    }
  }

  if (!Array.isArray(p.scenes)) {
    errors.push('Project must have a "scenes" array');
  } else if (p.scenes.length === 0) {
    errors.push('Project must have at least one scene');
  }

  if (!Array.isArray(p.audio)) {
    errors.push('Project must have an "audio" array (can be empty)');
  }

  return { valid: errors.length === 0, errors };
}

async function loadProjectFile(inputPath: string): Promise<VideoProject> {
  const fullPath = resolve(inputPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Input file not found: ${fullPath}`);
  }

  const ext = extname(fullPath).toLowerCase();
  const content = await readFile(fullPath, 'utf-8');

  let project: unknown;

  if (ext === '.json') {
    try {
      project = JSON.parse(content);
    } catch (e) {
      throw new Error(`Invalid JSON in ${inputPath}: ${(e as Error).message}`);
    }
  } else if (ext === '.yaml' || ext === '.yml') {
    throw new Error(
      'YAML support requires js-yaml package. Please use JSON format or install js-yaml.'
    );
  } else {
    throw new Error(`Unsupported file format: ${ext}. Use .json or .yaml`);
  }

  const validation = validateVideoProject(project);
  if (!validation.valid) {
    throw new Error(`Invalid project file:\n  - ${validation.errors.join('\n  - ')}`);
  }

  return project as VideoProject;
}

async function cleanup(): Promise<void> {
  if (isCleaningUp) return;
  isCleaningUp = true;

  stopSpinner();

  if (tempDir && existsSync(tempDir)) {
    logger.info({ tempDir }, 'Cleaning up temporary files');
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      logger.warn({ error: (e as Error).message }, 'Failed to cleanup temp directory');
    }
  }

  isCleaningUp = false;
}

function setupSignalHandlers(): void {
  const handleSignal = async (signal: string) => {
    logger.info({ signal }, 'Received signal, cleaning up...');
    await cleanup();
    process.exit(130);
  };

  process.on('SIGINT', () => handleSignal('SIGINT'));
  process.on('SIGTERM', () => handleSignal('SIGTERM'));

  process.on('uncaughtException', async (error) => {
    logger.error({ error: error.message }, 'Uncaught exception');
    await cleanup();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
    await cleanup();
    process.exit(1);
  });
}

async function createCommand(
  input: string,
  output: string,
  options: {
    fps?: string;
    quality?: string;
    format?: string;
    width?: string;
    height?: string;
    verbose?: boolean;
    renderWithoutTts?: boolean;
    ttsRetries?: string;
  }
): Promise<void> {
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }

  logger.info({ input, output }, 'Starting video creation');

  try {
    startSpinner('Loading project file...');
    const project = await loadProjectFile(input);
    stopSpinner('Project loaded successfully');

    if (options.fps) {
      const fps = parseInt(options.fps, 10);
      if (fps > 0 && fps <= 120) {
        project.config.fps = fps;
        logger.debug({ fps }, 'Overriding FPS');
      }
    }

    if (options.quality) {
      const validQualities = ['low', 'medium', 'high', 'ultra'];
      if (validQualities.includes(options.quality)) {
        project.config.quality = options.quality as VideoConfig['quality'];
        logger.debug({ quality: options.quality }, 'Overriding quality');
      }
    }

    if (options.format) {
      const validFormats = ['mp4', 'webm', 'gif', 'frames'];
      if (validFormats.includes(options.format)) {
        project.config.outputFormat = options.format as VideoConfig['outputFormat'];
        logger.debug({ format: options.format }, 'Overriding format');
      }
    }

    if (options.width) {
      const width = parseInt(options.width, 10);
      if (width > 0) {
        project.config.width = width;
        logger.debug({ width }, 'Overriding width');
      }
    }

    if (options.height) {
      const height = parseInt(options.height, 10);
      if (height > 0) {
        project.config.height = height;
        logger.debug({ height }, 'Overriding height');
      }
    }

    tempDir = join(dirname(resolve(output)), '.autovid-temp');
    await mkdir(tempDir, { recursive: true });

    logger.info(
      {
        width: project.config.width,
        height: project.config.height,
        fps: project.config.fps,
        duration: project.config.duration,
        format: project.config.outputFormat,
      },
      'Starting render'
    );

    const outputPath = await renderProject(project, {
      outputPath: resolve(output),
      outputDir: tempDir,
      onProgress: showProgress,
      renderWithoutTts: options.renderWithoutTts,
      ttsMaxRetries: options.ttsRetries ? parseInt(options.ttsRetries, 10) : undefined,
    });

    if (process.stdout.isTTY) {
      process.stdout.write('\n');
    }

    logger.info({ outputPath }, 'Video created successfully');
    await cleanup();
  } catch (error) {
    stopSpinner();
    logger.error({ error: (error as Error).message }, 'Failed to create video');
    await cleanup();
    process.exit(1);
  }
}

async function renderCommand(
  projectPath: string,
  options: {
    output?: string;
    fps?: string;
    quality?: string;
    format?: string;
    verbose?: boolean;
    renderWithoutTts?: boolean;
    ttsRetries?: string;
  }
): Promise<void> {
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }

  const fullPath = resolve(projectPath);

  let projectFile = fullPath;
  if (existsSync(fullPath) && (await readFile(fullPath, 'utf-8').catch(() => null)) === null) {
    const projectJsonPath = join(fullPath, 'project.json');
    if (existsSync(projectJsonPath)) {
      projectFile = projectJsonPath;
    } else {
      logger.error('No project.json found in directory');
      process.exit(1);
    }
  }

  const outputPath = options.output || join(dirname(projectFile), 'output.mp4');

  await createCommand(projectFile, outputPath, options);
}

async function previewCommand(
  projectPath: string,
  options: {
    frames?: string;
    output?: string;
    verbose?: boolean;
  }
): Promise<void> {
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }

  logger.info({ projectPath }, 'Generating preview frames');

  try {
    const project = await loadProjectFile(projectPath);
    project.config.outputFormat = 'frames';

    const outputDir = options.output || join(dirname(resolve(projectPath)), 'preview-frames');
    await mkdir(outputDir, { recursive: true });

    const totalDuration = project.config.duration;
    const fps = project.config.fps;
    const totalFrames = Math.floor((totalDuration / 1000) * fps);

    const numPreviewFrames = parseInt(options.frames || '5', 10);

    logger.info({ numPreviewFrames, totalFrames, outputDir }, 'Rendering preview frames');

    const renderer = new Renderer({ outputDir });

    await renderer.render(project, {
      outputPath: outputDir,
      onProgress: showProgress,
    });

    if (process.stdout.isTTY) {
      process.stdout.write('\n');
    }

    logger.info({ outputDir }, 'Preview frames generated');
  } catch (error) {
    stopSpinner();
    logger.error({ error: (error as Error).message }, 'Failed to generate preview');
    process.exit(1);
  }
}

async function validateCommand(
  projectPath: string,
  options: {
    mode?: ValidationMode;
    report?: string;
    verbose?: boolean;
  }
): Promise<void> {
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }

  const mode: ValidationMode = options.mode === 'permissive' ? 'permissive' : 'strict';
  const project = await loadProjectFile(projectPath);
  const report = validateCompositionContracts(project, mode);

  const output = {
    projectId: project.id,
    mode: report.mode,
    valid: report.valid,
    errors: report.errors,
    warnings: report.warnings,
    sceneContracts: report.sceneContracts,
    issues: report.issues,
  };

  if (options.report) {
    const reportPath = resolve(options.report);
    await writeFile(reportPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
    logger.info({ reportPath }, 'Validation report written');
  }

  logger.info(JSON.stringify(output, null, 2));

  if (!report.valid) {
    process.exit(1);
  }
}

async function templatesListCommand(options: { verbose?: boolean }): Promise<void> {
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }

  const builtInTemplates: Template[] = [
    {
      id: 'basic-presentation',
      name: 'Basic Presentation',
      description: 'Simple slide-based presentation with fade transitions',
      category: 'presentation',
      defaultConfig: { width: 1920, height: 1080, fps: 30, outputFormat: 'mp4' },
      scenes: [],
      requiredInputs: [
        { name: 'title', type: 'text', description: 'Presentation title', required: true },
        { name: 'slides', type: 'text', description: 'Slide content (JSON array)', required: true },
      ],
    },
    {
      id: 'social-promo',
      name: 'Social Media Promo',
      description: 'Short promotional video for social media (9:16 aspect ratio)',
      category: 'social',
      defaultConfig: { width: 1080, height: 1920, fps: 30, outputFormat: 'mp4' },
      scenes: [],
      requiredInputs: [
        { name: 'headline', type: 'text', description: 'Main headline', required: true },
        { name: 'cta', type: 'text', description: 'Call to action', required: true },
        { name: 'logo', type: 'image', description: 'Brand logo', required: false },
      ],
    },
    {
      id: 'corporate-intro',
      name: 'Corporate Intro',
      description: 'Professional company introduction video',
      category: 'corporate',
      defaultConfig: { width: 1920, height: 1080, fps: 30, outputFormat: 'mp4', quality: 'high' },
      scenes: [],
      requiredInputs: [
        { name: 'companyName', type: 'text', description: 'Company name', required: true },
        { name: 'tagline', type: 'text', description: 'Company tagline', required: false },
        { name: 'logo', type: 'image', description: 'Company logo', required: true },
        {
          name: 'primaryColor',
          type: 'color',
          description: 'Brand primary color',
          required: false,
        },
      ],
    },
    {
      id: 'explainer',
      name: 'Explainer Video',
      description: 'Educational explainer video template',
      category: 'educational',
      defaultConfig: { width: 1920, height: 1080, fps: 30, outputFormat: 'mp4' },
      scenes: [],
      requiredInputs: [
        { name: 'topic', type: 'text', description: 'Topic to explain', required: true },
        { name: 'points', type: 'text', description: 'Key points (JSON array)', required: true },
      ],
    },
    {
      id: 'product-showcase',
      name: 'Product Showcase',
      description: 'Product highlight video with zoom and pan effects',
      category: 'ad',
      defaultConfig: { width: 1920, height: 1080, fps: 60, outputFormat: 'mp4', quality: 'high' },
      scenes: [],
      requiredInputs: [
        { name: 'productName', type: 'text', description: 'Product name', required: true },
        { name: 'productImage', type: 'image', description: 'Product image', required: true },
        {
          name: 'features',
          type: 'text',
          description: 'Product features (JSON array)',
          required: true,
        },
        { name: 'price', type: 'text', description: 'Product price', required: false },
      ],
    },
  ];

  logger.info('Available templates:\n');

  const byCategory = builtInTemplates.reduce(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    },
    {} as Record<string, Template[]>
  );

  for (const [category, templates] of Object.entries(byCategory)) {
    logger.info(`\n  ${category.toUpperCase()}:`);
    for (const t of templates) {
      logger.info(`    ${t.id.padEnd(20)} - ${t.description}`);
      if (options.verbose) {
        logger.info(`      Resolution: ${t.defaultConfig.width}x${t.defaultConfig.height}`);
        logger.info(`      Inputs: ${t.requiredInputs.map((i) => i.name).join(', ')}`);
      }
    }
  }

  logger.info('\nUse "autovid templates apply <name> <output>" to apply a template');
}

async function templatesApplyCommand(
  templateName: string,
  outputPath: string,
  options: { verbose?: boolean }
): Promise<void> {
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }

  const baseProject: VideoProject = {
    id: `project-${Date.now()}`,
    name: `New ${templateName} Project`,
    config: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 10000,
      outputFormat: 'mp4',
      quality: 'medium',
      backgroundColor: { r: 0, g: 0, b: 0, a: 1 },
    },
    scenes: [
      {
        id: 'scene-1',
        name: 'Opening',
        startTime: 0,
        endTime: 3000,
        layers: [
          {
            id: 'title-layer',
            type: 'text',
            name: 'Title',
            text: 'Your Title Here',
            fontFamily: 'Arial',
            fontSize: 72,
            color: { r: 255, g: 255, b: 255, a: 1 },
            startTime: 0,
            endTime: 3000,
            position: { x: 960, y: 540 },
            scale: { x: 1, y: 1 },
            rotation: 0,
            opacity: 1,
            animations: [
              {
                property: 'opacity',
                keyframes: [
                  { time: 0, value: 0, easing: 'easeOut' },
                  { time: 500, value: 1 },
                ],
              },
            ],
          },
        ],
        backgroundColor: { r: 20, g: 20, b: 40, a: 1 },
      },
      {
        id: 'scene-2',
        name: 'Main Content',
        startTime: 3000,
        endTime: 8000,
        layers: [
          {
            id: 'content-bg',
            type: 'shape',
            name: 'Background',
            shapeType: 'rectangle',
            dimensions: { width: 1920, height: 1080 },
            fill: { r: 30, g: 30, b: 50, a: 1 },
            startTime: 3000,
            endTime: 8000,
            position: { x: 0, y: 0 },
            scale: { x: 1, y: 1 },
            rotation: 0,
            opacity: 1,
          },
          {
            id: 'content-text',
            type: 'text',
            name: 'Content',
            text: 'Your content goes here',
            fontFamily: 'Arial',
            fontSize: 48,
            color: { r: 200, g: 200, b: 200, a: 1 },
            startTime: 3000,
            endTime: 8000,
            position: { x: 960, y: 540 },
            scale: { x: 1, y: 1 },
            rotation: 0,
            opacity: 1,
          },
        ],
      },
      {
        id: 'scene-3',
        name: 'Closing',
        startTime: 8000,
        endTime: 10000,
        layers: [
          {
            id: 'cta-text',
            type: 'text',
            name: 'Call to Action',
            text: 'Thank You!',
            fontFamily: 'Arial',
            fontSize: 64,
            color: { r: 255, g: 255, b: 255, a: 1 },
            startTime: 8000,
            endTime: 10000,
            position: { x: 960, y: 540 },
            scale: { x: 1, y: 1 },
            rotation: 0,
            opacity: 1,
            animations: [
              {
                property: 'opacity',
                keyframes: [
                  { time: 8000, value: 0 },
                  { time: 8500, value: 1, easing: 'easeOut' },
                ],
              },
            ],
          },
        ],
        backgroundColor: { r: 20, g: 20, b: 40, a: 1 },
      },
    ],
    audio: [],
  };

  switch (templateName) {
    case 'social-promo':
      baseProject.config.width = 1080;
      baseProject.config.height = 1920;
      baseProject.config.duration = 15000;
      break;
    case 'corporate-intro':
      baseProject.config.quality = 'high';
      baseProject.config.duration = 30000;
      break;
    case 'product-showcase':
      baseProject.config.fps = 60;
      baseProject.config.quality = 'high';
      break;
  }

  const fullOutputPath = resolve(outputPath);
  const outputDir = dirname(fullOutputPath);

  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  await writeFile(fullOutputPath, JSON.stringify(baseProject, null, 2), 'utf-8');

  logger.info({ outputPath: fullOutputPath }, 'Project created from template');
  logger.info('Edit the project file to customize your video');
}

async function initCommand(options: {
  name?: string;
  width?: string;
  height?: string;
  fps?: string;
  duration?: string;
  format?: string;
  verbose?: boolean;
}): Promise<void> {
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }

  const projectName = options.name || basename(process.cwd());
  const outputPath = resolve('project.json');

  if (existsSync(outputPath)) {
    logger.error('project.json already exists in this directory');
    process.exit(1);
  }

  const project: VideoProject = {
    id: `project-${Date.now()}`,
    name: projectName,
    config: {
      width: parseInt(options.width || '1920', 10),
      height: parseInt(options.height || '1080', 10),
      fps: parseInt(options.fps || '30', 10),
      duration: parseInt(options.duration || '10000', 10),
      outputFormat: (options.format as VideoConfig['outputFormat']) || 'mp4',
      quality: 'medium',
      backgroundColor: { r: 0, g: 0, b: 0, a: 1 },
    },
    scenes: [
      {
        id: 'scene-1',
        name: 'Scene 1',
        startTime: 0,
        endTime: parseInt(options.duration || '10000', 10),
        layers: [],
        backgroundColor: { r: 30, g: 30, b: 30, a: 1 },
      },
    ],
    audio: [],
    metadata: {
      title: projectName,
      description: 'Created with AutoVid',
      author: '',
      tags: [],
    },
  };

  await writeFile(outputPath, JSON.stringify(project, null, 2), 'utf-8');

  const assetsDir = resolve('assets');
  if (!existsSync(assetsDir)) {
    await mkdir(assetsDir, { recursive: true });
  }

  logger.info({ projectFile: outputPath, assetsDir }, 'Project initialized');
  logger.info('Edit project.json to add scenes and layers');
  logger.info('Place assets (images, videos) in the assets/ directory');
  logger.info('Run "autovid render ." to render your project');
}

async function assetsImageCommand(
  prompt: string,
  options: {
    output?: string;
    resolution?: string;
    seed?: string;
    steps?: string;
    shift?: string;
    endpoint?: string;
    token?: string;
    verbose?: boolean;
  }
): Promise<void> {
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }

  const output = options.output
    ? resolve(options.output)
    : resolve('assets', 'images', `hf-image-${Date.now()}.png`);

  const service = new HuggingFaceAssetService({
    token: options.token || process.env.HF_TOKEN,
  });

  logger.info({ output }, 'Generating image asset from Hugging Face space');
  const metadata = await service.generateImage({
    prompt,
    outputPath: output,
    resolution: options.resolution,
    seed: options.seed ? parseInt(options.seed, 10) : undefined,
    steps: options.steps ? parseInt(options.steps, 10) : undefined,
    shift: options.shift ? parseFloat(options.shift) : undefined,
    endpointName: options.endpoint,
  });

  logger.info({ output, metadata }, 'Image asset generated');
}

async function assetsVideoCommand(
  image: string,
  prompt: string,
  options: {
    output?: string;
    seed?: string;
    frames?: string;
    endpoint?: string;
    token?: string;
    verbose?: boolean;
  }
): Promise<void> {
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }

  const output = options.output
    ? resolve(options.output)
    : resolve('assets', 'videos', `hf-video-${Date.now()}.mp4`);

  const service = new HuggingFaceAssetService({
    token: options.token || process.env.HF_TOKEN,
  });

  logger.info({ image, output }, 'Generating image-to-video asset from Hugging Face space');
  const metadata = await service.generateVideoFromImage({
    prompt,
    inputImage: image,
    outputPath: output,
    seed: options.seed ? parseInt(options.seed, 10) : undefined,
    numFrames: options.frames ? parseInt(options.frames, 10) : undefined,
    endpointName: options.endpoint,
  });

  logger.info({ output, metadata }, 'Video asset generated');
}

const program = new Command();

program
  .name('autovid')
  .description('Autonomous video generation platform')
  .version(VERSION)
  .option('-v, --verbose', 'Enable verbose output');

program
  .command('create')
  .description('Create video from JSON/YAML specification file')
  .argument('<input>', 'Input specification file (JSON or YAML)')
  .argument('<output>', 'Output video file path')
  .option('--fps <number>', 'Override frames per second (1-120)')
  .option('--quality <level>', 'Override quality (low, medium, high, ultra)')
  .option('--format <type>', 'Override output format (mp4, webm, gif, frames)')
  .option('--width <pixels>', 'Override video width')
  .option('--height <pixels>', 'Override video height')
  .option('--render-without-tts', 'Render without TTS if narration fails')
  .option('--tts-retries <number>', 'Max retries per TTS snippet (default: 2)')
  .option('-v, --verbose', 'Enable verbose output')
  .action(createCommand);

program
  .command('render')
  .description('Render an existing project directory')
  .argument('<project>', 'Project directory or project.json file')
  .option('-o, --output <path>', 'Output video file path')
  .option('--fps <number>', 'Override frames per second')
  .option('--quality <level>', 'Override quality level')
  .option('--format <type>', 'Override output format')
  .option('--render-without-tts', 'Render without TTS if narration fails')
  .option('--tts-retries <number>', 'Max retries per TTS snippet (default: 2)')
  .option('-v, --verbose', 'Enable verbose output')
  .action(renderCommand);

program
  .command('preview')
  .description('Generate preview frames from a project')
  .argument('<project>', 'Project file path')
  .option('-f, --frames <number>', 'Number of preview frames to generate', '5')
  .option('-o, --output <dir>', 'Output directory for frames')
  .option('-v, --verbose', 'Enable verbose output')
  .action(previewCommand);

program
  .command('validate')
  .description('Run composition contract validation and preflight checks')
  .argument('<project>', 'Project file path')
  .option('--mode <mode>', 'Validation mode: strict or permissive', 'strict')
  .option('--report <path>', 'Write JSON validation report to file')
  .option('-v, --verbose', 'Enable verbose output')
  .action(validateCommand);

const templates = program.command('templates').description('Manage video templates');

templates
  .command('list')
  .description('List available templates')
  .option('-v, --verbose', 'Show detailed template information')
  .action(templatesListCommand);

templates
  .command('apply')
  .description('Apply a template to create a new project')
  .argument('<name>', 'Template name')
  .argument('<output>', 'Output project file path')
  .option('-v, --verbose', 'Enable verbose output')
  .action(templatesApplyCommand);

program
  .command('init')
  .description('Initialize a new project in the current directory')
  .option('-n, --name <name>', 'Project name')
  .option('--width <pixels>', 'Video width (default: 1920)')
  .option('--height <pixels>', 'Video height (default: 1080)')
  .option('--fps <number>', 'Frames per second (default: 30)')
  .option('--duration <ms>', 'Duration in milliseconds (default: 10000)')
  .option('--format <type>', 'Output format (default: mp4)')
  .option('-v, --verbose', 'Enable verbose output')
  .action(initCommand);

const assets = program.command('assets').description('Generate and manage external media assets');

assets
  .command('image')
  .description('Generate an image asset from Hugging Face image space')
  .argument('<prompt>', 'Prompt for image generation')
  .option('-o, --output <path>', 'Output image path (default: assets/images/*.png)')
  .option('--resolution <value>', 'Image resolution preset from the HF space')
  .option('--seed <number>', 'Generation seed')
  .option('--steps <number>', 'Inference steps')
  .option('--shift <number>', 'Flow shift parameter')
  .option('--endpoint <name>', 'Override endpoint name')
  .option('--token <token>', 'HF token override (falls back to HF_TOKEN env var)')
  .option('-v, --verbose', 'Enable verbose output')
  .action(assetsImageCommand);

assets
  .command('video')
  .description('Generate a video asset from image using Hugging Face image-to-video space')
  .argument('<image>', 'Input image path or URL')
  .argument('<prompt>', 'Prompt for image-to-video generation')
  .option('-o, --output <path>', 'Output video path (default: assets/videos/*.mp4)')
  .option('--seed <number>', 'Generation seed')
  .option('--frames <number>', 'Frame count requested from provider')
  .option('--endpoint <name>', 'Override endpoint name')
  .option('--token <token>', 'HF token override (falls back to HF_TOKEN env var)')
  .option('-v, --verbose', 'Enable verbose output')
  .action(assetsVideoCommand);

setupSignalHandlers();

program.parse();
