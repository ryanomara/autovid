# AutoVid Roadmap

## Current Direction

AutoVid is optimizing for TV-quality short-form financial storytelling with:

- precise chart rendering
- collision-safe typography
- swatch-driven visual consistency
- companion visual asset workflows

## Milestones

### M1: Chart Fidelity Upgrade ✅ COMPLETED

- ✅ Anti-aliased chart lines and point rendering improvements
- ✅ Smart label placement and avoidance in dense charts
- ✅ Axis/tick formatting presets for financial units (currency, percentage, compact)
- ✅ Visual regression fixtures for line and bar charts

**Implementation:**
- Added `drawLineAA()` and `drawCircleAA()` in `src/core/engine/canvas.ts`
- Added `format-axis.ts` module with financial formatting utilities
- Updated `ChartLayer` type with `antiAlias`, `smartLabels`, and `format` options
- Integrated AA rendering into chart-renderer.ts line and bar charts
- Added 7 new tests for AA and financial formatting (27 total tests passing)

### M2: Pacing and Readability System ✅ COMPLETED

- ✅ Scene pacing presets (broadcast, social, explainer)
- ✅ Automatic callout delay until chart draw stabilization
- ✅ Label density heuristics tied to scene duration and motion intensity
- ✅ Transition consistency validation checks

**Implementation:**
- Added `pacing.ts` module with 4 presets (broadcast, social, explainer, custom)
- Added `calculateCalloutTiming()` for chart animation synchronization
- Added `calculateLabelDensity()` for intelligent label display
- Added `validateTransitionDuration()` and `calculatePacingScore()` for validation
- Integrated pacing into chart-renderer.ts with `sceneDuration` and `pacingPreset` options
- Added 25 new pacing tests (52 total tests passing)

### M3: Color and Swatch Enforcement

- Swatch role mapping validator (primary/secondary/accent/semantic)
- Contrast checker with fail-fast diagnostics
- Palette drift detection across scene timeline
- Auto-fallback stroke/tint strategies for low contrast

### M4: Companion Asset Pipeline Hardening

- Reliable endpoint discovery + retries for HF spaces
- Asset cache/indexing with deterministic IDs
- Asset quality checks before compositing
- Scene-level controls for motion intensity and readability protection

### M5: Remotion-Style Chart Scene Spike (Clean-Room)

- Evaluate vector-first chart scene path without copying third-party code
- Compare output quality against current raster path
- Define migration strategy if quality gains justify complexity

## Delivery Notes

- Keep changes incremental and test-backed.
- Treat readability regressions as blocking.
- Preserve clean-room commercial constraints documented in `docs/clean-room-commercial-checklist.md`.

## Tracking Issues

- #37 TV-grade chart fidelity pass (anti-aliasing + label placement)
- #38 Pacing presets and auto-callout timing
- #39 Swatch-role validator and contrast linting
- #40 HF companion asset pipeline hardening
- #41 Clean-room vector chart scene spike (Remotion-style concepts)
