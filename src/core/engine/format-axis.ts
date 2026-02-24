/**
 * Axis formatting utilities for financial charts
 * Provides currency, percentage, and compact number formatting
 */

/**
 * Axis format types for financial data
 */
export type AxisFormatType =
  | 'number' // Plain numbers: 1000, 2500, 10000
  | 'currency' // Currency: $1K, $2.5K, $10K
  | 'percentage' // Percentages: 10%, 25%, 100%
  | 'compact'; // Compact: 1K, 2.5M, 1B

/**
 * Options for axis value formatting
 */
export interface AxisFormatOptions {
  /** Format type */
  type: AxisFormatType;
  /** Number of decimal places (default: varies by type) */
  decimals?: number;
  /** Currency symbol (default: $) */
  currencySymbol?: string;
  /** Show sign for positive numbers (default: false) */
  showSign?: boolean;
}

/**
 * Default format options by type
 */
const defaultOptions: Record<AxisFormatType, AxisFormatOptions> = {
  number: { type: 'number', decimals: 0 },
  currency: { type: 'currency', decimals: 1, currencySymbol: '$' },
  percentage: { type: 'percentage', decimals: 1 },
  compact: { type: 'compact', decimals: 1 },
};

/**
 * Format a number according to axis format options
 */
export function formatAxisValue(value: number, options: AxisFormatOptions): string {
  const opts = { ...defaultOptions[options.type], ...options };

  switch (opts.type) {
    case 'currency':
      return formatCurrency(value, opts.decimals, opts.currencySymbol ?? '$', opts.showSign);
    case 'percentage':
      return formatPercentage(value, opts.decimals, opts.showSign);
    case 'compact':
      return formatCompact(value, opts.decimals, opts.showSign);
    case 'number':
    default:
      return formatNumber(value, opts.decimals, opts.showSign);
  }
}

/**
 * Format as currency with K/M/B suffixes
 */
function formatCurrency(
  value: number,
  decimals: number = 1,
  symbol: string = '$',
  showSign: boolean = false
): string {
  const sign = showSign && value > 0 ? '+' : '';

  if (Math.abs(value) >= 1e9) {
    return `${sign}${symbol}${(value / 1e9).toFixed(decimals)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `${sign}${symbol}${(value / 1e6).toFixed(decimals)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `${sign}${symbol}${(value / 1e3).toFixed(decimals)}K`;
  }
  return `${sign}${symbol}${value.toFixed(decimals)}`;
}

/**
 * Format as percentage
 */
function formatPercentage(value: number, decimals: number = 1, showSign: boolean = false): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format as compact number (K, M, B)
 */
function formatCompact(value: number, decimals: number = 1, showSign: boolean = false): string {
  const sign = showSign && value > 0 ? '+' : '';

  if (Math.abs(value) >= 1e9) {
    return `${sign}${(value / 1e9).toFixed(decimals)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `${sign}${(value / 1e6).toFixed(decimals)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `${sign}${(value / 1e3).toFixed(decimals)}K`;
  }
  return `${sign}${value.toFixed(decimals)}`;
}

/**
 * Format as plain number
 */
function formatNumber(value: number, decimals: number = 0, showSign: boolean = false): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}`;
}

/**
 * Determine appropriate axis format from data range
 */
export function inferAxisFormat(values: number[]): AxisFormatType {
  if (values.length === 0) return 'number';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (min >= 0 && max <= 100) {
    const hasDecimals = values.some((v) => v % 1 !== 0);
    const looksPercentScale = max > 5 && range >= 10;
    if (!hasDecimals && looksPercentScale) {
      return 'percentage';
    }
  }

  // Check for large numbers suggesting currency/compact
  if (Math.abs(max) >= 1e6 || Math.abs(min) >= 1e6) {
    return 'compact';
  }

  if (Math.abs(max) >= 1e3 || Math.abs(min) >= 1e3) {
    return 'compact';
  }

  return 'number';
}

/**
 * Generate tick values for axis with smart spacing
 */
export function generateAxisTicks(
  min: number,
  max: number,
  targetTicks: number = 5,
  format: AxisFormatType = 'number'
): { value: number; label: string }[] {
  if (max === min) {
    return [{ value: min, label: formatAxisValue(min, { type: format }) }];
  }

  const range = max - min;
  const rawStep = range / (targetTicks - 1);

  // Round to nice numbers
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let niceStep: number;
  if (normalized <= 1) {
    niceStep = magnitude;
  } else if (normalized <= 2) {
    niceStep = 2 * magnitude;
  } else if (normalized <= 5) {
    niceStep = 5 * magnitude;
  } else {
    niceStep = 10 * magnitude;
  }

  // Generate ticks
  const ticks: { value: number; label: string }[] = [];
  const startValue = Math.ceil(min / niceStep) * niceStep;

  for (let v = startValue; v <= max + niceStep; v += niceStep) {
    if (v >= min - niceStep && v <= max + niceStep) {
      ticks.push({
        value: v,
        label: formatAxisValue(v, { type: format }),
      });
    }
  }

  return ticks;
}
