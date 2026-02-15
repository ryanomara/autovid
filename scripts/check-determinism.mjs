#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const artifactsDir = resolve(root, 'artifacts/w6');
const runAPath = join(artifactsDir, 'determinism-run-a.mp4');
const runBPath = join(artifactsDir, 'determinism-run-b.mp4');
const reportPath = join(artifactsDir, 'determinism-report.json');
const fixturePath = resolve(root, 'examples/simple-title.json');

if (!existsSync(fixturePath)) {
  throw new Error(`Fixture missing: ${fixturePath}`);
}

mkdirSync(artifactsDir, { recursive: true });

for (const outputPath of [runAPath, runBPath]) {
  if (existsSync(outputPath)) {
    rmSync(outputPath, { force: true });
  }
}

function runRender(outputPath) {
  const startedAt = Date.now();
  const result = spawnSync(
    'node',
    ['dist/cli/index.js', 'create', fixturePath, outputPath, '--render-without-tts'],
    {
      cwd: root,
      env: {
        ...process.env,
        CI: 'true',
        LOG_LEVEL: 'warn',
      },
      stdio: 'inherit',
    }
  );
  const durationMs = Date.now() - startedAt;

  if (result.status !== 0) {
    throw new Error(
      `Determinism render failed for ${outputPath}: status=${result.status} signal=${result.signal ?? 'none'}`
    );
  }

  return durationMs;
}

function frameDigest(path) {
  const result = spawnSync('ffmpeg', ['-i', path, '-an', '-f', 'framemd5', '-'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.status !== 0) {
    throw new Error(
      `Failed to compute frame digest for ${path}: ${result.stderr || result.stdout}`
    );
  }

  const lines = (result.stdout || '')
    .split('\n')
    .filter((line) => line.trim().length > 0 && !line.startsWith('#'));

  return createHash('sha256').update(lines.join('\n')).digest('hex');
}

const firstDurationMs = runRender(runAPath);
const secondDurationMs = runRender(runBPath);

const firstHash = frameDigest(runAPath);
const secondHash = frameDigest(runBPath);

const report = {
  generatedAt: new Date().toISOString(),
  fixture: 'examples/simple-title.json',
  firstRun: {
    outputPath: runAPath,
    durationMs: firstDurationMs,
    frameDigestSha256: firstHash,
  },
  secondRun: {
    outputPath: runBPath,
    durationMs: secondDurationMs,
    frameDigestSha256: secondHash,
  },
  deterministic: firstHash === secondHash,
  tolerancePolicy: 'Exact frame digest match via ffmpeg framemd5 for repeated render of same input',
};

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (!report.deterministic) {
  console.error('[determinism] FAILED: hashes differ across repeated renders');
  process.exit(1);
}

console.log('[determinism] PASSED');
