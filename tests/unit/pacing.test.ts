import { describe, it, expect } from '../setup.js';
import {
  pacingPresets,
  getPacingPreset,
  calculateSceneDuration,
  calculateCalloutTiming,
  calculateLabelDensity,
  validateTransitionDuration,
  calculatePacingScore,
  applyPacingPreset,
} from '../../src/core/storytelling/pacing.js';

describe('Pacing System (M2)', () => {
  describe('pacingPresets', () => {
    it('has all required presets', () => {
      expect(pacingPresets.broadcast).toBeDefined();
      expect(pacingPresets.social).toBeDefined();
      expect(pacingPresets.explainer).toBeDefined();
      expect(pacingPresets.custom).toBeDefined();
    });

    it('broadcast preset has fast pacing', () => {
      const preset = pacingPresets.broadcast;
      expect(preset.transitionDuration).toBe(650);
      expect(preset.chartStabilizationDelay).toBe(1500);
      expect(preset.maxLabels).toBe(4);
    });

    it('explainer preset has slower pacing', () => {
      const preset = pacingPresets.explainer;
      expect(preset.transitionDuration).toBe(900);
      expect(preset.chartStabilizationDelay).toBe(4000);
      expect(preset.maxLabels).toBe(8);
    });
  });

  describe('getPacingPreset', () => {
    it('returns correct preset by name', () => {
      expect(getPacingPreset('broadcast').name).toBe('broadcast');
      expect(getPacingPreset('social').name).toBe('social');
    });

    it('handles case insensitivity', () => {
      expect(getPacingPreset('BROADCAST').name).toBe('broadcast');
      expect(getPacingPreset('Social').name).toBe('social');
    });

    it('falls back to explainer for unknown presets', () => {
      expect(getPacingPreset('unknown').name).toBe('explainer');
    });
  });

  describe('calculateSceneDuration', () => {
    it('adjusts for content complexity', () => {
      const preset = pacingPresets.broadcast;
      const simple = calculateSceneDuration('simple', preset);
      const complex = calculateSceneDuration('complex', preset);

      expect(simple).toBeLessThan(complex);
    });
  });

  describe('calculateCalloutTiming', () => {
    it('delays callouts for charts when configured', () => {
      const preset = pacingPresets.broadcast;
      const timing = calculateCalloutTiming(5000, preset, true);

      expect(timing.initialCalloutTime).toBeGreaterThan(0);
      expect(timing.waitForStabilization).toBe(false); // broadcast doesn't wait
    });

    it('shows callouts earlier without chart', () => {
      const preset = pacingPresets.explainer;
      const withChart = calculateCalloutTiming(10000, preset, true);
      const withoutChart = calculateCalloutTiming(10000, preset, false);

      expect(withoutChart.initialCalloutTime).toBeLessThan(withChart.initialCalloutTime);
    });
  });

  describe('calculateLabelDensity', () => {
    it('respects max labels from preset', () => {
      const preset = pacingPresets.broadcast;
      const density = calculateLabelDensity(20, 5000, preset);

      expect(density.recommendedLabels).toBeLessThanOrEqual(preset.maxLabels);
    });

    it('calculates stride correctly', () => {
      const preset = pacingPresets.social;
      const density = calculateLabelDensity(10, 8000, preset);

      // Should show all when data points <= recommended
      expect(density.showAll).toBe(true);
    });

    it('uses stride when more data than labels', () => {
      const preset = pacingPresets.explainer;
      const density = calculateLabelDensity(20, 15000, preset);

      expect(density.stride).toBeGreaterThan(1);
    });
  });

  describe('validateTransitionDuration', () => {
    it('validates optimal duration', () => {
      const preset = pacingPresets.broadcast;
      const result = validateTransitionDuration(650, preset);

      expect(result.valid).toBe(true);
      expect(result.severity).toBe('info');
    });

    it('flags too fast transitions', () => {
      const preset = pacingPresets.explainer;
      const result = validateTransitionDuration(200, preset);

      expect(result.valid).toBe(false);
      expect(result.severity).toBe('error');
    });

    it('flags too slow transitions', () => {
      const preset = pacingPresets.broadcast;
      const result = validateTransitionDuration(2000, preset);

      expect(result.valid).toBe(false);
      expect(result.severity).toBe('error');
    });
  });

  describe('calculatePacingScore', () => {
    it('returns high score for optimal pacing', () => {
      const preset = pacingPresets.social;
      const result = calculatePacingScore(
        8000, // scene duration within range
        750, // transition within range
        5, // data points
        4, // labels
        preset
      );

      expect(result.score).toBeGreaterThan(80);
    });

    it('returns lower score for poor pacing', () => {
      const preset = pacingPresets.broadcast;
      const result = calculatePacingScore(
        15000, // too long for broadcast
        1500, // too slow
        20, // too many labels
        15,
        preset
      );

      expect(result.score).toBeLessThan(70);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('applyPacingPreset', () => {
    it('calculates correct timing for scene count', () => {
      const result = applyPacingPreset('broadcast', 3);

      expect(result.sceneDuration).toBeGreaterThan(0);
      expect(result.totalTransitionTime).toBeGreaterThan(0);
      expect(result.availableTime).toBeLessThan(result.basePreset.targetDuration);
    });

    it('generates warnings for insufficient time', () => {
      const result = applyPacingPreset('broadcast', 10);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('applies custom config overrides', () => {
      const result = applyPacingPreset('custom', 3, {
        targetDuration: 30000,
      });

      expect(result.basePreset.targetDuration).toBe(30000);
    });
  });
});
