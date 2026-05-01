# EDMS / GED / IRS Repository Starter

This repository contains the system design and an initial implementation scaffold for a modular-monolith EDMS platform.

## Included files

- `docs/system-design.md`
- `docs/api-contracts.md`
- `docs/security-rules.md`
- `docs/permission-matrix.md`
- `docs/done-criteria.md`
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

## Apps

- `apps/api`: NestJS API (stubbed health + auth/audit scaffolding)
- `apps/worker`: NestJS worker process scaffold
- `apps/web`: Next.js web scaffold

## Local development

1. Copy environment variables:
   - `cp .env.example .env`
2. Start local dependencies:
   - `docker compose up -d`
3. Install dependencies:
   - `npm install`
4. Run tests:
   - `npm test`

## Suggested next step

Feed `docs/system-design.md`, `docs/security-rules.md`, and `codex-backlog.md` to Codex before implementation work begins.
