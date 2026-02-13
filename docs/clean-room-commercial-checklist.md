# Clean-Room Commercial Checklist

Use this checklist when implementing concept-inspired rendering features without copying third-party framework code.

## 1) Scope And Intent

- Build original implementation in this repo.
- Use external projects for ideas only (architecture patterns, terminology, workflows).
- Do not copy source code, internal utilities, or proprietary assets.

## 2) Allowed vs Forbidden

- Allowed:
  - High-level concepts (frame-based rendering, declarative scenes, timeline interpolation).
  - Public API inspiration, reinterpreted with our own types and naming.
  - Independent implementations built from our own design docs.
- Forbidden:
  - Copy/paste or close paraphrase of source code.
  - Porting internal helper logic line-by-line.
  - Using third-party trademarks in product naming/marketing in a confusing way.

## 3) Implementation Guardrails

- Write a short design note before coding:
  - Problem, constraints, data model, rendering strategy, fallback behavior.
- Define our own interfaces and naming conventions first.
- Implement from design note, not from external source files.
- Keep commits small and auditable by feature.

## 4) Dependency License Hygiene

- For every new dependency:
  - Record package, version, license, URL, and purpose.
  - Verify license is suitable for commercial distribution.
- Prefer permissive licenses for core render path dependencies.
- Keep third-party notices current in project docs.

## 5) Evidence Of Independent Development

- Keep design notes in `docs/` with date and rationale.
- In PR description, include:
  - "Implementation source: internal design note"
  - "No external code copied"
  - Dependency/license summary (if any)
- Link benchmark comparisons as outputs, not copied code.

## 6) PR Review Checklist (Required)

- [ ] No copied third-party source fragments.
- [ ] New code matches project naming/style patterns.
- [ ] Added dependencies have commercial-safe licenses.
- [ ] Third-party notices updated where required.
- [ ] Feature behavior documented with examples.
- [ ] Tests/validation added for new render behavior.

## 7) Charting And Graphics Specific Rules

- Implement chart primitives from our own geometry/math.
- Use independent axis/scale definitions in our type system.
- Keep visual quality checks as measurable criteria (label collisions, readability, anti-aliasing strategy).
- If using external chart libs, treat them as black-box dependencies and honor license terms.

## 8) Contributor Prompt Snippet

Use this in implementation prompts:

"Implement using clean-room rules: concept inspiration only, no external code copying, original APIs and utilities, commercial-safe dependencies only, and include license notes for any new package."

## 9) Escalation

- If license terms are unclear, pause integration and request legal/product review.
- If a contributor cannot confirm independent implementation, reject the PR.
