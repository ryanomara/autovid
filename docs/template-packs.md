# W5 Template Packs

This document defines the W5 ecosystem template packs and points to production-ready scene templates.

## Finance (3)

- `examples/templates/finance/earnings-momentum.json`
- `examples/templates/finance/margin-bridge.json`
- `examples/templates/finance/valuation-snapshot.json`

## Business (3)

- `examples/templates/business/growth-efficiency.json`
- `examples/templates/business/pipeline-conversion.json`
- `examples/templates/business/retention-health.json`

## Sports (3)

- `examples/templates/sports/offense-defense-balance.json`
- `examples/templates/sports/clutch-performance.json`
- `examples/templates/sports/season-momentum.json`

## Usage

Render any template directly:

```bash
node dist/cli/index.js create examples/templates/finance/earnings-momentum.json outputs/earnings-momentum.mp4 --render-without-tts
```

Validate a template against composition contracts:

```bash
node dist/cli/index.js validate examples/templates/business/growth-efficiency.json --mode strict
```
