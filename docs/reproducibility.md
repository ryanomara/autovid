# Reproducibility and Determinism

W6 introduces deterministic render checks to ensure repeatable output quality for the same input project.

## Determinism Policy

- Identical input + identical runtime configuration should produce identical output bytes for deterministic fixtures.
- Current gate uses exact SHA-256 equality on repeated render outputs for `examples/simple-title.json`.

## Run Determinism Check

```bash
npm run build
npm run check:determinism
```

Output artifact:

- `artifacts/w6/determinism-report.json`

## Notes

- Determinism checks run with `--render-without-tts` to isolate video pipeline behavior.
- If this gate fails, treat it as a release blocker until reproducibility is restored.
