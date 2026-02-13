# AutoVid Roadmap

## Current Direction

AutoVid is optimizing for TV-quality short-form financial storytelling with:

- precise chart rendering
- collision-safe typography
- swatch-driven visual consistency
- companion visual asset workflows

## Milestones

### M1: Chart Fidelity Upgrade

- Anti-aliased chart lines and point rendering improvements
- Smart label placement and avoidance in dense charts
- Axis/tick formatting presets for financial units
- Visual regression fixtures for line and bar charts

### M2: Pacing and Readability System

- Scene pacing presets (broadcast, social, explainer)
- Automatic callout delay until chart draw stabilization
- Label density heuristics tied to scene duration and motion intensity
- Transition consistency validation checks

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
