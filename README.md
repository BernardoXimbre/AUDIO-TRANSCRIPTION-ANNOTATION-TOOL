# clinical-audio-annotation

Base structure for the AI-augmented clinical audio transcription annotation tool.

## Project Structure

```text
clinical-audio-annotation/
├── README.md
├── DESIGN.md
├── docker-compose.yml
├── package.json
├── apps/
│   ├── backend/
│   └── frontend/
├── tests/
└── data/
    └── demo/
```

## Current Status

This commit only establishes the base folder and file structure.
No backend/frontend implementation code has been added yet.

## Environment (for docker-compose baseline)

Set `POSTGRES_PASSWORD` before running Docker Compose.

Example:

```bash
export POSTGRES_PASSWORD=your-secure-password-here
docker compose up -d
```

Use a unique password. Do not reuse this example value outside local development.
