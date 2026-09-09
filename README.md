# Audio Transcription Annotation Tool

A web tool for medical professionals to correct and annotate AI-generated transcripts of clinical audio recordings.

## Quick Start

### 1. Start Database
```bash
docker compose up -d
```

### 2. Install Dependencies
```bash
cd apps/backend && yarn install
cd ../frontend && yarn install
cd ../..
```

### 3. Run Project
```bash
# Terminal 1 - Backend
cd apps/backend
yarn dev

# Terminal 2 - Frontend
cd apps/frontend
yarn dev
```

Visit `http://localhost:3000`

## Features

- 🎙️ Upload audio files (WAV, MP3, M4A)
- 📝 Upload AI transcripts (JSON format)
- 📊 Recording conditions panel (duration, sample rate, channels, bit depth)
- 🎯 Microphone distance & speech rate estimates
- ✏️ Edit and correct transcriptions
- 🏷️ Annotate spans with 7 medical types (1-7 keys for fast annotation)
- ⏱️ Play audio with keyboard shortcuts (P to play, J/L to seek, R to restart)
- 💾 Auto-save annotations and text
- 📤 Export corrected data as JSON

## Tech Stack

- **Backend**: Node 22, TypeScript, Express, Prisma, PostgreSQL
- **Frontend**: Vue 3, Composition API, Tailwind CSS
- **Database**: PostgreSQL 16

## Project Structure

```
apps/
├── backend/      # Express API
├── frontend/     # Vue 3 app
└── prisma/       # Database schema
```

## Database

PostgreSQL runs in Docker on `localhost:5432`:
- User: `postgres`
- Password: `demo-password-dev-only`
- Database: `clinical_audio_dev`

Stop database:
```bash
docker compose down
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/ingest` - Upload audio + transcripts
- `GET /api/queue` - Work queue with filtering
- `GET /api/transcript/:id` - Get transcript with annotations
- `PATCH /api/transcript/:id` - Save corrected text
- `GET /api/annotation?transcriptId=...` - Get annotations
- `POST /api/annotation` - Create annotation
- `DELETE /api/annotation/:id` - Delete annotation
- `GET /api/recording/:audioFileId` - Get recording metadata
- `PATCH /api/recording/:audioFileId` - Update recording metadata
- `POST /api/export` - Export all completed items

See [DESIGN.md](./DESIGN.md) for full API documentation.

## Documentation

- [DESIGN.md](./DESIGN.md) - Architecture and data model
- [PRODUCT.md](./PRODUCT.md) - Product requirements and workflow
- [.agents/](./.agents/) - Implementation workflow documents
