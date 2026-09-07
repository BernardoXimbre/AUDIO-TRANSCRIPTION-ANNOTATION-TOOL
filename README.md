# Clinical Audio Annotation Tool

A clinical audio transcription annotation workbench for German university hospitals. Doctors dictate surgical operation reports; an AI speech model produces a first-pass transcript. This tool lets human annotators correct and enrich transcripts with semantic annotations to create a gold standard dataset for model fine-tuning.

For detailed features and capabilities, see [PRODUCT.md](./PRODUCT.md).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the Application](#running-the-application)
4. [Demo](#demo)
5. [Project Structure](#project-structure)
6. [Documentation](#documentation)
7. [Development Workflow](#development-workflow)

---

## Prerequisites

- **Node.js 22** (LTS): [Download](https://nodejs.org/)
- **Docker & Docker Compose**: [Install](https://docs.docker.com/engine/install/)
- **Git**: [Install](https://git-scm.com/)
- **ffmpeg** (or `ffmpeg-static` auto-installed): For audio metadata extraction

### Verify Installation

```bash
node --version          # Should be v22.x or higher
docker --version        # Should be Docker 20.10+
docker compose version  # Should be Docker Compose 2.x+
git --version           # Should be Git 2.30+
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/BernardoXimbre/AUDIO-TRANSCRIPTION-ANNOTATION-TOOL.git
cd AUDIO-TRANSCRIPTION-ANNOTATION-TOOL
```

### 2. Install Dependencies

Using **Yarn** (recommended):

```bash
yarn install
```

Or using **Bun**:

```bash
bun install
```

Or using **npm**:

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Database
POSTGRES_DB=clinical_audio
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password-here
DATABASE_URL=postgresql://postgres:your-secure-password-here@localhost:5432/clinical_audio

# Node Environment
NODE_ENV=development

# Backend (if different from localhost:5000)
BACKEND_PORT=5000

# Frontend (if different from localhost:3000)
FRONTEND_PORT=3000

# Audio Storage
AUDIO_UPLOAD_DIR=./data/uploads
AUDIO_MAX_FILE_SIZE_MB=100
AUDIO_MAX_BATCH_SIZE_MB=500
```

**Note:** Replace `your-secure-password-here` with a strong password. Do not commit `.env` to git.

### 4. Start the Database

```bash
docker compose up -d
```

Verify PostgreSQL is running:

```bash
docker compose logs postgres
```

### 5. Initialize the Database

Run Prisma migrations:

```bash
yarn prisma migrate dev --name init
```

### 6. (Optional) Seed Demo Data

Load sample audio files and transcripts:

```bash
yarn seed
```

This creates 2–3 demo items in the database for immediate testing.

---

## Running the Application

### Development Mode

**Terminal 1: Start Backend**

```bash
yarn dev:backend
```

Expected output:
```
Server running on http://localhost:5000
```

**Terminal 2: Start Frontend**

```bash
yarn dev:frontend
```

Expected output:
```
VITE v4.x.x ready in xxx ms

➜  Local:   http://localhost:3000
```

### Open in Browser

Navigate to: **http://localhost:3000**

### Stop the Application

- Press `Ctrl+C` in each terminal
- Stop the database: `docker compose down`

---

## Demo

### Quick Start (< 1 minute)

After installation and running the app:

1. Navigate to **http://localhost:3000**
2. Go to **Upload** page
3. The demo data is already seeded (if you ran `yarn seed`)
4. View the work queue: **Work Queue** tab
5. Click an item to open the annotator
6. Play audio, edit transcript, create annotations
7. Export results: **Export** tab

### Demo Data Included

**Location:** `data/demo/`

- **audio/**: 2–3 .wav files (10–45 seconds each)
  - `sample_short.wav` (~10s) — Auto-rejected (< 15s)
  - `sample_clean.wav` (~20s) — Clean speech
  - `sample_noisy.wav` (~45s) — Background noise (tests distance estimate)

- **transcripts.json**: Corresponding AI transcripts (JSON array)

- **seed.sh**: Script to load demo data into database (called by `yarn seed`)

---

## Project Structure

```text
AUDIO-TRANSCRIPTION-ANNOTATION-TOOL/
├── README.md                           # This file
├── DESIGN.md                           # Architecture, data model, design decisions
├── PRODUCT.md                          # Product vision, problem, proposal, stack
├── docker-compose.yml                  # PostgreSQL service definition
├── package.json                        # Root monorepo configuration
│
├── .agents/                            # Development workflow (agents)
│   ├── architect.md                    # Data model & API route validation
│   ├── security.md                     # Upload validation & sanitization
│   ├── test.md                         # Regression test specifications
│   └── implementation.md               # Build specifications & deliverables
│
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── controllers/            # Route handlers
│   │   │   ├── services/               # Business logic
│   │   │   ├── repositories/           # Prisma ORM wrappers
│   │   │   ├── utils/                  # Audio metadata, unit normalization
│   │   │   ├── middleware/             # Upload validation, error handling
│   │   │   ├── types/                  # TypeScript interfaces
│   │   │   ├── app.ts                  # Express app setup
│   │   │   └── server.ts               # Server entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma           # Database schema
│   │   │   └── migrations/             # Version-controlled DB migrations
│   │   ├── package.json                # Backend dependencies
│   │   └── tsconfig.json               # TypeScript configuration
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/             # Vue components
│       │   │   ├── Upload.vue          # Audio + transcript upload
│       │   │   ├── WorkQueue.vue       # Filterable transcript list
│       │   │   ├── Player.vue          # Audio player with shortcuts
│       │   │   ├── Editor.vue          # Transcript editor
│       │   │   ├── Annotator.vue       # Annotation UI
│       │   │   └── RecordingConditions.vue  # Metadata display
│       │   ├── stores/                 # Pinia stores
│       │   │   └── annotationStore.ts  # Annotation state management
│       │   ├── App.vue                 # Root component
│       │   └── main.ts                 # Vue app entry point
│       ├── package.json                # Frontend dependencies
│       ├── tsconfig.json               # TypeScript configuration
│       ├── vite.config.ts              # Vite build configuration
│       └── tailwind.config.ts          # Tailwind CSS configuration
│
├── tests/
│   ├── unit/                           # Unit tests
│   │   ├── unitNormalization.test.ts
│   │   └── pairing.test.ts
│   ├── integration/                    # Integration tests
│   │   ├── ingest.test.ts
│   │   ├── annotation.test.ts
│   │   └── export.test.ts
│   └── setup.ts                        # Test configuration
│
├── data/
│   ├── demo/                           # Demo audio + transcripts
│   │   ├── audio/
│   │   │   ├── sample_short.wav        # ~10s (auto-rejected)
│   │   │   ├── sample_clean.wav        # ~20s
│   │   │   └── sample_noisy.wav        # ~45s
│   │   ├── transcripts.json            # AI transcripts JSON
│   │   └── seed.sh                     # Load demo data script
│   └── uploads/                        # User-uploaded audio (runtime)
```

---

## Documentation

### Key Documents

1. **[DESIGN.md](./DESIGN.md)** (1–2 pages)
   - Data model (Prisma schema)
   - Architecture (Controller → Service → Repository)
   - Design decisions & tradeoffs
   - What we cut for time
   - Next steps (roadmap)

2. **[PRODUCT.md](./PRODUCT.md)** (1 page)
   - Problem statement (clinical context)
   - Proposal (what we're building)
   - Tech stack with justification
   - Development workflow (agent pipeline)
   - Regression tests (critical paths)

3. **.agents/** (4 files)
   - **architect.md**: Validates data model, API routes, error handling
   - **security.md**: Upload validation, filename sanitization, attribute schema
   - **test.md**: 5 regression tests (15s rule, pairing, spans, units, export)
   - **implementation.md**: Build specs, components, utilities, testing strategy

---

## Development Workflow

### Agents (Workflow)

The project follows a structured agent-based workflow:

```
REQUIREMENTS
    ↓
[ARCHITECT] → Validates data model & API routes
    ↓
[SECURITY] → Upload validation & sanitization
    ↓
[TEST] → Regression test specs & coverage
    ↓
[IMPLEMENTATION] → Build the tool (UI + API)
    ↓
FINAL REVIEW → Demo + Testing
```

**How to use agents:**

Each `.agents/` file defines a role:
- **Architect**: Review schema and routes before coding
- **Security**: Validate upload handlers and input schemas
- **Test**: Write and run regression tests early
- **Implementation**: Build features incrementally, test after each

### Key Scripts

```bash
# Backend
yarn dev:backend              # Start backend in watch mode
yarn build:backend            # Build backend
yarn test:backend             # Run backend tests
yarn prisma:migrate:dev       # Run migrations (auto-reload schema)
yarn prisma:studio            # Open Prisma Studio (DB GUI)

# Frontend
yarn dev:frontend             # Start frontend dev server
yarn build:frontend           # Build frontend
yarn test:frontend            # Run frontend tests

# Utilities
yarn seed                      # Load demo data
yarn lint                      # Run linter (ESLint)
yarn format                    # Format code (Prettier)
yarn clean                     # Remove build artifacts and node_modules

# Database
docker compose up -d           # Start PostgreSQL
docker compose down            # Stop PostgreSQL
docker compose logs postgres   # View logs
```

---

## API Endpoints (Reference)

For detailed annotation types and attributes, see [DESIGN.md](./DESIGN.md#3-design-decisions--tradeoffs).

---

### Ingest

```
POST /api/ingest
  Audio files (.wav, .mp3, .m4a)
  Transcript JSON array or single item
  → Validates, pairs, persists
```

### Queue

```
GET /api/queue?status=pending&sortBy=duration&order=asc
  → List of transcripts with metadata
```

### Transcript

```
GET /api/transcript/:id
PATCH /api/transcript/:id { correctedText: "..." }
```

### Annotations

```
POST /api/annotation { transcriptId, type, startOffset, endOffset, attributes }
PATCH /api/annotation/:id { attributes }
DELETE /api/annotation/:id
GET /api/annotation/:transcriptId
```

### Recording Conditions

```
GET /api/recording/:audioFileId
PATCH /api/recording/:audioFileId { speechRate, distanceEstimate }
```

### Export

```
POST /api/export
  → JSONL dataset (one JSON object per line)
```

---

## Keyboard Shortcuts

When playing audio:

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `→` | Skip forward 1 second |
| `←` | Skip backward 1 second |
| `+` | Increase speed by 0.25x |
| `−` | Decrease speed by 0.25x |
| `?` | Show help modal |

---

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
docker compose up -d
docker compose logs postgres  # Check if PostgreSQL started
```

### Prisma Migration Error

```
Error: Migration failed
```

**Solution:**
```bash
docker compose down -v  # Remove volume
docker compose up -d    # Start fresh
yarn prisma migrate dev
```

### Audio Upload Fails

- Check file size (max 100 MB per file, 500 MB per batch)
- Verify file format (.wav, .mp3, .m4a only)
- Check `data/uploads` directory has write permissions

### Frontend Cannot Connect to Backend

- Verify backend is running: `yarn dev:backend` (should say "Server running on http://localhost:5000")
- Check CORS settings in `apps/backend/src/app.ts`
- Verify frontend `.env` has correct backend URL

---

## Testing

### Run All Tests

```bash
yarn test
```

### Run Specific Test Suite

```bash
yarn test unitNormalization     # Unit tests
yarn test integration           # Integration tests
```

### Test Coverage

```bash
yarn test:coverage
```

---

## Design Decisions

See [DESIGN.md](./DESIGN.md) for detailed discussion of:
- Why overlapping spans are allowed
- Why we use filesystem storage (not S3/MinIO for MVP)
- Why 15-second auto-rejection is deterministic
- Why derived values (speech rate, distance) are editable

---

## Out of Scope

This MVP does **not** include:
- Authentication / user management
- Multi-annotator workflows
- Automatic pre-annotation (NER, medical lookup)
- CI/CD, deployment, cloud infrastructure
- Actual speech model training

These features are documented in the roadmap section of [DESIGN.md](./DESIGN.md#6-next-steps-roadmap).

---

## Support

For questions or issues:
1. Check [DESIGN.md](./DESIGN.md) and [PRODUCT.md](./PRODUCT.md)
2. Review the relevant `.agents/` file
3. Check troubleshooting section above
4. Open a GitHub issue

---

## License

[Specify your license here]

---

## Author

Developed for clinical speech-to-text annotation at German university hospitals.

**Last Updated:** 2026-09-07
