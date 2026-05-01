# Done Criteria

This document defines the definition of done for implementation tasks in this repository.

## General

- Code compiles and tests pass locally.
- Lint/format rules are applied consistently.
- No secrets are committed; environment variables are documented in `.env.example`.
- Sensitive actions emit audit events (or have explicit TODOs + tests for the audit hook).
- Changes are scoped to relevant modules and preserve modular monolith boundaries.

## Bootstrap (Task 1)

Acceptance criteria for "Bootstrap the repository and project conventions":

- Workspace builds successfully.
- Local dev dependencies can start.
- Health endpoints can be stubbed.

