# Release Candidate Checklist (W6)

Use this checklist before creating an RC tag.

## Required Gates

- [ ] `npm run build`
- [ ] `npm test -- --run`
- [ ] `npm run benchmark:quality -- --ci`
- [ ] `npm run check:determinism`
- [ ] `npm run benchmark:preview`
- [ ] `npm run report:reliability`

## Signoff Criteria

- [ ] Benchmark quality gate passes on all domain fixtures.
- [ ] Determinism report indicates exact hash match across repeated renders.
- [ ] Fast preview is materially faster than full render (>= 1.5x for benchmark fixture).
- [ ] Reliability dashboard shows all checks passing.
- [ ] W5 template packs and docs index are discoverable from `README.md`.

## Evidence Paths

- `artifacts/benchmarks/quality-report.json`
- `artifacts/w6/determinism-report.json`
- `artifacts/w6/preview-performance-report.json`
- `artifacts/w6/reliability-dashboard.json`
- `artifacts/w6/reliability-dashboard.md`
