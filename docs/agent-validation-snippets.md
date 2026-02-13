# Agent Validation Snippets (W4)

Use these snippets when driving AutoVid via an autonomous agent.

## 1) Strict CI Preflight

```bash
node dist/cli/index.js validate examples/benchmarks/finance-benchmark.json --mode strict --report artifacts/benchmarks/preflight-finance.json
```

Expected behavior:

- Exit code `0` when compliant
- Exit code `1` when contract violations exist

## 2) Permissive Authoring Preflight

```bash
node dist/cli/index.js validate examples/alphabet-finance-report-5y.json --mode permissive --report artifacts/benchmarks/preflight-alphabet.json
```

Use permissive mode while iterating. Warnings are allowed; errors are not.

## 3) Agent Prompt Snippet for Scene Composition

```text
Compose scenes using AutoVid composition contracts.

Rules:
1) Classify each scene as intro, kpi, line-chart, bar-chart, or outro.
2) Title-like text must use zIndex >= 900.
3) Every text layer must set overlapMode.
4) Keep transition durations in 650-900ms.
5) For charts, labels and values arrays must match in length.

Before rendering, run strict preflight:
node dist/cli/index.js validate <project.json> --mode strict --report <report.json>

If invalid, fix issues by path and suggestion from report.
```

## 4) Three End-to-End Agent Flow Fixtures

These are CI-gated strict-valid fixtures:

- `examples/benchmarks/finance-benchmark.json`
- `examples/benchmarks/business-benchmark.json`
- `examples/benchmarks/sports-benchmark.json`
