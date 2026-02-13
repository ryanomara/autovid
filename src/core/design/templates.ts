import type { Template, VideoConfig, Scene } from '../../types/index.js';

export const titleSlideTemplate: Template = {
  id: 'title-slide',
  name: 'Title Slide',
  description: 'Simple centered title with optional subtitle',
  category: 'presentation',
  defaultConfig: {
    fps: 30,
    duration: 5000,
    width: 1920,
    height: 1080,
  },
  scenes: [
    {
      name: 'Title Scene',
      layers: [
        {
          id: 'bg',
          type: 'shape',
          name: 'Background',
          shapeType: 'rectangle',
          dimensions: { width: 1920, height: 1080 },
          fill: { r: 20, g: 20, b: 50, a: 1 },
          position: { x: 0, y: 0 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          opacity: 1,
          zIndex: 0,
          startTime: 0,
          endTime: 5000,
        },
        {
          id: 'title',
          type: 'text',
          name: 'Main Title',
          text: '{{title}}',
          fontFamily: 'Arial',
          fontSize: 96,
          fontWeight: 'bold',
          color: { r: 255, g: 255, b: 255, a: 1 },
          textAlign: 'center',
          position: { x: 960, y: 440 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          opacity: 1,
          zIndex: 900,
          overlapMode: 'avoid-text',
          startTime: 0,
          endTime: 5000,
          animations: [
            {
              property: 'opacity',
              keyframes: [
                { time: 0, value: 0 },
                { time: 1000, value: 1, easing: 'easeOut' },
              ],
            },
          ],
        },
        {
          id: 'subtitle',
          type: 'text',
          name: 'Subtitle',
          text: '{{subtitle}}',
          fontFamily: 'Arial',
          fontSize: 48,
          color: { r: 200, g: 200, b: 220, a: 1 },
          textAlign: 'center',
          position: { x: 960, y: 640 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          opacity: 1,
          zIndex: 910,
          overlapMode: 'avoid-text',
          startTime: 1000,
          endTime: 5000,
          animations: [
            {
              property: 'opacity',
              keyframes: [
                { time: 1000, value: 0 },
                { time: 2000, value: 1, easing: 'easeOut' },
              ],
            },
          ],
        },
      ],
      backgroundColor: { r: 20, g: 20, b: 50, a: 1 },
    },
  ],
  requiredInputs: [
    {
      name: 'title',
      type: 'text',
      description: 'Main title text',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      description: 'Subtitle or tagline',
      required: false,
    },
  ],
};

export const lowerThirdTemplate: Template = {
  id: 'lower-third',
  name: 'Lower Third',
  description: 'Animated name and title overlay',
  category: 'presentation',
  defaultConfig: {
    fps: 30,
    duration: 5000,
    width: 1920,
    height: 1080,
  },
  scenes: [
    {
      name: 'Lower Third',
      layers: [
        {
          id: 'bar',
          type: 'shape',
          name: 'Background Bar',
          shapeType: 'rectangle',
          dimensions: { width: 600, height: 120 },
          fill: { r: 0, g: 102, b: 204, a: 0.9 },
          position: { x: 100, y: 900 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          opacity: 1,
          zIndex: 100,
          startTime: 0,
          endTime: 5000,
          animations: [
            {
              property: 'position.x',
              keyframes: [
                { time: 0, value: -600 },
                { time: 500, value: 100, easing: 'easeOutCubic' },
                { time: 4500, value: 100 },
                { time: 5000, value: -600, easing: 'easeInCubic' },
              ],
            },
          ],
        },
        {
          id: 'name',
          type: 'text',
          name: 'Name',
          text: '{{name}}',
          fontFamily: 'Arial',
          fontSize: 40,
          fontWeight: 'bold',
          color: { r: 255, g: 255, b: 255, a: 1 },
          position: { x: 120, y: 920 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          opacity: 1,
          zIndex: 900,
          overlapMode: 'avoid-text',
          startTime: 0,
          endTime: 5000,
          animations: [
            {
              property: 'position.x',
              keyframes: [
                { time: 0, value: -580 },
                { time: 500, value: 120, easing: 'easeOutCubic' },
                { time: 4500, value: 120 },
                { time: 5000, value: -580, easing: 'easeInCubic' },
              ],
            },
          ],
        },
        {
          id: 'title',
          type: 'text',
          name: 'Title',
          text: '{{title}}',
          fontFamily: 'Arial',
          fontSize: 28,
          color: { r: 220, g: 220, b: 220, a: 1 },
          position: { x: 120, y: 965 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          opacity: 1,
          zIndex: 910,
          overlapMode: 'avoid-text',
          startTime: 0,
          endTime: 5000,
          animations: [
            {
              property: 'position.x',
              keyframes: [
                { time: 0, value: -580 },
                { time: 500, value: 120, easing: 'easeOutCubic' },
                { time: 4500, value: 120 },
                { time: 5000, value: -580, easing: 'easeInCubic' },
              ],
            },
          ],
        },
      ],
    },
  ],
  requiredInputs: [
    {
      name: 'name',
      type: 'text',
      description: 'Person name',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      description: 'Job title or role',
      required: true,
    },
  ],
};

export const templates: Record<string, Template> = {
  'title-slide': titleSlideTemplate,
  'lower-third': lowerThirdTemplate,
};

export function getTemplate(id: string): Template | undefined {
  return templates[id];
}

export function listTemplates(): Template[] {
  return Object.values(templates);
}

export function applyTemplate(template: Template, inputs: Record<string, any>): Partial<Scene> {
  const scene = JSON.parse(JSON.stringify(template.scenes[0]));

  const replaceTokens = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/\{\{(\w+)\}\}/g, (_, key) => inputs[key] || '');
    }
    if (Array.isArray(obj)) {
      return obj.map(replaceTokens);
    }
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = replaceTokens(value);
      }
      return result;
    }
    return obj;
  };

  return replaceTokens(scene);
}
