#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ROOT = process.cwd();
const FIXTURES = [
  'examples/benchmarks/finance-benchmark.json',
  'examples/benchmarks/business-benchmark.json',
  'examples/benchmarks/sports-benchmark.json',
];

const REPORT_JSON = resolve(ROOT, 'artifacts/benchmarks/quality-report.json');
const REPORT_MD = resolve(ROOT, 'artifacts/benchmarks/quality-report.md');
const BASELINE_JSON = resolve(ROOT, 'artifacts/benchmarks/baseline-quality-report.json');

const args = new Set(process.argv.slice(2));
const updateBaseline = args.has('--update-baseline');
const ciMode = args.has('--ci') || process.env.CI === 'true';

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function isObject(value) {
  return typeof value === 'object' && value !== null;
}

function channelToLinear(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(color) {
  if (!isObject(color)) return 0;
  const r = channelToLinear(Number(color.r ?? 0));
  const g = channelToLinear(Number(color.g ?? 0));
  const b = channelToLinear(Number(color.b ?? 0));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getBackground(project) {
  const bg = project?.config?.backgroundColor;
  if (isObject(bg)) return bg;
  return { r: 18, g: 20, b: 28, a: 1 };
}

function textBounds(layer) {
  const text = String(layer.text ?? '');
  const fontSize = Number(layer.fontSize ?? 32);
  const width = Math.max(8, text.length * fontSize * 0.56);
  const height = Math.max(8, fontSize * 1.2);
  const x = Number(layer.position?.x ?? 0);
  const y = Number(layer.position?.y ?? 0);
  const align = layer.textAlign ?? 'center';
  let left = x - width / 2;
  if (align === 'left') left = x;
  if (align === 'right') left = x - width;
  return {
    left,
    right: left + width,
    top: y - height / 2,
    bottom: y + height / 2,
  };
}

function safeEnvelopeViolations(box, width, height, fontSize) {
  const horizontalMargin = 0.6 * fontSize;
  const verticalMargin = 0.4 * fontSize;
  let violations = 0;
  if (box.left < horizontalMargin) violations += 1;
  if (box.right > width - horizontalMargin) violations += 1;
  if (box.top < verticalMargin) violations += 1;
  if (box.bottom > height - verticalMargin) violations += 1;
  return violations;
}

function hasRiskyDisplayGlyphs(text) {
  return /[\[\](){}]/.test(text);
}

function isTitleLikeTextLayer(layer) {
  if (layer?.type !== 'text') return false;

  const id = String(layer.id ?? '');
  const name = String(layer.name ?? '');
  const text = String(layer.text ?? '');
  const fontSize = Number(layer.fontSize ?? 0);
  const titlePattern = /(title|headline|intro|outro|summary|closing)/i;

  return (
    fontSize >= 56 || titlePattern.test(id) || titlePattern.test(name) || titlePattern.test(text)
  );
}

function intersects(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function analyzeFixture(filePath) {
  const abs = resolve(ROOT, filePath);
  const fixture = {
    fixture: filePath,
    exists: false,
    scenes: 0,
    metrics: {
      textOverlapCount: 0,
      labelCollisions: 0,
      contrastFailures: 0,
      riskyGlyphFormattingCount: 0,
      textSafeEnvelopeRiskCount: 0,
      titleLayerZIndexViolations: 0,
      frameSharpnessProxy: 1,
    },
    errors: [],
    warnings: [],
    passed: false,
  };

  if (!existsSync(abs)) {
    fixture.errors.push('fixture_missing');
    return fixture;
  }

  fixture.exists = true;

  let project;
  try {
    project = JSON.parse(readFileSync(abs, 'utf8'));
  } catch {
    fixture.errors.push('fixture_parse_error');
    return fixture;
  }

  const scenes = Array.isArray(project?.scenes) ? project.scenes : [];
  fixture.scenes = scenes.length;
  const projectWidth = Number(project?.config?.width ?? 1920);
  const projectHeight = Number(project?.config?.height ?? 1080);

  const bg = getBackground(project);
  let sharpnessPenalty = 0;
  let measuredLayers = 0;

  for (const scene of scenes) {
    const layers = Array.isArray(scene?.layers) ? scene.layers : [];

    const textLayers = layers.filter((layer) => layer?.type === 'text');
    const textBoxes = textLayers.map((layer) => ({
      layer,
      box: textBounds(layer),
    }));

    for (let i = 0; i < textBoxes.length; i += 1) {
      for (let j = i + 1; j < textBoxes.length; j += 1) {
        if (intersects(textBoxes[i].box, textBoxes[j].box)) {
          fixture.metrics.textOverlapCount += 1;
        }
      }
    }

    for (const { layer } of textBoxes) {
      const ratio = contrastRatio(layer.color ?? { r: 255, g: 255, b: 255, a: 1 }, bg);
      if (ratio < 4.5) {
        fixture.metrics.contrastFailures += 1;
      }

      const fontSize = Number(layer.fontSize ?? 32);
      const text = String(layer.text ?? '');
      if (fontSize >= 56 && hasRiskyDisplayGlyphs(text)) {
        fixture.metrics.riskyGlyphFormattingCount += 1;
      }

      const box = textBounds(layer);
      fixture.metrics.textSafeEnvelopeRiskCount += safeEnvelopeViolations(
        box,
        projectWidth,
        projectHeight,
        fontSize
      );

      if (isTitleLikeTextLayer(layer)) {
        const zIndex = Number(layer.zIndex);
        if (!Number.isFinite(zIndex) || zIndex < 900) {
          fixture.metrics.titleLayerZIndexViolations += 1;
        }
      }
    }

    const chartLayers = layers.filter((layer) => layer?.type === 'chart');
    for (const chart of chartLayers) {
      const labels = Array.isArray(chart?.data?.labels) ? chart.data.labels : [];
      const showValues = chart?.style?.showValues === true;
      const maxLabels = Number(chart?.style?.maxLabels ?? labels.length);

      if (labels.length > maxLabels) {
        fixture.metrics.labelCollisions += labels.length - maxLabels;
      }

      if (showValues && labels.length > 8) {
        fixture.metrics.labelCollisions += labels.length - 8;
      }
    }

    for (const layer of layers) {
      measuredLayers += 1;
      const sx = Number(layer?.scale?.x ?? 1);
      const sy = Number(layer?.scale?.y ?? 1);
      const rotation = Math.abs(Number(layer?.rotation ?? 0));
      const scalePenalty = Math.abs(sx - 1) + Math.abs(sy - 1);
      sharpnessPenalty += scalePenalty * 0.15;
      if (rotation > 0) {
        sharpnessPenalty += 0.05;
      }
    }
  }

  fixture.metrics.frameSharpnessProxy = clamp01(1 - sharpnessPenalty / Math.max(1, measuredLayers));

  if (fixture.scenes < 4) {
    fixture.errors.push('insufficient_scenes_per_fixture');
  }

  if (fixture.metrics.textOverlapCount > 0) fixture.errors.push('text_overlap_detected');
  if (fixture.metrics.labelCollisions > 0) fixture.errors.push('label_collisions_detected');
  if (fixture.metrics.contrastFailures > 0) fixture.errors.push('contrast_failures_detected');
  if (fixture.metrics.riskyGlyphFormattingCount > 0)
    fixture.errors.push('risky_glyph_formatting_detected');
  if (fixture.metrics.textSafeEnvelopeRiskCount > 0)
    fixture.errors.push('text_safe_envelope_risk_detected');
  if (fixture.metrics.titleLayerZIndexViolations > 0)
    fixture.errors.push('title_layer_zindex_violation_detected');
  if (fixture.metrics.frameSharpnessProxy < 0.9)
    fixture.errors.push('frame_sharpness_proxy_below_threshold');

  fixture.passed = fixture.errors.length === 0;
  return fixture;
}

function aggregateMetrics(fixtures) {
  return fixtures.reduce(
    (acc, fixture) => {
      acc.textOverlapCount += fixture.metrics.textOverlapCount;
      acc.labelCollisions += fixture.metrics.labelCollisions;
      acc.contrastFailures += fixture.metrics.contrastFailures;
      acc.riskyGlyphFormattingCount += fixture.metrics.riskyGlyphFormattingCount;
      acc.textSafeEnvelopeRiskCount += fixture.metrics.textSafeEnvelopeRiskCount;
      acc.titleLayerZIndexViolations += fixture.metrics.titleLayerZIndexViolations;
      acc.frameSharpnessProxy += fixture.metrics.frameSharpnessProxy;
      return acc;
    },
    {
      textOverlapCount: 0,
      labelCollisions: 0,
      contrastFailures: 0,
      riskyGlyphFormattingCount: 0,
      textSafeEnvelopeRiskCount: 0,
      titleLayerZIndexViolations: 0,
      frameSharpnessProxy: 0,
    }
  );
}

function compareToBaseline(currentSummary) {
  if (!existsSync(BASELINE_JSON)) {
    return [];
  }

  let baseline;
  try {
    baseline = JSON.parse(readFileSync(BASELINE_JSON, 'utf8'));
  } catch {
    return ['baseline_parse_error'];
  }

  const baselineMetrics = baseline?.summary?.metrics;
  if (!baselineMetrics) {
    return ['baseline_metrics_missing'];
  }

  const failures = [];
  const baselineTextOverlap = Number(baselineMetrics.textOverlapCount ?? 0);
  const baselineLabelCollisions = Number(baselineMetrics.labelCollisions ?? 0);
  const baselineContrastFailures = Number(baselineMetrics.contrastFailures ?? 0);
  const baselineRiskyGlyphFormatting = Number(baselineMetrics.riskyGlyphFormattingCount ?? 0);
  const baselineSafeEnvelopeRisk = Number(baselineMetrics.textSafeEnvelopeRiskCount ?? 0);
  const baselineTitleLayerZIndexViolations = Number(
    baselineMetrics.titleLayerZIndexViolations ?? 0
  );
  const baselineSharpness = Number(baselineMetrics.frameSharpnessProxy ?? 1);

  if (currentSummary.metrics.textOverlapCount > baselineTextOverlap) {
    failures.push('regression_text_overlap_count');
  }
  if (currentSummary.metrics.labelCollisions > baselineLabelCollisions) {
    failures.push('regression_label_collisions');
  }
  if (currentSummary.metrics.contrastFailures > baselineContrastFailures) {
    failures.push('regression_contrast_failures');
  }
  if (currentSummary.metrics.riskyGlyphFormattingCount > baselineRiskyGlyphFormatting) {
    failures.push('regression_risky_glyph_formatting_count');
  }
  if (currentSummary.metrics.textSafeEnvelopeRiskCount > baselineSafeEnvelopeRisk) {
    failures.push('regression_text_safe_envelope_risk_count');
  }
  if (currentSummary.metrics.titleLayerZIndexViolations > baselineTitleLayerZIndexViolations) {
    failures.push('regression_title_layer_zindex_violations');
  }
  if (currentSummary.metrics.frameSharpnessProxy < baselineSharpness - 0.02) {
    failures.push('regression_frame_sharpness_proxy');
  }

  return failures;
}

function toMarkdown(report) {
  const lines = [];
  lines.push('# Quality Benchmark Report');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`- Total fixtures: ${report.summary.totalFixtures}`);
  lines.push(`- Total scenes: ${report.summary.totalScenes}`);
  lines.push(`- Total errors: ${report.summary.totalErrors}`);
  lines.push(`- Total warnings: ${report.summary.totalWarnings}`);
  lines.push(`- Passed: ${report.summary.passed ? 'yes' : 'no'}`);
  lines.push('');
  lines.push('## Aggregate Metrics');
  lines.push('');
  lines.push(`- textOverlapCount: ${report.summary.metrics.textOverlapCount}`);
  lines.push(`- labelCollisions: ${report.summary.metrics.labelCollisions}`);
  lines.push(`- contrastFailures: ${report.summary.metrics.contrastFailures}`);
  lines.push(`- riskyGlyphFormattingCount: ${report.summary.metrics.riskyGlyphFormattingCount}`);
  lines.push(`- textSafeEnvelopeRiskCount: ${report.summary.metrics.textSafeEnvelopeRiskCount}`);
  lines.push(`- titleLayerZIndexViolations: ${report.summary.metrics.titleLayerZIndexViolations}`);
  lines.push(`- frameSharpnessProxy: ${report.summary.metrics.frameSharpnessProxy.toFixed(3)}`);
  lines.push('');
  lines.push(
    '| Fixture | Scenes | Text Overlap | Label Collisions | Contrast Failures | Risky Glyphs | Safe Envelope Risk | Title zIndex Violations | Sharpness Proxy | Passed |'
  );
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---|');

  for (const fixture of report.fixtures) {
    lines.push(
      `| ${fixture.fixture} | ${fixture.scenes} | ${fixture.metrics.textOverlapCount} | ${fixture.metrics.labelCollisions} | ${fixture.metrics.contrastFailures} | ${fixture.metrics.riskyGlyphFormattingCount} | ${fixture.metrics.textSafeEnvelopeRiskCount} | ${fixture.metrics.titleLayerZIndexViolations} | ${fixture.metrics.frameSharpnessProxy.toFixed(3)} | ${fixture.passed ? 'yes' : 'no'} |`
    );
  }

  if (report.summary.regressionFailures.length > 0) {
    lines.push('');
    lines.push('## Regression Failures');
    lines.push('');
    for (const failure of report.summary.regressionFailures) {
      lines.push(`- ${failure}`);
    }
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

const fixtureResults = FIXTURES.map(analyzeFixture);
const sceneCount = fixtureResults.reduce((total, fixture) => total + fixture.scenes, 0);
const metricTotals = aggregateMetrics(fixtureResults);
const avgSharpness = metricTotals.frameSharpnessProxy / Math.max(1, fixtureResults.length);

const summary = {
  totalFixtures: fixtureResults.length,
  totalScenes: sceneCount,
  totalErrors: fixtureResults.reduce((total, fixture) => total + fixture.errors.length, 0),
  totalWarnings: fixtureResults.reduce((total, fixture) => total + fixture.warnings.length, 0),
  metrics: {
    textOverlapCount: metricTotals.textOverlapCount,
    labelCollisions: metricTotals.labelCollisions,
    contrastFailures: metricTotals.contrastFailures,
    riskyGlyphFormattingCount: metricTotals.riskyGlyphFormattingCount,
    textSafeEnvelopeRiskCount: metricTotals.textSafeEnvelopeRiskCount,
    titleLayerZIndexViolations: metricTotals.titleLayerZIndexViolations,
    frameSharpnessProxy: Number(avgSharpness.toFixed(4)),
  },
  checks: {
    minimumScenesMet: sceneCount >= 12,
    minimumFixturesMet: fixtureResults.length >= 3,
  },
  regressionFailures: [],
  passed: false,
};

summary.regressionFailures = compareToBaseline(summary);
summary.passed =
  summary.totalErrors === 0 &&
  summary.checks.minimumScenesMet &&
  summary.metrics.textOverlapCount === 0 &&
  summary.metrics.labelCollisions === 0 &&
  summary.metrics.contrastFailures === 0 &&
  summary.metrics.riskyGlyphFormattingCount === 0 &&
  summary.metrics.textSafeEnvelopeRiskCount === 0 &&
  summary.metrics.titleLayerZIndexViolations === 0 &&
  summary.metrics.frameSharpnessProxy >= 0.9 &&
  summary.regressionFailures.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  fixtures: fixtureResults,
  summary,
};

mkdirSync(dirname(REPORT_JSON), { recursive: true });
writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(REPORT_MD, toMarkdown(report), 'utf8');

if (updateBaseline || !existsSync(BASELINE_JSON)) {
  writeFileSync(BASELINE_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

if (!summary.passed) {
  const reasons = [];
  if (!summary.checks.minimumScenesMet) reasons.push('minimumScenesMet=false');
  if (summary.metrics.textOverlapCount > 0) reasons.push('textOverlapCount>0');
  if (summary.metrics.labelCollisions > 0) reasons.push('labelCollisions>0');
  if (summary.metrics.contrastFailures > 0) reasons.push('contrastFailures>0');
  if (summary.metrics.riskyGlyphFormattingCount > 0) reasons.push('riskyGlyphFormattingCount>0');
  if (summary.metrics.textSafeEnvelopeRiskCount > 0) reasons.push('textSafeEnvelopeRiskCount>0');
  if (summary.metrics.titleLayerZIndexViolations > 0) reasons.push('titleLayerZIndexViolations>0');
  if (summary.metrics.frameSharpnessProxy < 0.9) reasons.push('frameSharpnessProxy<0.9');
  if (summary.regressionFailures.length > 0) {
    reasons.push(`regressions=${summary.regressionFailures.join(',')}`);
  }
  console.error(`[benchmark:quality] FAILED: ${reasons.join(' | ')}`);
  process.exitCode = 1;
} else {
  console.log('[benchmark:quality] PASSED');
}

if (ciMode && process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}
