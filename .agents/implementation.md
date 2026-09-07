# Implementation Agent

**Role**: Build the annotation tool end-to-end following the ARCHITECT, SECURITY, and TEST specifications.

## Deliverables

### Backend

1. **Database & ORM Setup**
   - `prisma/schema.prisma`: Complete schema with AudioFile, Transcript, Annotation, Recording entities
   - `prisma/migrations/`: Version-controlled migrations
   - Seed script: Generate demo data (2–3 audio files + transcripts)

2. **API Endpoints** (Express + TypeScript)
   - **POST /api/ingest**: Audio + transcript file upload, validation, pairing, persistence
   - **GET /api/queue**: List transcripts with filters (status, duration) and sort
   - **GET /api/transcript/:id**: Retrieve transcript (original + corrected)
   - **PATCH /api/transcript/:id**: Update corrected transcript text
   - **POST /api/annotation**: Create annotation span
   - **PATCH /api/annotation/:id**: Edit annotation attributes
   - **DELETE /api/annotation/:id**: Delete annotation
   - **GET /api/annotation/:transcriptId**: List all annotations for a transcript
   - **GET /api/recording/:audioFileId**: Retrieve recording conditions
   - **PATCH /api/recording/:audioFileId**: Update speech rate or distance estimate (user override)
   - **POST /api/export**: Export completed transcripts as JSONL

3. **Utilities**
   - `utils/audioMetadata.ts`: Extract duration, sample rate, channels, bit depth from .wav/.mp3/.m4a using ffmpeg-static
   - `utils/unitNormalization.ts`: Normalize units (mg→g, ml→l, mm→cm, etc.)
   - `utils/speechRate.ts`: Calculate words per minute (token count ÷ duration)
   - `utils/distanceEstimate.ts`: Estimate speaker distance from RMS/peak level (close/medium/far)

4. **Middleware**
   - Error handler: Return structured error responses (400, 409, 422 with detail messages)
   - Upload validator: Check file type (magic bytes), size, filename sanitization
   - CORS: Allow frontend localhost requests

5. **Controllers & Services**
   - Controllers: Parse requests, call services, return JSON
   - Services: Business logic (validation, pairing, normalization)
   - Repositories: Prisma wrappers (AudioFile, Transcript, Annotation CRUD)

### Frontend (Vue 3)

1. **Components**
   - **Upload.vue**: 
     - Drag-drop or file picker for audio (.wav, .mp3, .m4a)
     - JSON upload or paste transcript
     - Show pairing UI (matched/unmatched)
     - Manual drag-drop pairing
     - "Ingest" button triggers upload
   
   - **WorkQueue.vue**:
     - Table: filename, duration, status, annotator (label)
     - Filter: status (pending/in_progress/completed), duration range
     - Sort: by duration, by status
     - Click row → load into Editor
   
   - **Player.vue**:
     - HTML5 audio player (or Vue wrapper)
     - Play/pause button
     - Seek slider
     - Current time / total duration display
     - Playback speed selector (0.75x, 1x, 1.25x, 1.5x, 2x)
     - Keyboard shortcuts displayed (? key shows help):
       - `Space`: Play/pause
       - `→` / `←`: Skip ±1s
       - `+` / `−`: Speed ±0.25x
     - Click word in transcript → seek to timestamp (if available)
   
   - **Editor.vue**:
     - Two-column layout: original transcript (read-only) | corrected transcript (editable)
     - Highlight selected text for annotation
     - Character counter / position indicator
   
   - **Annotator.vue**:
     - Annotation type selector dropdown (CRUD, NUMBER, FORMATTING_COMMAND, SPELLED_OUT, NAMED_ENTITY, MEDICAL_TERM, MEASUREMENT)
     - Type-specific attribute input forms
     - Span list with create/edit/delete buttons
     - Visual highlighting of spans in transcript (overlapping spans layer via z-index)
     - Color code by type (e.g., red=MEDICAL_TERM, blue=MEASUREMENT)
   
   - **RecordingConditions.vue**:
     - Display: duration, sample rate, channels, bit depth
     - Display BEXT/LIST INFO metadata (if present)
     - Prefilled: speech rate (WPM), distance estimate (close/medium/far)
     - Editable overrides for both values
     - Show estimation method (e.g., "RMS level analysis")

2. **State Management (Pinia)**
   - `stores/annotationStore.ts`: 
     - Current transcript (original + corrected)
     - Current annotations (create/edit/delete actions)
     - Player state (current time, playing)
     - Persist to localStorage (auto-save)

3. **Styling**
   - Tailwind CSS (or similar utility framework)
   - Dark mode option (clinicians work long hours)
   - Responsive layout for typical desktop setups (1920x1080+)
   - Keyboard focus indicators (accessibility)

### Testing

1. **Unit Tests** (Jest)
   - `utils/unitNormalization.test.ts`: All unit conversions
   - `utils/speechRate.test.ts`: WPM calculation
   - `services/pairingService.test.ts`: Pairing algorithm

2. **Integration Tests** (Supertest + Jest)
   - Ingest workflow (upload → validate → pair → persist)
   - 15-second auto-rejection
   - Annotation CRUD
   - Export JSONL schema

3. **Test Database**
   - Use Docker Postgres test container or SQLite in memory for fast tests
   - Migrations run before each test suite

### Demo & Documentation

1. **Demo Data**
   - `data/demo/audio/`: 2–3 .wav files (10–30 seconds each)
     - Sample 1: ~20s, clean speech (test normal path)
     - Sample 2: ~10s (test auto-rejection)
     - Sample 3: ~45s with background noise (test distance estimate)
   - `data/demo/transcripts.json`: Matching transcripts with test content
   - `data/demo/seed.sh`: Script to load demo data into DB

2. **README.md** (updated)
   - Prerequisites: Node 22, Docker, ffmpeg (or ffmpeg-static auto-install)
   - Install: `npm install` (or `yarn install`)
   - Start DB: `docker compose up -d`
   - Init DB: `npm run prisma:migrate:dev`
   - Seed: `npm run seed`
   - Start backend: `npm run dev:backend`
   - Start frontend: `npm run dev:frontend`
   - Open browser: `http://localhost:3000`

3. **Running the Demo**
   - User opens browser, navigates to upload page
   - Drags demo audio files + transcripts.json
   - System auto-rejects the 10s file
   - User pairs remaining files (1–2 click)
   - User opens a transcript, plays audio, adds annotations
   - User exports JSONL

## Acceptance Criteria

- [ ] All endpoints implemented and tested
- [ ] Frontend renders correctly; audio plays
- [ ] Annotations persist and export to JSONL
- [ ] 15-second auto-rejection works
- [ ] Pairing logic matches expected behavior
- [ ] Unit normalization accurate
- [ ] Demo runs from fresh git clone
- [ ] README is complete and tested (someone follows it without asking questions)
- [ ] Code is TypeScript with no `any` types (strict mode)
- [ ] Tests pass (unit + integration)

## Notes

- Keyboard shortcuts are logged to console; help modal shows them
- Overlapping spans allowed; frontend renders with z-index layering
- Original transcript is not editable in the UI (read-only display)
- Corrected transcript is fully editable
- Pairing UI uses intuitive drag-drop; fallback click-to-pair for accessibility
- Audio player seeks to word timestamp only if transcript has time metadata (optional feature)
