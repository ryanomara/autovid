#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const artifactsDir = resolve(root, 'artifacts/w6');
const benchmarkPath = resolve(root, 'artifacts/benchmarks/quality-report.json');
const determinismPath = resolve(root, 'artifacts/w6/determinism-report.json');
const previewPerfPath = resolve(root, 'artifacts/w6/preview-performance-report.json');
const dashboardJsonPath = resolve(root, 'artifacts/w6/reliability-dashboard.json');
const dashboardMdPath = resolve(root, 'artifacts/w6/reliability-dashboard.md');

mkdirSync(artifactsDir, { recursive: true });

function readJson(path) {
  if (!existsSync(path)) {
    throw new Error(`Required report missing: ${path}`);
  }

  return JSON.parse(readFileSync(path, 'utf8'));
}

const benchmark = readJson(benchmarkPath);
const determinism = readJson(determinismPath);
const previewPerformance = readJson(previewPerfPath);

const dashboard = {
  generatedAt: new Date().toISOString(),
  checks: {
    benchmarkGatePassed: Boolean(benchmark?.summary?.passed),
    deterministic: Boolean(determinism?.deterministic),
    previewMateriallyFaster: Boolean(previewPerformance?.materiallyFaster),
  },
  benchmark: {
    totalFixtures: Number(benchmark?.summary?.totalFixtures ?? 0),
    totalScenes: Number(benchmark?.summary?.totalScenes ?? 0),
    totalErrors: Number(benchmark?.summary?.totalErrors ?? 0),
    frameSharpnessProxy: Number(benchmark?.summary?.metrics?.frameSharpnessProxy ?? 0),
  },
  determinism: {
    fixture: determinism?.fixture,
    firstRunMs: Number(determinism?.firstRun?.durationMs ?? 0),
    secondRunMs: Number(determinism?.secondRun?.durationMs ?? 0),
    exactHashMatch: Boolean(determinism?.deterministic),
  },
  previewPerformance: {
    fixture: previewPerformance?.fixture,
    fullRenderMs: Number(previewPerformance?.fullRenderMs ?? 0),
    fastPreviewMs: Number(previewPerformance?.fastPreviewMs ?? 0),
    speedupRatio: Number(previewPerformance?.speedupRatio ?? 0),
    materiallyFaster: Boolean(previewPerformance?.materiallyFaster),
  },
};

dashboard.passed =
  dashboard.checks.benchmarkGatePassed &&
  dashboard.checks.deterministic &&
  dashboard.checks.previewMateriallyFaster;

const md = `# W6 Reliability Dashboard

Generated: ${dashboard.generatedAt}

## Checks

- Benchmark gate passed: ${dashboard.checks.benchmarkGatePassed ? 'yes' : 'no'}
- Determinism passed: ${dashboard.checks.deterministic ? 'yes' : 'no'}
- Preview materially faster: ${dashboard.checks.previewMateriallyFaster ? 'yes' : 'no'}
- Overall: ${dashboard.passed ? 'PASS' : 'FAIL'}

## Benchmark Summary

- Fixtures: ${dashboard.benchmark.totalFixtures}
- Scenes: ${dashboard.benchmark.totalScenes}
- Errors: ${dashboard.benchmark.totalErrors}
- Frame sharpness proxy: ${dashboard.benchmark.frameSharpnessProxy}

## Determinism

- Fixture: ${dashboard.determinism.fixture}
- First run: ${dashboard.determinism.firstRunMs} ms
- Second run: ${dashboard.determinism.secondRunMs} ms
- Exact hash match: ${dashboard.determinism.exactHashMatch ? 'yes' : 'no'}

## Preview Performance

- Fixture: ${dashboard.previewPerformance.fixture}
- Full render: ${dashboard.previewPerformance.fullRenderMs} ms
- Fast preview: ${dashboard.previewPerformance.fastPreviewMs} ms
- Speedup ratio: ${dashboard.previewPerformance.speedupRatio}x
- Materially faster (>=1.5x): ${dashboard.previewPerformance.materiallyFaster ? 'yes' : 'no'}
`;

writeFileSync(dashboardJsonPath, `${JSON.stringify(dashboard, null, 2)}\n`, 'utf8');
writeFileSync(dashboardMdPath, md, 'utf8');

if (!dashboard.passed) {
  console.error('[reliability-dashboard] FAILED');
  process.exit(1);
}

console.log('[reliability-dashboard] PASSED');
