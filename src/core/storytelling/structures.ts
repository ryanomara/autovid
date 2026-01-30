import type { StoryStructure } from '../../types/index.js';

export const storyStructures: Record<string, StoryStructure> = {
  'hero-journey': {
    type: 'hero-journey',
    acts: [
      { name: 'Setup', duration: 25, focus: 'setup' },
      { name: 'Challenge', duration: 50, focus: 'conflict' },
      { name: 'Resolution', duration: 20, focus: 'resolution' },
      { name: 'Call to Action', duration: 5, focus: 'cta' },
    ],
  },
  'problem-solution': {
    type: 'problem-solution',
    acts: [
      { name: 'Problem Introduction', duration: 30, focus: 'setup' },
      { name: 'Solution Reveal', duration: 50, focus: 'resolution' },
      { name: 'Benefits', duration: 15, focus: 'resolution' },
      { name: 'Call to Action', duration: 5, focus: 'cta' },
    ],
  },
  'before-after': {
    type: 'before-after',
    acts: [
      { name: 'Before State', duration: 40, focus: 'setup' },
      { name: 'Transformation', duration: 20, focus: 'conflict' },
      { name: 'After State', duration: 35, focus: 'resolution' },
      { name: 'Call to Action', duration: 5, focus: 'cta' },
    ],
  },
  'feature-benefit': {
    type: 'feature-benefit',
    acts: [
      { name: 'Introduction', duration: 15, focus: 'setup' },
      { name: 'Feature Showcase', duration: 60, focus: 'resolution' },
      { name: 'Benefits Summary', duration: 20, focus: 'resolution' },
      { name: 'Call to Action', duration: 5, focus: 'cta' },
    ],
  },
};

export function getStoryStructure(type: string): StoryStructure {
  return storyStructures[type] || storyStructures['problem-solution'];
}

export function calculateActTimings(
  structure: StoryStructure,
  totalDuration: number
): Array<{ name: string; startTime: number; endTime: number; focus: string }> {
  const acts = [];
  let currentTime = 0;

  for (const act of structure.acts) {
    const actDuration = (totalDuration * act.duration) / 100;
    acts.push({
      name: act.name,
      startTime: currentTime,
      endTime: currentTime + actDuration,
      focus: act.focus,
    });
    currentTime += actDuration;
  }

  return acts;
}

export function suggestPacing(
  contentLength: 'short' | 'medium' | 'long',
  targetAudience: 'general' | 'technical' | 'executive'
): {
  recommendedDuration: number;
  sceneDuration: number;
  transitionDuration: number;
} {
  const baseTimings = {
    short: { duration: 30000, scene: 5000, transition: 300 },
    medium: { duration: 60000, scene: 8000, transition: 500 },
    long: { duration: 120000, scene: 12000, transition: 500 },
  };

  const audienceMultipliers = {
    general: 1.0,
    technical: 1.2,
    executive: 0.8,
  };

  const base = baseTimings[contentLength];
  const multiplier = audienceMultipliers[targetAudience];

  return {
    recommendedDuration: base.duration * multiplier,
    sceneDuration: base.scene * multiplier,
    transitionDuration: base.transition,
  };
}
