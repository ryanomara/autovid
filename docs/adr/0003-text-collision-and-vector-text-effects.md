# ADR 0003: Text Collision Prevention and Vector-Style Text Effects

- Status: Accepted
- Date: 2026-02-13

## Context

Generated scenes showed text overlaps and weak readability under motion. Financial storytelling requires highly legible typography.

## Decision

Add typography safety and stylization primitives:

- frame-time text collision resolution for non-position-animated text
- `textStroke` support for stronger contrast
- `textMask` with `cutout`/`inverse` modes

## Consequences

- Reduced text-on-text collisions in generated scenes.
- Better contrast resilience without uncontrolled palette changes.
- More expressive typography effects for hero titles and overlays.

## Related Implementation

- `src/core/engine/renderer.ts`
- `src/core/engine/text-renderer.ts`
- `src/core/engine/compositor.ts`
