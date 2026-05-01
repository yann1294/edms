# EDMS / GED / IRS Repository Starter

This repository contains the initial system design and implementation planning documents for a modular-monolith EDMS platform.

## Included files

- `docs/system-design.md`
- `docs/api-contracts.md`
- `docs/security-rules.md`
- `docs/permission-matrix.md`
- `codex-backlog.md`

## Recommended stack

- Frontend: Next.js / React
- Backend: NestJS or Spring Boot
- Database: PostgreSQL
- Object storage: S3-compatible storage
- Search: OpenSearch / Elasticsearch
- Queue / workers: Redis + background workers

## Usage

Use these documents as the source of truth for:

1. repository bootstrap
2. architecture decisions
3. API implementation
4. authorization behavior
5. Codex task execution order

## Suggested next step

Feed `docs/system-design.md`, `docs/security-rules.md`, and `codex-backlog.md` to Codex before implementation work begins.
