# Design (Base Structure)

This repository currently contains only the base project structure for an AI-augmented clinical audio transcription annotation tool.

## Scope in this commit

- Create the top-level monorepo-style folders:
  - `apps/backend`
  - `apps/frontend`
  - `tests`
  - `data/demo`
- Add minimal root files required by the requested structure:
  - `README.md`
  - `DESIGN.md`
  - `docker-compose.yml`
  - `package.json`

## Notes

- No application code is implemented yet.
- The structure is ready for a Node.js + TypeScript backend and a Vue 3 frontend.
- PostgreSQL service is declared in `docker-compose.yml` as the database baseline.
