#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { renderProject } from '../core/engine/renderer.js';
import { readFile, writeFile } from 'fs/promises';
import { createLogger } from '../utils/logger.js';
import { measureText } from '../core/engine/text-renderer.js';
import { applyBlur, applyGlow, applyGrayscale, applySharpen } from '../core/effects/visual.js';
import { loadImageToBuffer } from '../core/engine/image-loader.js';
import type { VideoProject, Scene, Layer, TextLayer, ImageLayer, ShapeLayer, Animation, AudioTrack } from '../types/index.js';

const logger = createLogger('mcp-server');

const server = new Server(
  {
    name: 'autovid-mcp',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'create_video',
      description: 'Create a video from a JSON project specification',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the project JSON file',
          },
          outputPath: {
            type: 'string',
            description: 'Path where the video should be saved',
          },
        },
        required: ['projectPath', 'outputPath'],
      },
    },
    {
      name: 'create_project',
      description: 'Create a new AutoVid project from scratch with smart defaults',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Project name',
          },
          width: {
            type: 'number',
            description: 'Video width (default: 1920)',
          },
          height: {
            type: 'number',
            description: 'Video height (default: 1080)',
          },
          duration: {
            type: 'number',
            description: 'Duration in milliseconds (default: 5000)',
          },
          fps: {
            type: 'number',
            description: 'Frames per second (default: 30)',
          },
        },
        required: ['name'],
      },
    },
    {
      name: 'add_text_layer',
      description: 'Add a text layer to a project with proper positioning and animation',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the project JSON file',
          },
          sceneId: {
            type: 'string',
            description: 'ID of the scene to add the text to',
          },
          text: {
            type: 'string',
            description: 'Text content',
          },
          fontSize: {
            type: 'number',
            description: 'Font size in pixels',
          },
          position: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
            description: 'Position on screen',
          },
          animation: {
            type: 'string',
            enum: ['fade-in', 'slide-in-left', 'slide-in-right', 'zoom-in', 'none'],
            description: 'Entry animation',
          },
        },
        required: ['projectPath', 'sceneId', 'text'],
      },
    },
    {
      name: 'add_image_layer',
      description: 'Add an image layer to a project',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the project JSON file',
          },
          sceneId: {
            type: 'string',
            description: 'ID of the scene',
          },
          imagePath: {
            type: 'string',
            description: 'Path or URL to image',
          },
          position: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
          },
          fit: {
            type: 'string',
            enum: ['cover', 'contain', 'fill', 'none'],
            description: 'How the image should fit',
          },
        },
        required: ['projectPath', 'sceneId', 'imagePath'],
      },
    },
    {
      name: 'add_audio_track',
      description: 'Add background music or voice narration to the video',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the project JSON file',
          },
          type: {
            type: 'string',
            enum: ['music', 'voice', 'sfx'],
            description: 'Type of audio',
          },
          src: {
            type: 'string',
            description: 'Path to audio file (optional if using TTS)',
          },
          ttsText: {
            type: 'string',
            description: 'Text for text-to-speech (alternative to src)',
          },
          volume: {
            type: 'number',
            description: 'Volume level 0-1 (default: 1)',
          },
          fadeIn: {
            type: 'number',
            description: 'Fade in duration in ms',
          },
          fadeOut: {
            type: 'number',
            description: 'Fade out duration in ms',
          },
        },
        required: ['projectPath', 'type'],
      },
    },
    {
      name: 'add_scene',
      description: 'Add a new scene to the project',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the project JSON file',
          },
          duration: {
            type: 'number',
            description: 'Scene duration in milliseconds',
          },
          transition: {
            type: 'string',
            enum: ['fade', 'slide', 'zoom', 'dissolve', 'wipe', 'none'],
            description: 'Transition effect to this scene',
          },
        },
        required: ['projectPath', 'duration'],
      },
    },
    {
      name: 'apply_theme',
      description: 'Apply a corporate theme (colors, fonts, logo) to the entire project',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the project JSON file',
          },
          theme: {
            type: 'string',
            enum: ['default', 'corporate', 'modern', 'minimal', 'vibrant'],
            description: 'Theme name',
          },
        },
        required: ['projectPath', 'theme'],
      },
    },
    {
      name: 'measure_text',
      description: 'Measure text dimensions for proper layout planning',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to measure',
          },
          fontSize: {
            type: 'number',
            description: 'Font size',
          },
          fontFamily: {
            type: 'string',
            description: 'Font family (default: Arial)',
          },
        },
        required: ['text', 'fontSize'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params as any;

  try {
    switch (name) {
      case 'create_video':
        return await handleCreateVideo(args);
      case 'create_project':
        return await handleCreateProject(args);
      case 'add_text_layer':
        return await handleAddTextLayer(args);
      case 'add_image_layer':
        return await handleAddImageLayer(args);
      case 'add_audio_track':
        return await handleAddAudioTrack(args);
      case 'add_scene':
        return await handleAddScene(args);
      case 'apply_theme':
        return await handleApplyTheme(args);
      case 'measure_text':
        return await handleMeasureText(args);
      default:
        return errorResponse(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    logger.error({ tool: name, error: error.message }, 'Tool execution failed');
    return errorResponse(error.message);
  }
});

async function handleCreateVideo(args: any) {
  const { projectPath, outputPath } = args;
  
  const projectData = await readFile(projectPath, 'utf-8');
  const project = JSON.parse(projectData);
  
  const result = await renderProject(project, {
    outputPath,
    onProgress: (progress) => {
      logger.info({ progress: progress.percentage }, 'Rendering');
    },
  });
  
  return successResponse({
    outputPath: result,
    message: 'Video created successfully',
  });
}

async function handleCreateProject(args: any) {
  const { name, width = 1920, height = 1080, duration = 5000, fps = 30 } = args;
  
  const project: VideoProject = {
    id: `project-${Date.now()}`,
    name,
    config: {
      width,
      height,
      fps,
      duration,
      outputFormat: 'mp4',
      quality: 'high',
    },
    scenes: [
      {
        id: 'scene-1',
        name: 'Main Scene',
        startTime: 0,
        endTime: duration,
        layers: [],
      },
    ],
    audio: [],
  };
  
  return successResponse({
    project,
    message: 'Project created successfully',
  });
}

async function handleAddTextLayer(args: any) {
  const { projectPath, sceneId, text, fontSize = 48, position = { x: 100, y: 100 }, animation = 'fade-in' } = args;
  
  const projectData = await readFile(projectPath, 'utf-8');
  const project: VideoProject = JSON.parse(projectData);
  
  const scene = project.scenes.find(s => s.id === sceneId);
  if (!scene) {
    throw new Error(`Scene ${sceneId} not found`);
  }
  
  const textLayer: TextLayer = {
    id: `text-${Date.now()}`,
    type: 'text',
    text,
    fontFamily: 'Arial',
    fontSize,
    color: { r: 255, g: 255, b: 255, a: 1 },
    position,
    scale: { x: 1, y: 1 },
    rotation: 0,
    opacity: 1,
    startTime: scene.startTime,
    endTime: scene.endTime,
  };
  
  if (animation !== 'none') {
    textLayer.animations = createAnimation(animation, scene.startTime, scene.endTime);
  }
  
  scene.layers.push(textLayer);
  
  await writeFile(projectPath, JSON.stringify(project, null, 2));
  
  return successResponse({
    layerId: textLayer.id,
    message: 'Text layer added successfully',
  });
}

async function handleAddImageLayer(args: any) {
  const { projectPath, sceneId, imagePath, position = { x: 0, y: 0 }, fit = 'contain' } = args;
  
  const projectData = await readFile(projectPath, 'utf-8');
  const project: VideoProject = JSON.parse(projectData);
  
  const scene = project.scenes.find(s => s.id === sceneId);
  if (!scene) {
    throw new Error(`Scene ${sceneId} not found`);
  }
  
  const imageLayer: ImageLayer = {
    id: `image-${Date.now()}`,
    type: 'image',
    src: imagePath,
    fit,
    position,
    scale: { x: 1, y: 1 },
    rotation: 0,
    opacity: 1,
    startTime: scene.startTime,
    endTime: scene.endTime,
  };
  
  scene.layers.push(imageLayer);
  
  await writeFile(projectPath, JSON.stringify(project, null, 2));
  
  return successResponse({
    layerId: imageLayer.id,
    message: 'Image layer added successfully',
  });
}

async function handleAddAudioTrack(args: any) {
  const { projectPath, type, src, ttsText, volume = 1, fadeIn = 0, fadeOut = 0 } = args;
  
  const projectData = await readFile(projectPath, 'utf-8');
  const project: VideoProject = JSON.parse(projectData);
  
  const audioTrack: AudioTrack = {
    id: `audio-${Date.now()}`,
    type,
    startTime: 0,
    endTime: project.config.duration,
    volume,
    fadeIn,
    fadeOut,
  };
  
  if (ttsText) {
    audioTrack.tts = {
      text: ttsText,
      voice: 'default',
    };
  } else if (src) {
    audioTrack.src = src;
  } else {
    throw new Error('Either src or ttsText must be provided');
  }
  
  project.audio.push(audioTrack);
  
  await writeFile(projectPath, JSON.stringify(project, null, 2));
  
  return successResponse({
    trackId: audioTrack.id,
    message: 'Audio track added successfully',
  });
}

async function handleAddScene(args: any) {
  const { projectPath, duration, transition = 'fade' } = args;
  
  const projectData = await readFile(projectPath, 'utf-8');
  const project: VideoProject = JSON.parse(projectData);
  
  const lastScene = project.scenes[project.scenes.length - 1];
  const startTime = lastScene ? lastScene.endTime : 0;
  const endTime = startTime + duration;
  
  const newScene: Scene = {
    id: `scene-${project.scenes.length + 1}`,
    name: `Scene ${project.scenes.length + 1}`,
    startTime,
    endTime,
    layers: [],
    transition: {
      type: transition as any,
      duration: 500,
    },
  };
  
  project.scenes.push(newScene);
  project.config.duration = Math.max(project.config.duration, endTime);
  
  await writeFile(projectPath, JSON.stringify(project, null, 2));
  
  return successResponse({
    sceneId: newScene.id,
    message: 'Scene added successfully',
  });
}

async function handleApplyTheme(args: any) {
  const { projectPath, theme } = args;
  
  const projectData = await readFile(projectPath, 'utf-8');
  const project: VideoProject = JSON.parse(projectData);
  
  const themeColors = getThemeColors(theme);
  
  project.config.backgroundColor = themeColors.background;
  
  for (const scene of project.scenes) {
    for (const layer of scene.layers) {
      if (layer.type === 'text') {
        (layer as TextLayer).color = themeColors.text;
        (layer as TextLayer).fontFamily = themeColors.fontFamily;
      }
    }
  }
  
  await writeFile(projectPath, JSON.stringify(project, null, 2));
  
  return successResponse({
    message: `Theme '${theme}' applied successfully`,
  });
}

async function handleMeasureText(args: any) {
  const { text, fontSize, fontFamily = 'Arial' } = args;
  
  const dimensions = measureText({
    text,
    fontSize,
    fontFamily,
    color: { r: 0, g: 0, b: 0, a: 1 },
  });
  
  return successResponse({
    width: dimensions.width,
    height: dimensions.height,
    message: 'Text measured successfully',
  });
}

function createAnimation(type: string, startTime: number, endTime: number): Animation[] {
  const animDuration = 1000;
  
  switch (type) {
    case 'fade-in':
      return [{
        property: 'opacity',
        keyframes: [
          { time: startTime, value: 0, easing: 'easeOut' },
          { time: startTime + animDuration, value: 1 },
        ],
      }];
    case 'slide-in-left':
      return [{
        property: 'position.x',
        keyframes: [
          { time: startTime, value: -500, easing: 'easeOut' },
          { time: startTime + animDuration, value: 0 },
        ],
      }];
    case 'slide-in-right':
      return [{
        property: 'position.x',
        keyframes: [
          { time: startTime, value: 2000, easing: 'easeOut' },
          { time: startTime + animDuration, value: 0 },
        ],
      }];
    case 'zoom-in':
      return [{
        property: 'scale',
        keyframes: [
          { time: startTime, value: { x: 0, y: 0 }, easing: 'easeOut' },
          { time: startTime + animDuration, value: { x: 1, y: 1 } },
        ],
      }];
    default:
      return [];
  }
}

function getThemeColors(theme: string) {
  const themes: Record<string, any> = {
    default: {
      background: { r: 0, g: 0, b: 0, a: 1 },
      text: { r: 255, g: 255, b: 255, a: 1 },
      fontFamily: 'Arial',
    },
    corporate: {
      background: { r: 20, g: 30, b: 48, a: 1 },
      text: { r: 255, g: 255, b: 255, a: 1 },
      fontFamily: 'Arial',
    },
    modern: {
      background: { r: 18, g: 18, b: 18, a: 1 },
      text: { r: 240, g: 240, b: 240, a: 1 },
      fontFamily: 'Arial',
    },
    minimal: {
      background: { r: 250, g: 250, b: 250, a: 1 },
      text: { r: 30, g: 30, b: 30, a: 1 },
      fontFamily: 'Arial',
    },
    vibrant: {
      background: { r: 75, g: 0, b: 130, a: 1 },
      text: { r: 255, g: 215, b: 0, a: 1 },
      fontFamily: 'Arial',
    },
  };
  
  return themes[theme] || themes.default;
}

function successResponse(data: any) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: true, ...data }, null, 2),
      },
    ],
  };
}

function errorResponse(message: string) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: false, error: message }, null, 2),
      },
    ],
    isError: true,
  };
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('AutoVid MCP Server v2.0 ready with 8 tools');
}

main().catch(logger.error);
