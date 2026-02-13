# ADR 0001: Clean-Room Commercial Development Policy

- Status: Accepted
- Date: 2026-02-13

## Context

The project targets commercial use and needs high-quality rendering features inspired by industry tools. We must avoid license risk from source-code copying while still adopting proven concepts.

## Decision

Adopt a strict clean-room development policy:

- concept inspiration is allowed
- source code copying is prohibited
- original APIs/utilities must be implemented in this repository
- all added dependencies must be license-reviewed for commercial distribution

## Consequences

- Implementation may take longer than copy-based approaches.
- Legal/compliance risk is reduced.
- PR reviews require explicit clean-room confirmations.

## Related Docs

- `docs/clean-room-commercial-checklist.md`
- `.github/pull_request_template.md`
