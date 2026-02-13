# ADR 0002: Introduce Native Chart Layer for Financial Scenes

- Status: Accepted
- Date: 2026-02-13

## Context

Finance videos needed cleaner and more exact charts. Existing examples used shape-based approximations that were difficult to maintain and visually inconsistent.

## Decision

Add a first-class `chart` layer type supporting:

- line charts
- bar charts
- axis/grid/labels/value rendering
- animated reveal via `chartProgress`

## Consequences

- Chart construction becomes structured and reusable.
- Example JSON complexity decreases for chart scenes.
- Current renderer remains raster-based; additional fidelity work (anti-aliasing/vector path) is tracked separately.

## Related Implementation

- `src/types/index.ts` (`ChartLayer`)
- `src/core/engine/chart-renderer.ts`
- `src/core/engine/renderer.ts`
