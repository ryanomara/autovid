# Collaborator Handoff Guide

Use this guide when picking up a milestone issue.

## 1) Understand scope and acceptance

- Read issue acceptance criteria first.
- Confirm dependencies are closed (for W5, ensure W3 and W4 outputs are present).

## 2) Build and test baseline

```bash
npm install
npm run build
npm test
```

## 3) Validate composition safety

```bash
node dist/cli/index.js validate examples/templates/finance/earnings-momentum.json --mode strict
node scripts/benchmark-quality.mjs --ci
```

## 4) Produce evidence for closure

- Render updated examples.
- Attach command output and relevant artifact paths.
- Link changed docs so the next collaborator can continue without extra context.

## 5) Closeout checklist

- Acceptance criteria all mapped to changed files.
- Verification commands passed locally.
- README and docs index links updated when adding new docs.
