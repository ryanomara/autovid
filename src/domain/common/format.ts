import type { SemanticMetricKind } from './types.js';

export function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatRatio(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}x`;
}

export function formatCompactNumber(value: number, decimals = 1): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatRecord(value: string): string {
  return value;
}

export function formatMetricValue(kind: SemanticMetricKind, value: number, decimals = 2): string {
  if (kind === 'currency' || kind === 'price') {
    if (Math.abs(value) >= 1_000_000_000) {
      return `${formatCompactNumber(value / 1_000_000_000, 2)}B`;
    }
    if (Math.abs(value) >= 1_000_000) {
      return `${formatCompactNumber(value / 1_000_000, 2)}M`;
    }
    return formatCurrency(value, decimals);
  }

  if (kind === 'percentage') {
    return formatPercentage(value, decimals);
  }

  if (kind === 'ratio' || kind === 'multiple') {
    return formatRatio(value, decimals);
  }

  if (kind === 'count') {
    return formatCompactNumber(value, decimals);
  }

  if (kind === 'durationMs') {
    return `${value.toFixed(decimals)}ms`;
  }

  return String(value);
}
