#!/usr/bin/env node

import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();

const validFixtures = [
  'examples/benchmarks/finance-benchmark.json',
  'examples/benchmarks/business-benchmark.json',
  'examples/benchmarks/sports-benchmark.json',
];

const invalidFixtures = [
  'examples/validation/invalid-title-zindex.json',
  'examples/validation/invalid-line-chart-data.json',
];

function runValidate(projectPath, mode, reportPath) {
  mkdirSync(dirname(reportPath), { recursive: true });

  const result = spawnSync(
    process.execPath,
    ['dist/cli/index.js', 'validate', projectPath, '--mode', mode, '--report', reportPath],
    {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
    }
  );

  return result;
}

let failed = false;

for (const fixture of validFixtures) {
  const reportPath = resolve(ROOT, 'artifacts/benchmarks', `preflight-${fixture.split('/').pop()}`);
  const result = runValidate(resolve(ROOT, fixture), 'strict', reportPath);
  if (result.status !== 0) {
    failed = true;
    console.error(`[validate:contracts] expected PASS but failed: ${fixture}`);
    if (result.stdout) console.error(result.stdout.trim());
    if (result.stderr) console.error(result.stderr.trim());
  } else {
    console.log(`[validate:contracts] PASS ${fixture}`);
  }
}

for (const fixture of invalidFixtures) {
  const reportPath = resolve(ROOT, 'artifacts/benchmarks', `preflight-${fixture.split('/').pop()}`);
  const result = runValidate(resolve(ROOT, fixture), 'strict', reportPath);
  if (result.status === 0) {
    failed = true;
    console.error(`[validate:contracts] expected FAIL but passed: ${fixture}`);
    if (result.stdout) console.error(result.stdout.trim());
  } else {
    console.log(`[validate:contracts] FAIL (expected) ${fixture}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log('[validate:contracts] all checks passed');
