# AutoVid Quality Rubric

This rubric defines objective quality gates for stats-driven videos.

## 1. Visual Readability Metrics

- Text overlap count: target `0`.
- Chart label-mark collisions: target `0`.
- Contrast failures (text/annotation): target `0`.
- Overcrowded scene flags (more than one dominant focal area): target `0`.

## 2. Chart Quality Metrics

- Axis/grid/data order correctness: required.
- Value-label positional stability: required.
- Label density control active: required for 6+ point line charts.
- Semantic color consistency (positive/negative/neutral): required.

## 3. Motion and Pacing Metrics

- Callouts appear after chart stabilization window: required.
- Transition duration consistency in sequence: preferred `650ms` to `900ms`.
- No simultaneous high-salience conflicts (major camera move + dense text): required.

## 4. Domain Suitability Checks

- Finance: currency/percentage format consistency.
- Business: KPI card hierarchy and comparison clarity.
- Sports: scoreboard/event timeline readability.

## 5. Rubric Scoring (0-100)

- Readability: 35 points
- Chart precision: 25 points
- Motion/pacing: 20 points
- Domain semantics: 20 points

### Suggested Release Thresholds

- Production candidate: `>= 90`
- Internal preview: `>= 80`
- Needs revision: `< 80`

## 6. Benchmark Fixture Set

Use fixtures in `examples/benchmarks/`:

- `finance-benchmark.json` (4 scenes)
- `business-benchmark.json` (4 scenes)
- `sports-benchmark.json` (4 scenes)

## 7. Regression Comparison Protocol (Before/After)

For any renderer-affecting change, run and publish both:

1. **Before**: benchmark on the base branch (or previous commit)
2. **After**: benchmark on the change branch

Required protocol:

- Run `npm run benchmark:quality` on both revisions.
- Compare `artifacts/benchmarks/quality-report.json` summaries.
- Include metric deltas in PR/issue comment:
  - `textOverlapCount`
  - `labelCollisions`
  - `contrastFailures`
  - `frameSharpnessProxy`
- A change is blocked if any metric regresses beyond threshold:
  - `textOverlapCount` increases
  - `labelCollisions` increases
  - `contrastFailures` increases
  - `frameSharpnessProxy` drops by more than `0.02`

## 8. Execution Notes

- Run benchmark scenes with `--render-without-tts` for deterministic visual QA.
- Capture 3-5 key frames per scene for checklist review.
- Track regressions in issue comments with before/after frame references.

Automation:

- Use `npm run benchmark:quality -- --update-baseline` only when explicitly re-baselining expected quality.
- CI should run `npm run benchmark:quality -- --ci` and fail on threshold regressions.
