# Release Notes Draft: RC1

## Highlights

- Added W5 template ecosystem packs (finance/business/sports) with 9 production-ready templates.
- Added fast preview workflow with scene fingerprint cache awareness via `autovid preview-fast`.
- Added determinism checks and reproducibility documentation.
- Added reliability dashboard generation across benchmark quality, determinism, and preview performance.

## Commands

- `autovid preview-fast <project> --output <preview.mp4> [--cache-dir <path>] [--force]`
- `npm run check:determinism`
- `npm run benchmark:preview`
- `npm run report:reliability`

## Artifacts

- `artifacts/w6/determinism-report.json`
- `artifacts/w6/preview-performance-report.json`
- `artifacts/w6/reliability-dashboard.md`

## Known Limits

- Determinism gate currently validates a baseline fixture (`examples/simple-title.json`) and should be expanded over time.
- Fast preview prioritizes iteration speed over output fidelity (downscaled resolution, lower FPS, clipped scene duration).
