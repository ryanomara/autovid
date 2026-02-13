# ADR 0004: W5 Ecosystem Template Pack Contract

## Context

W5 requires ecosystem-level template assets that contributors and agents can reuse with minimal onboarding time.

## Decision

Adopt a template-pack contract with the following requirements:

- At least 9 templates total, with 3 templates per domain (finance/business/sports).
- Every template must be a valid `VideoProject` JSON file that passes strict composition contracts.
- Title layers use high-priority z-index and explicit overlap policy for readability safety.
- Templates remain render-first assets in `examples/templates/**` so they are runnable without extra code generation.

## Consequences

- Contributors can ship domain scenes quickly by starting from validated templates.
- CI and manual validation can operate on deterministic file paths.
- Template quality relies on contracts plus rubric enforcement, not ad-hoc style choices.
