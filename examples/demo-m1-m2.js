#!/usr/bin/env node
/**
 * M1 & M2 Features Demo Script
 * Run: node examples/demo-m1-m2.js
 */

const path = require('path');

// Import built modules
const { formatAxisValue, inferAxisFormat } = require('./dist/core/engine/format-axis.js');
const {
  getPacingPreset,
  calculatePacingScore,
  calculateLabelDensity,
  calculateCalloutTiming,
  applyPacingPreset,
} = require('./dist/core/storytelling/pacing.js');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║           M1 & M2 Features Demo - AutoVid                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════
// M1: Chart Fidelity Features
// ═══════════════════════════════════════════════════════════════════

console.log('┌──────────────────────────────────────────────────────────────┐');
console.log('│ M1: Chart Fidelity Upgrade                                  │');
console.log('└──────────────────────────────────────────────────────────────┘\n');

// Financial formatting
console.log('📊 Financial Axis Formatting:');
console.log('   $1,500       →', formatAxisValue(1500, { type: 'currency' }));
console.log('   $2,500,000   →', formatAxisValue(2500000, { type: 'currency' }));
console.log('   $10,000,000  →', formatAxisValue(10000000, { type: 'currency' }));
console.log('   50%          →', formatAxisValue(50, { type: 'percentage' }));
console.log('   33.3%        →', formatAxisValue(33.3, { type: 'percentage', decimals: 1 }));

// Auto-infer format
console.log('\n🔍 Auto-Infer Format:');
console.log('   [10, 20, 30]      →', inferAxisFormat([10, 20, 30]));
console.log('   [1000, 2000]      →', inferAxisFormat([1000, 2000]));
console.log('   [1.2, 2.5, 3.8]   →', inferAxisFormat([1.2, 2.5, 3.8]));

// ═══════════════════════════════════════════════════════════════════
// M2: Pacing System
// ═══════════════════════════════════════════════════════════════════

console.log('\n┌──────────────────────────────────────────────────────────────┐');
console.log('│ M2: Pacing and Readability System                         │');
console.log('└──────────────────────────────────────────────────────────────┘\n');

// Presets
console.log('🎬 Pacing Presets:');
const presets = ['broadcast', 'social', 'explainer'];
for (const preset of presets) {
  const p = getPacingPreset(preset);
  console.log(
    `   ${preset.padEnd(10)} | Duration: ${p.targetDuration / 1000}s | Trans: ${p.transitionDuration}ms | Chart delay: ${p.chartStabilizationDelay}ms | Max labels: ${p.maxLabels}`
  );
}

// Label density
console.log('\n🏷️  Label Density (smartLabels):');
const density1 = calculateLabelDensity(20, 5000, getPacingPreset('broadcast'));
const density2 = calculateLabelDensity(20, 15000, getPacingPreset('explainer'));
console.log(
  '   20 data points, 5s scene, broadcast →',
  density1.recommendedLabels,
  'labels (stride:',
  density1.stride + ')'
);
console.log(
  '   20 data points, 15s scene, explainer →',
  density2.recommendedLabels,
  'labels (stride:',
  density2.stride + ')'
);

// Callout timing
console.log('\n⏱️  Callout Timing:');
const timing = calculateCalloutTiming(8000, getPacingPreset('social'), true);
console.log('   8s scene with chart (social):');
console.log('     - Show first callouts at:', timing.initialCalloutTime + 'ms');
console.log('     - Show final callouts at:', timing.finalCalloutTime + 'ms');
console.log('     - Wait for stabilization:', timing.waitForStabilization);

// Pacing score
console.log('\n📈 Pacing Score:');
const goodScore = calculatePacingScore(5000, 700, 5, 4, getPacingPreset('broadcast'));
const badScore = calculatePacingScore(15000, 1500, 20, 18, getPacingPreset('broadcast'));
console.log('   ✅ Good pacing (5s, 700ms, 5pts):', goodScore.score + '/100');
console.log('   ❌ Poor pacing (15s, 1500ms, 20pts):', badScore.score + '/100');
if (badScore.recommendations.length > 0) {
  console.log('     →', badScore.recommendations[0]);
}

// Apply preset
console.log('\n📋 Apply Pacing to Project:');
const applied = applyPacingPreset('broadcast', 4);
console.log('   4 scenes with broadcast preset:');
console.log('     - Scene duration:', applied.sceneDuration + 'ms');
console.log('     - Total transition:', applied.totalTransitionTime + 'ms');
console.log('     - Warnings:', applied.warnings.length || 'none');

// ═══════════════════════════════════════════════════════════════════
// Usage Example
// ═══════════════════════════════════════════════════════════════════

console.log('\n┌──────────────────────────────────────────────────────────────┐');
console.log('│ Usage in JSON                                             │');
console.log('└──────────────────────────────────────────────────────────────┘\n');

console.log('🎨 M1 - Chart with AA and financial formatting:');
console.log(`
{
  "type": "chart",
  "chartType": "line",
  "yAxis": { "format": "currency" },
  "style": {
    "antiAlias": true,
    "smartLabels": true
  }
}`);

console.log('\n⏱️  M2 - Scene with pacing:');
console.log(`
{
  "id": "kpi-scene",
  "transition": { "type": "fade", "duration": 650 },
  "_pacing": { "preset": "broadcast" }
}`);

console.log('\n✅ Demo complete! Run with: node examples/demo-m1-m2.js');
