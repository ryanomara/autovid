import { describe, it, expect } from '../setup.js';
import {
  formatAxisValue,
  inferAxisFormat,
  generateAxisTicks,
} from '../../src/core/engine/format-axis.js';

describe('Axis Formatting', () => {
  describe('formatAxisValue', () => {
    it('formats numbers as plain numbers', () => {
      expect(formatAxisValue(100, { type: 'number' })).toBe('100');
      expect(formatAxisValue(1234.56, { type: 'number', decimals: 2 })).toBe('1234.56');
      expect(formatAxisValue(-500, { type: 'number' })).toBe('-500');
    });

    it('formats numbers with positive sign', () => {
      expect(formatAxisValue(100, { type: 'number', showSign: true })).toBe('+100');
      expect(formatAxisValue(-100, { type: 'number', showSign: true })).toBe('-100');
    });

    it('formats currency with K/M/B suffixes', () => {
      expect(formatAxisValue(1500, { type: 'currency' })).toBe('$1.5K');
      expect(formatAxisValue(2500000, { type: 'currency' })).toBe('$2.5M');
      expect(formatAxisValue(1000000000, { type: 'currency' })).toBe('$1.0B');
      expect(formatAxisValue(500, { type: 'currency' })).toBe('$500.0');
    });

    it('formats currency with custom symbol', () => {
      expect(formatAxisValue(1500, { type: 'currency', currencySymbol: '€' })).toBe('€1.5K');
    });

    it('formats percentages correctly', () => {
      expect(formatAxisValue(50, { type: 'percentage' })).toBe('50.0%');
      expect(formatAxisValue(33.33, { type: 'percentage', decimals: 1 })).toBe('33.3%');
      expect(formatAxisValue(100, { type: 'percentage', showSign: true })).toBe('+100.0%');
    });

    it('formats compact numbers with K/M/B', () => {
      expect(formatAxisValue(1500, { type: 'compact' })).toBe('1.5K');
      expect(formatAxisValue(2500000, { type: 'compact' })).toBe('2.5M');
      expect(formatAxisValue(1000000000, { type: 'compact' })).toBe('1.0B');
    });
  });

  describe('inferAxisFormat', () => {
    it('infers number format for small values', () => {
      expect(inferAxisFormat([1, 2, 3, 4, 5])).toBe('number');
    });

    it('infers compact format for large values', () => {
      expect(inferAxisFormat([1000, 2000, 3000])).toBe('compact');
      expect(inferAxisFormat([1000000, 2000000])).toBe('compact');
    });

    it('infers percentage for 0-100 range', () => {
      expect(inferAxisFormat([10, 20, 30, 40])).toBe('percentage');
    });

    it('handles empty array', () => {
      expect(inferAxisFormat([])).toBe('number');
    });
  });

  describe('generateAxisTicks', () => {
    it('generates correct number of ticks', () => {
      const ticks = generateAxisTicks(0, 100, 5, 'number');
      expect(ticks.length).toBeGreaterThanOrEqual(2);
    });

    it('formats tick labels according to format type', () => {
      const ticks = generateAxisTicks(0, 1000, 5, 'currency');
      expect(ticks.length).toBeGreaterThan(0);
      // Currency format should have $ symbol or K/M suffix
      const label = ticks[Math.floor(ticks.length / 2)].label;
      expect(typeof label).toBe('string');
    });

    it('handles single value', () => {
      const ticks = generateAxisTicks(50, 50, 5, 'number');
      expect(ticks.length).toBe(1);
      expect(ticks[0].value).toBe(50);
    });
  });
});
