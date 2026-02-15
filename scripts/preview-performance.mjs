#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const artifactsDir = resolve(root, 'artifacts/w6');
const fixturePath = resolve(root, 'examples/benchmarks/finance-benchmark.json');
const fullOutput = join(artifactsDir, 'preview-perf-full.mp4');
const fastOutput = join(artifactsDir, 'preview-perf-fast.mp4');
const reportPath = join(artifactsDir, 'preview-performance-report.json');
const cacheDir = join(artifactsDir, 'preview-cache');

mkdirSync(artifactsDir, { recursive: true });
mkdirSync(cacheDir, { recursive: true });

for (const outputPath of [fullOutput, fastOutput]) {
  if (existsSync(outputPath)) {
    rmSync(outputPath, { force: true });
  }
}

function run(name, args) {
  const startedAt = Date.now();
  const result = spawnSync('node', ['dist/cli/index.js', ...args], {
    cwd: root,
    env: {
      ...process.env,
      CI: 'true',
      LOG_LEVEL: 'warn',
    },
    stdio: 'inherit',
  });
  const durationMs = Date.now() - startedAt;

  if (result.status !== 0) {
    throw new Error(
      `[preview-performance] ${name} failed: status=${result.status} signal=${result.signal ?? 'none'}`
    );
  }

  return durationMs;
}

const fullDurationMs = run('full-render', [
  'create',
  fixturePath,
  fullOutput,
  '--render-without-tts',
]);

const fastDurationMs = run('fast-preview', [
  'preview-fast',
  fixturePath,
  '--output',
  fastOutput,
  '--cache-dir',
  cacheDir,
  '--force',
]);

const speedupRatio = Number((fullDurationMs / Math.max(1, fastDurationMs)).toFixed(3));
const fasterByMs = fullDurationMs - fastDurationMs;

const report = {
  generatedAt: new Date().toISOString(),
  fixture: 'examples/benchmarks/finance-benchmark.json',
  fullRenderMs: fullDurationMs,
  fastPreviewMs: fastDurationMs,
  fasterByMs,
  speedupRatio,
  materiallyFaster: speedupRatio >= 1.5,
  threshold: 'speedupRatio >= 1.5',
};

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (!report.materiallyFaster) {
  console.error(
    `[preview-performance] FAILED: expected >=1.5x speedup, got ${report.speedupRatio}x`
  );
  process.exit(1);
}

console.log('[preview-performance] PASSED');
