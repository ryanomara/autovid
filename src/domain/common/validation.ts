import type { ValidationIssue } from './types.js';

export function validateNumericMetrics(
  input: Record<string, unknown>,
  requiredMetricKeys: string[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const key of requiredMetricKeys) {
    if (!(key in input)) {
      issues.push({ key, reason: 'missing' });
      continue;
    }

    const value = input[key];
    if (typeof value !== 'number' || Number.isNaN(value)) {
      issues.push({ key, reason: 'not_numeric' });
      continue;
    }

    if (!Number.isFinite(value)) {
      issues.push({ key, reason: 'invalid_value', details: 'must be finite' });
    }
  }

  return issues;
}

export function validateAmbiguousAliases(
  input: Record<string, unknown>,
  aliasGroups: string[][]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const group of aliasGroups) {
    const present = group.filter((key) => key in input);
    if (present.length > 1) {
      issues.push({
        key: present.join('|'),
        reason: 'invalid_value',
        details: `ambiguous aliases present: ${present.join(', ')}`,
      });
    }
  }

  return issues;
}
